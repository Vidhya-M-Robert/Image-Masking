import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI();   // creates a client for communicating with OpenAI

export async function GET() {
  const response = await client.responses.create({   //sends the request to the model
    model: "gpt-6-luna",                           //tells the API which model to use
    input: "Explain OCR in one simple sentence.",   //contains the qn you want the model to answer
  });

  return NextResponse.json({             // sends the result back to the browser as JSON
    result: response.output_text,        // retrieves the generated text
  });
}
