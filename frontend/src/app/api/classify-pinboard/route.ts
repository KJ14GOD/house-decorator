import { NextResponse } from "next/server";
import admin from "@/lib/firebase/firebase-admin";

// POST { pinboardId: string, save?: boolean }
// Classifies the pinboard thumbnail via Vision and returns { label, confidence }.

export async function POST(request: Request) {
  try {
    const { pinboardId, save } = await request.json();

    if (!pinboardId) {
      return NextResponse.json({ error: "pinboardId is required" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY not configured" }, { status: 500 });
    }

    const db = admin.firestore();
    const ref = db.collection("pinboards").doc(pinboardId);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Pinboard not found" }, { status: 404 });
    }

    const data = snap.data() as any;
    const thumbnail: string | undefined = data?.pinboard?.thumbnail;
    if (!thumbnail || typeof thumbnail !== "string") {
      return NextResponse.json({ error: "No thumbnail available for this pinboard" }, { status: 400 });
    }

    const prompt = `You are classifying a single snapshot of a whiteboard/pinboard.
Return a compact JSON ONLY: { "label": <one of: "house", "room layout", "sofa", "bed", "table", "chair", "person", "text", "other">, "confidence": <0..1> }.
Use "text" if it looks like handwriting/words. Use "other" when unsure.`;

    const body = {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: thumbnail } }
          ]
        }
      ],
      max_tokens: 120
    } as any;

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return NextResponse.json({ error: "Vision request failed", details: errText }, { status: 502 });
    }

    const out = await resp.json();
    const content: string = out?.choices?.[0]?.message?.content ?? "";

    let label = "other";
    let confidence = 0.5;
    try {
      const parsed = JSON.parse(content);
      if (typeof parsed?.label === "string") label = parsed.label.toLowerCase();
      if (typeof parsed?.confidence === "number") confidence = Math.max(0, Math.min(1, parsed.confidence));
    } catch {
      const lc = content.toLowerCase();
      if (lc.includes("house")) label = "house";
      else if (lc.includes("room") || lc.includes("layout")) label = "room layout";
      else if (lc.includes("sofa")) label = "sofa";
      else if (lc.includes("bed")) label = "bed";
      else if (lc.includes("chair")) label = "chair";
      else if (lc.includes("table")) label = "table";
      else if (lc.includes("text") || lc.includes("word") || lc.includes("handwriting")) label = "text";
      confidence = 0.6;
    }

    // Optionally persist
    if (save) {
      await ref.set({
        pinboard: {
          sketchLabel: { label, confidence, updatedAt: new Date() }
        },
        updatedAt: new Date(),
      }, { merge: true });
    }

    return NextResponse.json({ label, confidence, pinboardId });
  } catch (e) {
    console.error("classify-pinboard error", e);
    return NextResponse.json({ error: "Failed to classify pinboard" }, { status: 500 });
  }
}


