import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const modelUrl = searchParams.get("url");

  if (!modelUrl) {
    return new NextResponse("URL parameter is missing", { status: 400 });
  }

  try {
    const response = await fetch(modelUrl);
    if (!response.ok) {
      return new NextResponse("Failed to fetch model", { status: response.status });
    }

    const modelData = await response.arrayBuffer();

    return new NextResponse(modelData, {
      headers: {
        "Content-Type": "model/gltf-binary",
      },
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return new NextResponse("Error fetching the model.", { status: 500 });
  }
}
