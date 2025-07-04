import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  // Log to terminal
  // eslint-disable-next-line no-console
  console.log('[MOVE DEBUG]', JSON.stringify(body, null, 2));
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
} 