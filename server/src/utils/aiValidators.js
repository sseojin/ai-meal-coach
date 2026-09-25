const LEVELS = new Set(['high', 'moderate', 'low']);
const CONFIDENCE = new Set(['high', 'medium', 'low']);
const NUTRIENTS = ['Carbohydrates', 'Protein', 'Fat', 'Fiber'];

function aiError(code, status) {
  const message = code === 'NO_MEAL_DETECTED'
    ? 'We could not identify a meal in this image. Please upload a clear food photo.'
    : 'We could not analyze the meal right now. Please try again.';
  const error = new Error(message);
  error.code = code;
  error.status = status;
  return error;
}

const nonempty = (value) => typeof value === 'string' && value.trim().length > 0;

export function validateMealAnalysis(result, foods) {
  if (!result || typeof result !== 'object' || Array.isArray(result)) {
    throw aiError('INVALID_AI_RESPONSE', 502);
  }
  if (result.is_food_image === false) throw aiError('NO_MEAL_DETECTED', 422);

  const detected = result.detected_foods;
  const balance = result.balance;
  const gaps = result.nutrient_gaps;
  const note = result.coach_note;
  const validDetected = Array.isArray(detected) && detected.length >= 1 && detected.length <= 8
    && detected.every((food) => food && nonempty(food.name)
      && typeof food.estimated_portion === 'string' && CONFIDENCE.has(food.confidence));
  if (!validDetected) throw aiError('INVALID_AI_RESPONSE', 502);
  if (foods !== undefined && (!Array.isArray(foods)
    || detected.length !== foods.length
    || detected.some((food, index) => food.name !== foods[index]))) {
    throw aiError('FOOD_LIST_MISMATCH', 502);
  }

  const valid = result.is_food_image === true
    && balance && typeof balance === 'object'
    && NUTRIENTS.every((nutrient) => LEVELS.has(balance[nutrient.toLowerCase()]))
    && Array.isArray(gaps) && gaps.length <= 2
    && gaps.every((gap) => gap && NUTRIENTS.includes(gap.nutrient)
      && balance[gap.nutrient.toLowerCase()] === 'low' && nonempty(gap.why)
      && Array.isArray(gap.foods) && gap.foods.length >= 3 && gap.foods.length <= 4
      && gap.foods.every(nonempty) && new Set(gap.foods).size === gap.foods.length)
    && new Set(gaps.map((gap) => gap.nutrient)).size === gaps.length
    && note && nonempty(note.headline) && nonempty(note.closing)
    && detected.some(({ name }) => {
      const lowerName = name.toLowerCase();
      const lastWord = lowerName.trim().split(/\s+/).pop();
      const headline = note.headline.toLowerCase();
      return headline.includes(lowerName) || headline.includes(lastWord);
    });
  if (!valid) throw aiError('INVALID_AI_RESPONSE', 502);

  return result;
}
