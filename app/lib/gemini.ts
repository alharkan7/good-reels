import { GoogleGenAI } from '@google/genai';

function getAI() {
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
}

export async function isContentSafe(title: string, extract: string): Promise<boolean> {
  if (!process.env.GEMINI_API_KEY) {
    return true;
  }

  const prompt = `You are a content filter for a feel-good Wikipedia article viewer app.
Determine if the following Wikipedia article is suitable for a positive, uplifting browsing experience.

REJECT articles about:
- Wars, battles, massacres, genocide
- Serial killers, murderers, criminals
- Diseases, pandemics, epidemics
- Natural disasters with high death tolls
- Scandals, corruption
- Terrorism, extremism
- Torture, abuse
- Dark/disturbing historical events
- Controversial political figures known for violence/oppression

ACCEPT articles about:
- Nature, animals, plants
- Cities, geography, landmarks
- Culture, art, music, food
- Sports, athletes
- Science, technology, inventions
- Architecture, buildings
- Festivals, traditions
- Everyday objects, concepts
- Biographies of positive/neutral public figures

Article Title: ${title}
Article Summary: ${extract}

Respond with ONLY "TRUE" if the article is suitable, or "FALSE" if it should be rejected. Nothing else.`;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    const text = response.text?.trim().toUpperCase();
    return text === 'TRUE';
  } catch (error) {
    console.error('Gemini moderation error:', error);
    return false;
  }
}
