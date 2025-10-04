import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { message } = await request.json();
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'Missing OpenAI API key.' }, { status: 500 });
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: message }],
      max_tokens: 150,
    }),
  });

  const data = await response.json();
  const reply = data.choices?.[0]?.message?.content || 'Sorry, no response.';

  return NextResponse.json({ reply });
}
