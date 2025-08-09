import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { prompt, roomState, messages: _messages, userId, timezoneOffset, multiAgentMode, userPreferences } = await req.json();

    if (!prompt || !roomState) {
      return NextResponse.json({ message: 'Prompt and roomState are required' }, { status: 400 });
    }

    if (!multiAgentMode) {
      return NextResponse.json({ message: 'Multi-agent mode not enabled' }, { status: 400 });
    }

    const multiAgentRequest = {
      user_input: prompt,
      room_state: {
        width: roomState.width,
        length: roomState.length,
        height: roomState.height,
        floorColor: roomState.floorColor,
        ceilingColor: roomState.ceilingColor,
        wallFrontColor: roomState.wallFrontColor,
        wallBackColor: roomState.wallBackColor,
        wallLeftColor: roomState.wallLeftColor,
        wallRightColor: roomState.wallRightColor,
        blocks: roomState.blocks.map((block: any) => ({
          name: block.name,
          width: block.width,
          height: block.height,
          depth: block.depth,
          x: block.x,
          y: block.y,
          z: block.z,
          color: block.color,
        })),
      },
      conversation_history: [],
      user_preferences: userPreferences || {},
    };

    const upstream = await fetch('http://127.0.0.1:8001/multi-agent-design-stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(multiAgentRequest),
    });

    if (!upstream.ok || !upstream.body) {
      let errorJson: any = undefined;
      try { errorJson = await upstream.json(); } catch {}
      return NextResponse.json({ message: 'Error from multi-agent system', error: errorJson || null }, { status: upstream.status });
    }

    return new Response(upstream.body as unknown as ReadableStream, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error in multi-agent chat API (stream proxy):', error);
    return NextResponse.json({ 
      message: 'Internal Server Error', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}