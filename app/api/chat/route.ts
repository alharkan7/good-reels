import { GoogleGenAI } from '@google/genai';

export async function POST(request: Request) {
  const { articleTitle, articleExtract, messages } = await request.json();

  if (!process.env.GEMINI_API_KEY) {
    return Response.json(
      { error: 'GEMINI_API_KEY not configured' },
      { status: 500 }
    );
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const systemPrompt = `You are a helpful, friendly, and enthusiastic assistant embedded in a Wikipedia article viewer app called "Good Reels". 

The user is currently viewing this Wikipedia article:

**Title:** ${articleTitle}

**Content:**
${(articleExtract || '').slice(0, 4000)}

Your role:
- Answer questions about this article clearly and concisely.
- If the user asks something not covered in the article, say so honestly but try to provide helpful general knowledge.
- Respond in the same language the user uses (Bahasa Indonesia or English).
- Keep responses concise — this is a mobile chat, not an essay.
- Be engaging and curious — encourage the user to explore more.
- Use markdown formatting sparingly (bold for emphasis is fine, but avoid headers or long lists).`;

  const contents = (messages as Array<{ role: string; text: string }>).map(
    (msg) => ({
      role: msg.role === 'user' ? ('user' as const) : ('model' as const),
      parts: [{ text: msg.text }],
    })
  );

  try {
    const response = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: systemPrompt,
        maxOutputTokens: 1024,
        temperature: 0.7,
      },
      contents,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            const text = chunk.text || '';
            if (text) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
              );
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } catch (err) {
          console.error('Stream error:', err);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`
            )
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return Response.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}
