import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { message } = await request.json();
  const bpApiKey = process.env.BOTPRESS_API_KEY;
  const bpBotId = process.env.BOTPRESS_BOT_ID;

  if (!bpApiKey || !bpBotId) {
    return NextResponse.json({ error: 'Missing Botpress API key or Bot ID.' }, { status: 500 });
  }

  // Botpress Cloud API endpoint
  const bpEndpoint = `https://api.botpress.cloud/v1/bots/${bpBotId}/converse`;

  try {
    const response = await fetch(bpEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bpApiKey}`,
      },
      body: JSON.stringify({ messages: [{ type: 'text', text: message }] }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Botpress API error:', {
        status: response.status,
        statusText: response.statusText,
        endpoint: bpEndpoint,
        requestBody: { messages: [{ type: 'text', text: message }] },
        responseData: data
      });
      return NextResponse.json({ error: data.error?.message || 'Botpress API error.' }, { status: 500 });
    }

    // Botpress response format: { responses: [{ type: 'text', text: '...' }, ...] }
    const reply = data.responses?.[0]?.text || 'Sorry, no response.';
    return NextResponse.json({ reply });
  } catch (err) {
    console.error('Botpress API fetch failed:', err);
    return NextResponse.json({ error: 'Botpress API fetch failed.' }, { status: 500 });
  }
}

