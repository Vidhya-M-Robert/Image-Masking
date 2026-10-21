// import { vehicleDetailsExtractionSchema } from "@/app/lib/vehicle-extraction";
// import { NextResponse } from "next/server";
// import OpenAI from "openai";
// import { zodTextFormat } from "openai/helpers/zod";

// const apiKey = process.env.OPENAI_API_KEY;

// if (!apiKey) {
//   throw new Error("OPENAI_API_KEY is not configured");
// }

// const client = new OpenAI({ apiKey });

// const vehicleExtractionDetails = `Read this vehicle document.

// Extract only vehicle-related details that are
// clearly visible, such as make, model, registration
// number, engine capacity and year of manufacture.

// Do not extract names, addresses or other personal
// information. Do not guess missing or uncertain values.
// Return the extracted details as plain text for now.`

// export async function POST(request: Request) {
//   try {
//     const formData = await request.formData(); //receives the uploaded file
//     const file = formData.get("file");

//     if (!(file instanceof File)) {
//       //checks whether file is a File object
//       return NextResponse.json(
//         { error: "Please upload an image." },
//         { status: 400 },
//       );
//     }
//     const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

//     if (!allowedTypes.includes(file.type)) {
//       //check allowed MIME type
//       return NextResponse.json(
//         { error: "Only JPG, PNG and WebP images are allowed." },
//         { status: 400 },
//       );
//     }

//     if (file.size > 5 * 1024 * 1024) {
//       //check if size within the limit
//       return NextResponse.json(
//         { error: "Image must be 5 MB or smaller." },
//         { status: 400 },
//       );
//     }

//     const bytes = await file.arrayBuffer(); // reads the image's binary data as image contains binary data
//     const base64 = Buffer.from(bytes).toString("base64"); //Converts the binary image data into Base64 text      Buffer => Node.js class for working with binary data
//     const imageUrl = `data:${file.type};base64,${base64}`; //Creates a data URL containing the image.

//     const response = await client.responses.parse({
//       model: "gpt-6-luna",
//       store: false, // requests that the API response not be stored for later retrieval.
//       input: [
//         {
//           role: "user",
//           content: [
//             {
//               type: "input_text", // input tells the model what to extract
//               text: vehicleExtractionDetails,
//             },
//             {
//               type: "input_image", // tells the API that this input is an image , it accepts a url
//               image_url: imageUrl,
//               detail: "high", //   requests high detail image processing
//             },
//           ],
//         },
//       ],
//       text: {
//         format: zodTextFormat(
//           vehicleDetailsExtractionSchema,
//           "vehicle_extraction",
//         ),
//       },
//     });
//     if (!response.output_parsed) {
//       return NextResponse.json(
//         { error: "Could not extract vehicle details." },
//         { status: 422 },
//       );
//     }

//     return NextResponse.json({
//       result: response.output_parsed,
//     });
//   } catch (error) {
//     console.error("Image processing failed:", error);

//     return NextResponse.json(
//       { error: "Image processing failed." },
//       { status: 500 },
//     );
//   }
// }
