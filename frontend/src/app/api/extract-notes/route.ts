import { NextResponse } from "next/server";
import admin from "@/lib/firebase/firebase-admin";

export async function POST(request: Request) {
  try {
    const { pinboardId } = await request.json();

    if (!pinboardId) {
      return NextResponse.json(
        { error: "Pinboard ID is required" },
        { status: 400 }
      );
    }

    // Get pinboard data from Firebase Admin
    const db = admin.firestore();
    const pinboardRef = db.collection("pinboards").doc(pinboardId);
    const pinboardSnap = await pinboardRef.get();

    if (!pinboardSnap.exists) {
      return NextResponse.json(
        { error: "Pinboard not found" },
        { status: 404 }
      );
    }

    const pinboardData = pinboardSnap.data();
    console.log("Pinboard data found:", !!pinboardData);
    
    // Extract notes from the pinboard
    const notes = pinboardData?.pinboard?.notes || [];
    console.log("Raw notes array:", notes);

    // Filter and format notes
    const extractedNotes = notes
      .filter((note: any) => {
        // Filter out empty notes or default placeholder text
        return note.text && 
               note.text.trim() !== "" && 
               note.text.trim() !== "Write your idea...";
      })
      .map((note: any) => ({
        id: note.id,
        text: note.text.trim(),
      }));

    console.log("Filtered notes:", extractedNotes);

    // Extract and analyze images
    const images = Array.isArray(pinboardData?.pinboard?.images) ? pinboardData.pinboard.images : [];
    const extractedImages = await Promise.all(images.map(async (img: any) => {
      const isDataUrl = typeof img?.src === 'string' ? img.src.startsWith('data:') : false;
      
      let description = 'Image present';
      
      // Analyze image content if it's a data URL
      if (isDataUrl && img.src) {
        try {
          // Use OpenAI Vision to analyze the image
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                {
                  role: 'user',
                  content: [
                    {
                      type: 'text',
                      text: 'Describe this image in 1-2 sentences, focusing on objects, colors, style, and any design elements relevant for interior decorating.'
                    },
                    {
                      type: 'image_url',
                      image_url: {
                        url: img.src
                      }
                    }
                  ]
                }
              ],
              max_tokens: 150
            })
          });

          if (response.ok) {
            const result = await response.json();
            description = result.choices[0]?.message?.content || 'Image present';
          }
        } catch (error) {
          console.error('Error analyzing image:', error);
        }
      }
      
      return {
        id: img?.id,
        srcType: isDataUrl ? 'data-url' : (img?.src ? 'url' : 'unknown'),
        src: isDataUrl ? undefined : img?.src,
        left: img?.left ?? 0,
        top: img?.top ?? 0,
        scaleX: img?.scaleX ?? 1,
        scaleY: img?.scaleY ?? 1,
        angle: img?.angle ?? 0,
        description: description
      };
    }));

    // Create summary text including image descriptions
    const allNotesText = extractedNotes.map((note: any) => note.text).join(" | ");
    const imageDescriptions = extractedImages
      .map((img: any) => `${img.description}`)
      .join(" | ");
    
    const imagesSummary = extractedImages.length > 0
      ? `Images: ${imageDescriptions}`
      : `Images: 0`;

    return NextResponse.json({
      success: true,
      pinboardId,
      notes: extractedNotes,
      images: extractedImages,
      summary: allNotesText ? `${allNotesText} || ${imagesSummary}` : imagesSummary,
      totalNotes: extractedNotes.length,
      totalImages: extractedImages.length
    });

  } catch (error) {
    console.error("Error extracting notes:", error);
    return NextResponse.json(
      { 
        error: "Failed to extract notes", 
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

