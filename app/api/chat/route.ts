import { GoogleGenAI } from '@google/genai';

export async function POST(request: Request) {
  const { articleTitle, articleExtract, messages } = await request.json();

  if (!process.env.GEMINI_API_KEY) {
    return Response.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const truncatedExtract = (articleExtract || '').slice(0, 30000);

  const systemPrompt = `You are a helpful, friendly, and knowledgeable assistant embedded in a Wikipedia article viewer app called "Good Reels".

The user is currently viewing this Wikipedia article:

**Title:** ${articleTitle}

**Full Article Content:**
${truncatedExtract}

Your role:
- Answer questions about this article thoroughly using the full article content above.
- You are NOT limited to only the article text. Use your own knowledge and capabilities to provide comprehensive answers.
- If the user asks about related topics, broader context, or anything beyond the article, answer freely using your general knowledge.
- You may use Google Search to find up-to-date or supplementary information when helpful.
- Respond in the same language the user uses (Bahasa Indonesia or English).
- Keep responses informative but concise — this is a mobile chat.
- Be engaging and encourage the user to explore more.
- Use markdown formatting sparingly (bold for emphasis is fine).`;

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
        maxOutputTokens: 2048,
        temperature: 0.7,
        tools: [{ googleSearch: {} }],
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
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } catch (err) {
          console.error('Stream error:', err);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return Response.json({ error: 'Failed to generate response' }, { status: 500 });
  }
}
