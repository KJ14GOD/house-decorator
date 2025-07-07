import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebase/firebase-admin';

// Use environment variable for OpenAI API key
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set in environment variables');
}

export const runtime = 'nodejs';

function createLocalTimeFromISO(dateString: string, offsetMinutes: number): Date {
  const offsetForString = -offsetMinutes;
  const hours = Math.floor(Math.abs(offsetForString) / 60);
  const minutes = Math.abs(offsetForString) % 60;
  const sign = offsetForString >= 0 ? '+' : '-';
  const offsetString = `${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  const isoString = `${dateString}T00:00:00.000${offsetString}`;
  return new Date(isoString);
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, roomState, messages: _messages, userId, timezoneOffset } = await req.json();

    if (!prompt || !roomState) {
      return NextResponse.json({ message: 'Prompt and roomState are required' }, { status: 400 });
    }

    const currentDate = new Date().toISOString().split('T')[0];

    const systemPrompt = `
You are an expert interior design assistant integrated into a 3D house decorator application. You are also a friendly conversationalist.
Users may refer to their saved rooms as "projects" or "designs". Treat these terms as synonyms for rooms.

The current date is ${currentDate}. When a user mentions a date without a year (e.g., "July 6th"), you must resolve it to a full YYYY-MM-DD date. Always assume the year is the current year (${currentDate.substring(0, 4)}).

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

1. Change a color: If the user asks to change a color, respond with a JSON object to update the color of a specific surface or object.
   - Action: 'change_color'
   - Target: The surface or object to change. For surfaces, must be one of: 'floorColor', 'ceilingColor', 'wallFrontColor', 'wallBackColor', 'wallLeftColor', 'wallRightColor'. For objects, use the object's name (case-insensitive match to block.name).
   - Value: The new color in hex format (e.g., '#FF0000').

   Example User Prompt: "Change the front wall to a light blue."
   Example AI Response:
   {
     "action": "change_color",
     "target": "wallFrontColor",
     "value": "#ADD8E6"
   }
   Example User Prompt: "Make the sofa red."
   Example AI Response:
   {
     "action": "change_color",
     "target": "sofa",
     "value": "#FF0000"
   }

2. Move an object: If the user asks to move an object, respond with a JSON object to update the position of a specific object.
   - Action: 'move_object'
   - Target: The object's name (case-insensitive match to block.name).
   - Value: An object with the new x, y, z coordinates (e.g., { x: 2, y: 0, z: 4 }).

   Example User Prompt: "Move the sofa to the corner."
   Example AI Response:
   {
     "action": "move_object",
     "target": "sofa",
     "value": { "x": 0, "y": 0, "z": 0 }
   }

3. Add an object: If the user asks to add an object, respond with a JSON object to add a new object to the room.
   - Action: 'add_object'
   - Target: The object's name. Must be one of: 'Single Bed', 'Double Bed', 'King Bed', 'Nightstand', 'Dresser', 'Sofa', 'Coffee Table', 'TV Stand', 'Armchair', 'Dining Table', 'Dining Chair', 'Kitchen Island', 'Refrigerator', 'Desk', 'Office Chair', 'Bookshelf', 'Door', 'Window'.
   - Value: An object with the x, y, z coordinates (e.g., { x: 2, y: 0, z: 4 }).

   Example User Prompt: "Add a new armchair at x=3, y=0, z=5."
   Example AI Response:
   {
     "action": "add_object",
     "target": "armchair",
     "value": { "x": 3, "y": 0, "z": 5 }
   }

4. Remove an object: If the user asks to remove an object, respond with a JSON object to remove an existing object from the room.
   - Action: 'remove_object'
   - Target: The name of the object to remove (case-insensitive match to block.name).

   Example User Prompt: "Remove the sofa."
   Example AI Response:
   {
     "action": "remove_object",
     "target": "sofa"
   }

5. Set room dimensions: If the user asks to set the room dimensions, respond with a JSON object to update the width, length, and height of the room.
   - Action: 'set_room_dimensions'
   - Value: An object with the new width, length, and height in feet (e.g., { width: 10, length: 12, height: 8 }).

   Example User Prompt: "Make the room 10 feet wide, 12 feet long, and 8 feet high."
   Example AI Response:
   {
     "action": "set_room_dimensions",
     "value": { "width": 10, "length": 12, "height": 8 }
   }

6. List saved rooms: If the user asks to see a list of their saved rooms, use this action.
   - Action: 'list_rooms'
   - Value: An object that can contain:
     - \`limit\`: (Optional) Number of rooms to return. ALWAYS include this if the user specifies a number (e.g., "first 3 rooms", "last 5 rooms").
     - \`from\`: (Optional) The start date in YYYY-MM-DD format, for a date range.
     - \`to\`: (Optional) The end date in YYYY-MM-DD format, for a date range.
     - \`onDate\`: (Optional) Get all rooms created on a specific date.
     - \`beforeDate\`: (Optional) Get all rooms created before this date.
     - \`afterDate\`: (Optional) Get all rooms created after this date.
     - \`order\`: (Optional) "asc" for oldest/first, "desc" for newest/last. Default is "desc".
  
    Use "order": "asc" when the user refers to the **first**, **earliest**, or **oldest** rooms.

    Use "order": "desc" when the user refers to the **last**, **recent**, or **latest** rooms.

    Example Prompt: "Show me my first 3 projects."
    Example Response:
    {
      "action": "list_rooms",
      "value": { "limit": 3, "order": "asc" }
    }

    Example Prompt: "Show me my last 2 rooms."
    Example Response:
    {
      "action": "list_rooms",
      "value": { "limit": 2, "order": "desc" }
    }

    Example Prompt: "Show me rooms I made before July 6th"
    Example Response:
    {
      "action": "list_rooms",
      "value": { "beforeDate": "2024-07-06" }
    }

    Example Prompt: "Show me rooms I made on July 6th, 2025"
    Example Response:
    {
      "action": "list_rooms",
      "value": { "onDate": "2025-07-06" }
    }

    Example Prompt: "Show me rooms I made after June 1st"
    Example Response:
    {
      "action": "list_rooms",
      "value": { "afterDate": "2024-06-01" }
    }

7. Get information about rooms: If the user asks for a count of their rooms, use this action.
   - Action: 'get_room_info'
   - Value: Must be the string 'count'.

    Example Prompt: "How many rooms have I created?"
    Example Response: { "action": "get_room_info", "value": "count" }

8. Get details about a specific room by its order: If the user asks about the "first", "second", "last", etc., room, use this action.
   - Action: 'get_nth_room_details'
   - Value: The position of the room. First is 1, second is 2. Last is -1, second to last is -2.
   - The AI must convert ordinal words (first, second, third, last) into numbers.

   Example Prompt: "what is the first room i created"
   Example Response: { "action": "get_nth_room_details", "value": 1 }

   Example Prompt: "tell me about the third project"
   Example Response: { "action": "get_nth_room_details", "value": 3 }

   Example Prompt: "what was the last room i created"
   Example Response: { "action": "get_nth_room_details", "value": -1 }

9. Find a room by its name: If the user asks to find a specific room by its name.
   - Action: 'find_room_by_name'
   - Value: The name of the room to find. The match will be case-insensitive and can be partial.

   Example Prompt: "is there a room named Kartik"
   Example Response: { "action": "find_room_by_name", "value": "Kartik" }

Guidelines:

- If the user's request is a simple greeting (e.g., "Hi", "Hello"), respond with a friendly greeting.
- If the user's request is ambiguous, ask for clarification.
- If the request is a command to change a color or move an object, ONLY respond with the JSON action object(s). Do not add any extra text.
- If the user asks to change the color or move multiple surfaces or objects (e.g., "all walls", "move both beds"), ALWAYS return an array of action objects, one for each surface or object. For "all walls", return actions for 'wallFrontColor', 'wallBackColor', 'wallLeftColor', and 'wallRightColor'.
- For objects, match the target to the object's name in the room (case-insensitive). For example, to change the color or move a sofa, use target: 'sofa'.
- If the user is asking for an opinion or a suggestion, provide a helpful, concise response in plain text.
- Analyze the 'roomState' to give relevant advice. For example, if the room is small, suggest lighter colors. If objects are poorly placed, suggest better arrangements.
- Keep your text responses friendly and professional.
- Do not answer questions that are not related to interior design or the current room. Politely decline to answer.
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
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
    console.log('AI Response:', aiResponse);

    if (aiResponse.trim().startsWith('{') || aiResponse.trim().startsWith('[')) {
      try {
        const jsonResponse = JSON.parse(aiResponse);
        
        if (jsonResponse.action === 'list_rooms') {
          const { limit, from, to, onDate, beforeDate, afterDate, order } = jsonResponse.value || {};
          if (!userId) {
            return NextResponse.json({ message: 'User not authenticated' }, { status: 401 });
          }
        
          const db = admin.firestore();
          let roomsQuery: admin.firestore.Query = db.collection('rooms').where('userId', '==', userId);
        
          if (from) {
            roomsQuery = roomsQuery.where('createdAt', '>=', createLocalTimeFromISO(from, timezoneOffset || 0));
          }
          if (to) {
            roomsQuery = roomsQuery.where('createdAt', '<=', createLocalTimeFromISO(to, timezoneOffset || 0));
          }
          if (onDate) {
            const startOfDay = createLocalTimeFromISO(onDate, timezoneOffset || 0);
            const endOfDay = new Date(startOfDay);
            endOfDay.setHours(23, 59, 59, 999);
            roomsQuery = roomsQuery.where('createdAt', '>=', startOfDay).where('createdAt', '<=', endOfDay);
          }
          if (beforeDate) {
            roomsQuery = roomsQuery.where('createdAt', '<', createLocalTimeFromISO(beforeDate, timezoneOffset || 0));
          }
          if (afterDate) {
            const startDate = createLocalTimeFromISO(afterDate, timezoneOffset || 0);
            startDate.setDate(startDate.getDate() + 1);
            roomsQuery = roomsQuery.where('createdAt', '>=', startDate);
          }
        
          roomsQuery = roomsQuery.orderBy('createdAt', order === 'asc' ? 'asc' : 'desc');

          if (limit) {
            roomsQuery = roomsQuery.limit(Number(limit));
          }

          const snapshot = await roomsQuery.get();
          const rooms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          
          return NextResponse.json({
            action: 'list_rooms',
            preamble: "Of course! I've found these recent projects for you:",
            rooms,
          });
        }

        if (jsonResponse.action === 'find_room_by_name') {
          if (!userId) {
            return NextResponse.json({ message: 'User not authenticated' }, { status: 401 });
          }
          const roomNameToFind = jsonResponse.value;
          if (!roomNameToFind) {
            return new NextResponse("Please provide a name to search for.", { headers: { 'Content-Type': 'text/plain' } });
          }

          const db = admin.firestore();
          const roomsRef = db.collection('rooms').where('userId', '==', userId);
          const snapshot = await roomsRef.get();

          if (snapshot.empty) {
            return new NextResponse("You haven't created any rooms yet.", { headers: { 'Content-Type': 'text/plain' } });
          }
          
          type Room = { id: string; name: string; [key: string]: any };
          const rooms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room));
          const foundRoom = rooms.find(room => room.name.toLowerCase().includes(roomNameToFind.toLowerCase()));

          if (foundRoom) {
            return NextResponse.json({
              action: 'list_rooms', // Re-use the list_rooms action to display the card
              preamble: `Yes, I found a project named '${foundRoom.name}'. Here it is:`,
              rooms: [foundRoom],
            });
          } else {
            return new NextResponse(`Sorry, I couldn't find a project with a name matching "${roomNameToFind}".`, { headers: { 'Content-Type': 'text/plain' } });
          }
        }

        if (jsonResponse.action === 'get_room_info') {
          if (!userId) {
            return NextResponse.json({ message: 'User not authenticated' }, { status: 401 });
          }

          const db = admin.firestore();
          const roomsRef = db.collection('rooms').where('userId', '==', userId);
          let responseText = "I couldn't find that information.";

          if (jsonResponse.value === 'count') {
            const countSnapshot = await roomsRef.count().get();
            const count = countSnapshot.data().count;
            responseText = `You have created ${count} room${count === 1 ? '' : 's'} in total.`;
          }
          return new NextResponse(responseText, { headers: { 'Content-Type': 'text/plain' } });
        }

        if (jsonResponse.action === 'get_nth_room_details') {
          if (!userId) {
            return NextResponse.json({ message: 'User not authenticated' }, { status: 401 });
          }
          const n = Number(jsonResponse.value);
          if (isNaN(n) || n === 0) {
            return new NextResponse("Please specify which room you'd like to know about.", { headers: { 'Content-Type': 'text/plain' } });
          }

          const db = admin.firestore();
          const roomsRef = db.collection('rooms').where('userId', '==', userId);

          const countSnapshot = await roomsRef.count().get();
          const totalRooms = countSnapshot.data().count;

          if (totalRooms === 0) {
            return new NextResponse("You haven't created any rooms yet.", { headers: { 'Content-Type': 'text/plain' } });
          }
          
          const isForward = n > 0;
          const index = isForward ? n - 1 : -n -1;

          if (index >= totalRooms) {
            let requestedNString = '';
            if (isForward) {
              switch(n) {
                case 1: requestedNString = 'first'; break;
                case 2: requestedNString = 'second'; break;
                case 3: requestedNString = 'third'; break;
                default: requestedNString = `${n}th`; break;
              }
            } else {
              switch(n) {
                case -1: requestedNString = 'last'; break;
                case -2: requestedNString = 'second to last'; break;
                default: requestedNString = `${-n}th to last`; break;
              }
            }
            return new NextResponse(`You asked for your ${requestedNString} room, but you only have ${totalRooms} in total.`, { headers: { 'Content-Type': 'text/plain' } });
          }
          
          const sortOrder = isForward ? 'asc' : 'desc';
          const roomSnapshot = await roomsRef.orderBy('createdAt', sortOrder).offset(index).limit(1).get();

          if (roomSnapshot.empty) {
            // This is a fallback, should be caught by the count check above
            return new NextResponse("I couldn't find that specific room.", { headers: { 'Content-Type': 'text/plain' } });
          }

          const roomData = roomSnapshot.docs[0].data();
          const roomName = roomData.name || 'Untitled';
          const createdDate = roomData.createdAt.toDate().toLocaleDateString();
          
          let positionDescriptor = '';
          if (isForward) {
            switch(n) {
                case 1: positionDescriptor = 'Your first'; break;
                case 2: positionDescriptor = 'Your second'; break;
                case 3: positionDescriptor = 'Your third'; break;
                default: positionDescriptor = `Your ${n}th`; break;
              }
          } else {
            switch(n) {
                case -1: positionDescriptor = 'Your last'; break;
                case -2: positionDescriptor = 'Your second to last'; break;
                default: positionDescriptor = `Your ${-n}th to last`; break;
              }
          }

          return new NextResponse(`${positionDescriptor} room is named '${roomName}' and was created on ${createdDate}.`, { headers: { 'Content-Type': 'text/plain' } });
        }

        return NextResponse.json(jsonResponse);
      } catch (_e) {
        // The response is not a valid JSON, so return it as plain text.
        return new NextResponse(aiResponse, { headers: { 'Content-Type': 'text/plain' } });
      }
    }

    return new NextResponse(aiResponse, { headers: { 'Content-Type': 'text/plain' } });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}