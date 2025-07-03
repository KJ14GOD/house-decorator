import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { prompt, roomState } = await req.json();

    if (!prompt || !roomState) {
      return NextResponse.json({ message: 'Prompt and roomState are required' }, { status: 400 });
    }

    const systemPrompt = `
You are an expert interior design assistant integrated into a 3D house decorator application. You are also a friendly conversationalist.

You will receive the user's request and the current state of their 3D room.
The room state is a JSON object with the following structure:
${JSON.stringify(
  {
    width: 12,
    length: 12,
    height: 8,
    floorColor: '#e3e3e3',
    ceilingColor: '#e3e3e3',
    wallFrontColor: '#e3e3e3',
    wallBackColor: '#e3e3e3',
    wallLeftColor: '#e3e3e3',
    wallRightColor: '#e3e3e3',
    blocks: [
      {
        name: 'Sofa',
        width: 7,
        height: 2.5,
        depth: 3,
        x: 2.5,
        y: 0,
        z: 4.5,
        color: '#4A5568',
      },
    ],
  },
  null,
  2
)}

Based on the user's prompt and the room state, you must decide whether to provide a text-based suggestion or to perform an action.

Available Actions:

1. Change a color: If the user asks to change a color, respond with a JSON object to update the color of a specific surface.
   - Action: 'change_color'
   - Target: The surface to change. Must be one of: 'floorColor', 'ceilingColor', 'wallFrontColor', 'wallBackColor', 'wallLeftColor', 'wallRightColor'.
   - Value: The new color in hex format (e.g., '#FF0000').

   Example User Prompt: "Change the front wall to a light blue."
   Example AI Response:
   {
     "action": "change_color",
     "target": "wallFrontColor",
     "value": "#ADD8E6"
   }

Guidelines:

- If the user's request is a simple greeting (e.g., "Hi", "Hello"), respond with a friendly greeting.
- If the user's request is ambiguous, ask for clarification.
- If the request is a command to change a color, ONLY respond with the JSON action object. Do not add any extra text.
- If the user is asking for an opinion or a suggestion, provide a helpful, concise response in plain text.
- Analyze the 'roomState' to give relevant advice. For example, if the room is small, suggest lighter colors. If objects are poorly placed, suggest better arrangements.
- Keep your text responses friendly and professional.
- Do not answer questions that are not related to interior design or the current room. Politely decline to answer.
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer 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`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Room State: ${JSON.stringify(roomState)}

User Request: ${prompt}` },
        ],
        max_tokens: 200,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API Error:', errorData);
      return NextResponse.json({ message: 'Error from OpenAI API', error: errorData }, { status: response.status });
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    try {
      const jsonResponse = JSON.parse(aiResponse);
      return NextResponse.json(jsonResponse);
    } catch (e) {
      return NextResponse.json({ response: aiResponse });
    }
  } catch (error) {
    console.error('Server-side Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}