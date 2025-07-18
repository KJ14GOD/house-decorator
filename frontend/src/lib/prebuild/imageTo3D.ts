// frontend/src/lib/prebuild/imageTo3D.ts

export type RoomModelResult = {
  isRoom: boolean;
  message: string;
  // Real 3D model data from backend
  modelData?: any;
};

/**
 * Analyzes an image to check if it's a room, then builds a 3D model if it is.
 * @param file The uploaded image file
 * @returns RoomModelResult with real 3D model data if it's a room
 */
export async function analyzeAndBuildRoomModel(file: File): Promise<RoomModelResult> {
  try {
    // Step 1: Check if the image is a room using FastAPI server
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to validate image');
    }

    const validationResult = await response.json();
    
    // Step 2: If it's not a room, throw an error
    if (!validationResult.is_room) {
      throw new Error(validationResult.message || 'This image does not appear to be a room. Please upload a room photo.');
    }

    // Step 3: If it is a room, use the real 3D model data from backend
    // The backend now generates real 3D model data when a room is detected
    const modelData = validationResult.model_data;

    if (!modelData) {
      throw new Error('Failed to generate 3D model data from the room image.');
    }

    return {
      isRoom: true,
      message: validationResult.message || 'Room model created successfully!',
      modelData: modelData
    };

  } catch (error) {
    // Re-throw the error so the UI can handle it
    throw error;
  }
} 