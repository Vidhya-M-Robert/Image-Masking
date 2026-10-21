import { numberPlateSchema } from "@/app/lib/vehicle-extraction";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import sharp from "sharp";

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error("OPENAI_API_KEY is not configured");
}

const client = new OpenAI({ apiKey });

const numberPlateDetection = `Analyze the uploaded car image and locate every visible vehicle number plate that still needs masking.
Rules:
Detect every visible vehicle number plate that is not already masked, covered, or sufficiently blurred.
Do not detect plates that have already been masked.
Do not read, extract, or return any registration numbers.
Return exactly one bounding box for each number plate that needs masking.
Use normalized coordinates from 0 to 1000, relative to the full image dimensions.
x and y represent the left and top edges of the bounding box.
width and height represent the full width and height of the bounding box.
Bounding box accuracy requirements:
Carefully identify the exact outer boundaries of each number plate before determining its coordinates.
Cover the ENTIRE number plate, including all registration characters, the complete plate background, and every visible edge and border.
Extend the bounding box slightly beyond the outer edges of the plate on all sides to prevent any part of the plate from remaining visible.
Prefer complete coverage over a tight fit. A slightly larger box is acceptable, but avoid covering unnecessary parts of the vehicle.
Do not crop, exclude, or leave any portion of the plate uncovered, including its corners, edges, or border.
If the plate is tilted or viewed at an angle, ensure the bounding box covers its entire visible area, including the outermost corners.
Carefully verify the left, top, right, and bottom boundaries before returning the coordinates.
Convert the final boundaries accurately into normalized coordinates from 0 to 1000.
Ensure x, y, width, and height are valid, positive where applicable, and that the entire bounding box remains within the image boundaries.
Final verification:
Before returning each bounding box, verify that the complete plate would be covered by a rectangular mask placed at those coordinates.
If any part of the plate would remain visible, adjust the bounding box to include it.
If no unmasked number plate needs masking, return an empty array.
Return only the structured output matching the required schema. Do not include explanations or registration numbers.`;

export async function POST(request: Request) {
  try {
    const formData = await request.formData(); //receives the uploaded file
    const file = formData.get("file");

    if (!(file instanceof File)) {
      //checks whether file is a File object
      return NextResponse.json(
        { error: "Please upload a car image." },
        { status: 400 },
      );
    }
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      //check allowed MIME type
      return NextResponse.json(
        { error: "Only JPG, PNG and WebP images are allowed." },
        { status: 400 },
      );
    }

    if (file.size === 0 || file.size > 5 * 1024 * 1024) {
      //check if size within the limit
      return NextResponse.json(
        { error: "Image must be greater than 0 bytes and 5 MB or smaller." },
        { status: 400 },
      );
    }

    const originalBytes = Buffer.from(await file.arrayBuffer());

    const bytes = await sharp(originalBytes) //creates a Sharp image-processing instance using the uploaded image data.
      .rotate() //Automatically applies the image's EXIF orientation, if present
      .jpeg({ quality: 95 }) //converts the image into jpeg format at quality 95
      .toBuffer(); //processes the image and returns the resulting binary data as a Buffer.

    const metadata = await sharp(bytes).metadata();

    if (!metadata.width || !metadata.height) {
      return NextResponse.json(
        { error: "Could not read image dimensions." },
        { status: 422 },
      );
    }

    const imageDataUrl = `data:image/jpeg;base64,${bytes.toString("base64")}`; //converts the image to a data url for openAI

    const response = await client.responses.parse({
      model: "gpt-6.1-sol",
      store: false, // requests that the API response not be stored for later retrieval.
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text", // input tells the model what to extract
              text: numberPlateDetection,
            },
            {
              type: "input_image", // tells the API that this input is an image , it accepts a url
              image_url: imageDataUrl,
              detail: "high", //   requests high detail image processing
            },
          ],
        },
      ],
      text: {
        format: zodTextFormat(numberPlateSchema, "plate_detection"),
      },
    });

    const result = response.output_parsed;
    if (!result) {
      return NextResponse.json(
        { error: "Could not detect number plates." },
        { status: 422 },
      );
    }

    if (result.numberPlateBoxes.length === 0) {
      return new Response(new Uint8Array(bytes), {
        status: 200,
        headers: {
          "Content-Type": "image/jpeg",
          "Cache-Control": "no-store",
          "X-Number-Plate-Detected": "false",
        },
      });
    }

    const invalidBox = result.numberPlateBoxes.some((box) => {
      return (
        ![box.x, box.y, box.width, box.height].every(Number.isFinite) || //checks if every value is a finite number
        box.x < 0 || //Check that the position is not negative
        box.y < 0 ||
        box.width <= 0 || //Check that width and height are positive
        box.height <= 0 ||
        box.x + box.width > 1000 || //Check that the box stays inside the image
        box.y + box.height > 1000
      );
    });

    if (invalidBox) {
      return NextResponse.json(
        { error: "Invalid number plate coordinates." },
        { status: 422 },
      );
    }

    const width = metadata.width; //represent the actual dimensions of the processed image in pixels.
    const height = metadata.height;

    //convert normalized coordinates into pixel coordinates
    const rectangles = result.numberPlateBoxes.map((box) => {
      const left = Math.floor((box.x / 1000) * width);
      const top = Math.floor((box.y / 1000) * height);

      const right = Math.ceil(((box.x + box.width) / 1000) * width);
      const bottom = Math.ceil(((box.y + box.height) / 1000) * height);

      return {
        left,
        top,
        width: right - left,
        height: bottom - top,
      };
    });

    const svg = `
  <svg xmlns="http://www.w3.org/2000/svg"
       width="${width}" height="${height}">
    ${rectangles
      .map(
        (rect) => `
          <rect
            x="${rect.left}"
            y="${rect.top}"
            width="${rect.width}"
            height="${rect.height}"
            fill="#000000"
          />
        `,
      )
      .join("")}
  </svg>
`;

    const maskedImage = await sharp(bytes) //bytes contains the processed car image.
      .composite([
        //composite() places another image or graphic on top of the base image.
        {
          input: Buffer.from(svg), //converts the SVG text into a buffer that Sharp can process.
          left: 0, //places the overlay at the left edge.
          top: 0, //places the overlay at the top edge.
        },
      ])
      .jpeg({ quality: 95 }) //Convert the result to JPEG
      .toBuffer();

    return new Response(new Uint8Array(maskedImage), {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg", //tells browser that the response is an image
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Image processing failed:", error);

    return NextResponse.json(
      { error: "Image processing failed." },
      { status: 500 },
    );
  }
}

//Uploaded file converted to image bytes
//OpenAI detects number plates => Returns normalized bounding boxes
//Validate and convert coordinates => Normalized coordinates → pixel coordinates
//Sharp applies black masks => SVG rectangles are composited onto the photo
//Return the masked JPEG

// rectangles.map() creates a rectangle for each detected plate.
// The SVG string describes where those rectangles should appear.
// sharp(bytes) loads the car image.
// .composite() draws the SVG overlay on top.
// .jpeg() encodes the result as a JPEG.
// .toBuffer() gives you the final masked image data.
