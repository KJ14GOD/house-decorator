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

    // Create summary text
    const allNotesText = extractedNotes.map((note: any) => note.text).join(" | ");

    return NextResponse.json({
      success: true,
      pinboardId,
      notes: extractedNotes,
      summary: allNotesText,
      totalNotes: extractedNotes.length
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
