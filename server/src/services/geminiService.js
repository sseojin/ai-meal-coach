import { readFile } from 'node:fs/promises';
import { GoogleGenAI } from '@google/genai';
import { validateMealAnalysis } from '../utils/aiValidators.js';

const LEVELS = ['high', 'moderate', 'low'];
const NUTRIENTS = ['Carbohydrates', 'Protein', 'Fat', 'Fiber'];

const string = { type: 'string' };
export const mealAnalysisSchema = {
  type: 'object',
  required: ['is_food_image', 'detected_foods', 'balance', 'nutrient_gaps', 'coach_note'],
  properties: {
    is_food_image: { type: 'boolean' },
    detected_foods: {
      type: 'array', maxItems: 8,
      items: {
        type: 'object', required: ['name', 'estimated_portion', 'confidence'],
        properties: { name: string, estimated_portion: string, confidence: { type: 'string', enum: ['high', 'medium', 'low'] } },
      },
    },
    balance: {
      type: 'object', required: ['carbohydrates', 'protein', 'fat', 'fiber'],
      properties: Object.fromEntries(['carbohydrates', 'protein', 'fat', 'fiber'].map((key) => [key, { type: 'string', enum: LEVELS }])),
    },
    nutrient_gaps: {
      type: 'array', maxItems: 2,
      items: {
        type: 'object', required: ['nutrient', 'why', 'foods'],
        properties: {
          nutrient: { type: 'string', enum: NUTRIENTS }, why: string,
          foods: { type: 'array', minItems: 3, maxItems: 4, items: string },
        },
      },
    },
    coach_note: { type: 'object', required: ['headline', 'closing'], properties: { headline: string, closing: string } },
  },
};

const COMMON_RULES = `
COACH NOTE RULES
- Name an actual food in the headline. Never write a generic sentence.
- Suggest only ADDING something alongside the current meal, never a replacement meal or menu.
- If there are no gaps, say the meal looks balanced and do not invent a problem.
- A high nutrient may be mentioned only as something to keep in mind next time.
- headline: one sentence about this meal's overall shape.
- closing: one short, low-pressure sentence that does not change the user's plans.
- Each gap's why: one or two sentences about this food and the easiest addition.

HARD RULES
- All user-facing text in English.
- No calories, grams, percentages, medical advice, treatment claims, or health guarantees.
- Estimate this one meal only. Return JSON matching the schema, and nothing else.`;

function promptFor(mealType, foods) {
  if (foods !== undefined) return `You are a meal coach. The user corrected a food list for a meal photo. Their list is the source of truth.
Meal type selected by the user: ${mealType}
Foods confirmed by the user, in exact order: ${JSON.stringify(foods)}

Using the confirmed list and original image, re-rate carbohydrates, protein, fat and fiber as high, moderate or low within this one meal. Choose at most two gaps, only from low nutrients; return none if nothing is low. For each gap list three or four foods from different categories that could be eaten alongside this meal. Write coach_note.
detected_foods must contain EXACTLY the confirmed names with the same spelling, capitalisation and order. Do not add, remove or rename foods. You may estimate portion and confidence. Set is_food_image to true.
${COMMON_RULES}`;

  return `You are a meal coach. Look at one meal photo and tell the user how balanced it is and what is worth adding. Never tell them what to eat instead.
Meal type selected by the user: ${mealType}

1. If the image does not show food or a meal, set is_food_image to false, return empty arrays, and briefly say what you see in coach_note.headline.
2. List only foods actually visible. Do not guess hidden ingredients.
3. Rate carbohydrates, protein, fat and fiber as high, moderate or low relative to one another within this meal, not daily intake or a medical assessment.
4. Gaps may ONLY be nutrients rated low. Choose at most two, none if nothing is low; if three or more are low, choose the two most prominent.
5. For each gap, list three or four foods from different categories (animal, plant, dairy, grain) that could realistically be eaten alongside this meal.
6. Write coach_note.
${COMMON_RULES}`;
}

export async function analyzeMeal({ imagePath, mimeType, mealType, foods }) {
  const base64 = (await readFile(imagePath)).toString('base64');
  let response;
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
      contents: [{ role: 'user', parts: [
        { inlineData: { mimeType, data: base64 } },
        { text: promptFor(mealType, foods) },
      ] }],
      config: { responseMimeType: 'application/json', responseSchema: mealAnalysisSchema, temperature: 0.4 },
    });
  } catch (cause) {
    const error = new Error('We could not analyze the meal right now. Please try again.', { cause });
    error.code = 'GEMINI_REQUEST_FAILED';
    error.status = 502;
    throw error;
  }

  let result;
  try {
    result = JSON.parse(response.text);
  } catch {
    const error = new Error('We could not analyze the meal right now. Please try again.');
    error.code = 'INVALID_AI_RESPONSE';
    error.status = 502;
    throw error;
  }
  return validateMealAnalysis(result, foods);
}
