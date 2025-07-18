import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const photoPerspective = formData.get('photo_perspective') as string;
    
    if (!file) {
      console.error('No file uploaded');
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    console.log('File received for model generation:', file.name, file.size, file.type);

    const fastApiUrl = 'http://127.0.0.1:8000/generate-room-model';
    
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('photo_perspective', photoPerspective);

    console.log('Forwarding to FastAPI server for model generation:', fastApiUrl);

    const response = await fetch(fastApiUrl, {
      method: 'POST',
      body: uploadFormData,
    });

    console.log('FastAPI model generation response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('FastAPI model generation server error:', errorText);
      throw new Error(`FastAPI server responded with status: ${response.status}. Error: ${errorText}`);
    }

    const result = await response.json();
    console.log('FastAPI model generation result:', result);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error in model generation route:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate model',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}