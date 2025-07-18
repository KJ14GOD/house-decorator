import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      console.error('No file uploaded');
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    console.log('File received:', file.name, file.size, file.type);

    // Forward the file to your FastAPI server
    const fastApiUrl = 'http://127.0.0.1:8000/check-room-and-objects';
    
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    console.log('Forwarding to FastAPI server:', fastApiUrl);

    const response = await fetch(fastApiUrl, {
      method: 'POST',
      body: uploadFormData,
    });

    console.log('FastAPI response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('FastAPI server error:', errorText);
      throw new Error(`FastAPI server responded with status: ${response.status}. Error: ${errorText}`);
    }

    const result = await response.json();
    console.log('FastAPI result:', result);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error in upload route:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}