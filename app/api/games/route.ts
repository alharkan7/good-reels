import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type, Schema } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const schema: Schema = {
  type: Type.OBJECT,
  properties: {
    gameType: { 
      type: Type.STRING, 
      description: "One of: 'quiz', 'true_false', 'word_scramble', 'fill_in_the_blank', 'fun_fact', 'swipe_cards', 'match_pairs', 'timeline_sorter', 'categorization_buckets', 'scratch_off'" 
    },
    quiz: {
      type: Type.OBJECT,
      properties: {
        question: { type: Type.STRING },
        choices: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Array of 4 possible answers" },
        correctAnswer: { type: Type.STRING, description: "Must match one of the choices exactly" },
      },
      description: "Required if gameType is 'quiz'"
    },
    trueFalse: {
      type: Type.OBJECT,
      properties: {
        statement: { type: Type.STRING },
        isTrue: { type: Type.BOOLEAN },
        explanation: { type: Type.STRING },
      },
      description: "Required if gameType is 'true_false'"
    },
    wordScramble: {
      type: Type.OBJECT,
      properties: {
        scrambledWord: { type: Type.STRING },
        originalWord: { type: Type.STRING },
        hint: { type: Type.STRING },
      },
      description: "Required if gameType is 'word_scramble'"
    },
    fillInTheBlank: {
      type: Type.OBJECT,
      properties: {
        sentenceWithBlank: { type: Type.STRING, description: "Use '___' for the blank" },
        missingWord: { type: Type.STRING },
      },
      description: "Required if gameType is 'fill_in_the_blank'"
    },
    funFact: {
      type: Type.OBJECT,
      properties: {
        fact: { type: Type.STRING },
        elaboration: { type: Type.STRING },
      },
      description: "Required if gameType is 'fun_fact'"
    },
    swipeCards: {
      type: Type.OBJECT,
      properties: {
        cards: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              statement: { type: Type.STRING },
              isFact: { type: Type.BOOLEAN, description: "True if fact, False if myth" },
              explanation: { type: Type.STRING }
            }
          },
          description: "Exactly 3 or 4 statements"
        }
      },
      description: "Required if gameType is 'swipe_cards'"
    },
    matchPairs: {
      type: Type.OBJECT,
      properties: {
        pairs: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              left: { type: Type.STRING, description: "A concept, name, or date" },
              right: { type: Type.STRING, description: "The matching description or event" }
            }
          },
          description: "Exactly 3 or 4 pairs"
        }
      },
      description: "Required if gameType is 'match_pairs'"
    },
    timelineSorter: {
      type: Type.OBJECT,
      properties: {
        events: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING, description: "Description of the event" },
              order: { type: Type.INTEGER, description: "Correct chronological order (1 is first, 2 is second, etc.)" }
            }
          },
          description: "Exactly 3 or 4 events"
        }
      },
      description: "Required if gameType is 'timeline_sorter'"
    },
    categorizationBuckets: {
      type: Type.OBJECT,
      properties: {
        category1: { type: Type.STRING, description: "Name of the first bucket" },
        category2: { type: Type.STRING, description: "Name of the second bucket" },
        items: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              category: { type: Type.INTEGER, description: "1 for category1, 2 for category2" }
            }
          },
          description: "Exactly 4 items"
        }
      },
      description: "Required if gameType is 'categorization_buckets'"
    },
    scratchOff: {
      type: Type.OBJECT,
      properties: {
        fullSentence: { type: Type.STRING, description: "A highly interesting summary sentence from the article" },
        wordsToHide: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING },
          description: "1 or 2 exact keywords found in fullSentence to be scratched off" 
        }
      },
      description: "Required if gameType is 'scratch_off'"
    }
  },
  required: ['gameType']
};

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      // Fallback if no API key
      return NextResponse.json({
        gameType: 'true_false',
        trueFalse: {
          statement: 'Set GEMINI_API_KEY to see dynamic AI games!',
          isTrue: true,
          explanation: 'The app needs a Gemini API key to generate content.'
        }
      });
    }

    const { title, extract, lang, typePreference } = await req.json();

    const types = [
      'quiz', 'true_false', 'word_scramble', 'fill_in_the_blank', 'fun_fact',
      'swipe_cards', 'match_pairs', 'timeline_sorter', 'categorization_buckets', 'scratch_off'
    ];
    const selectedType = typePreference || types[Math.floor(Math.random() * types.length)];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Create a ${selectedType} game about the following article. The game MUST be in ${lang === 'id' ? 'Indonesian' : 'English'}.
      
      Article Title: ${title}
      Article Summary: ${extract}
      
      Make it engaging and appropriate for a short TikTok/Reels-like format. Output strictly following the provided JSON schema. Ensure the required object for the chosen gameType is present.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    return NextResponse.json(parsed);

  } catch (error: unknown) {
    console.error('Games API error:', error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
