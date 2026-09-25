import assert from 'node:assert/strict';
import test from 'node:test';
import { validateMealAnalysis } from '../src/utils/aiValidators.js';

const meal = () => ({
  is_food_image: true,
  detected_foods: [{ name: 'Instant ramen', estimated_portion: 'one bowl', confidence: 'high' }],
  balance: { carbohydrates: 'high', protein: 'low', fat: 'moderate', fiber: 'moderate' },
  nutrient_gaps: [{ nutrient: 'Protein', why: 'Ramen lacks protein; add an egg.', foods: ['Egg', 'Tofu', 'Milk'] }],
  coach_note: { headline: 'Instant ramen is mostly carbohydrates.', closing: 'An egg would fit.' },
});

test('accepts a valid meal and an exact corrected food list', () => {
  assert.equal(validateMealAnalysis(meal()).detected_foods[0].name, 'Instant ramen');
  assert.equal(validateMealAnalysis(meal(), ['Instant ramen']).detected_foods[0].name, 'Instant ramen');
});

test('rejects nonfood and a changed corrected food list with distinct codes', () => {
  const nonfood = meal();
  nonfood.is_food_image = false;
  assert.throws(() => validateMealAnalysis(nonfood), { status: 422, code: 'NO_MEAL_DETECTED' });
  assert.throws(() => validateMealAnalysis(meal(), ['instant ramen']), { status: 502, code: 'FOOD_LIST_MISMATCH' });
  const changed = meal();
  changed.detected_foods[0].name = 'Egg';
  assert.throws(() => validateMealAnalysis(changed, ['Instant ramen']), { status: 502, code: 'FOOD_LIST_MISMATCH' });
});

test('rejects invalid structure and inconsistent nutrition advice', () => {
  const cases = [
    (value) => { value.detected_foods[0].name = ''; },
    (value) => { value.detected_foods[0].confidence = 'sure'; },
    (value) => { value.balance.protein = 'unknown'; },
    (value) => { value.nutrient_gaps[0].nutrient = 'Fiber'; },
    (value) => { value.nutrient_gaps.push(value.nutrient_gaps[0]); },
    (value) => { value.nutrient_gaps[0].foods = ['Egg', 'Egg', 'Milk']; },
    (value) => { value.coach_note.headline = 'Protein is low.'; },
  ];
  for (const change of cases) {
    const value = meal();
    change(value);
    assert.throws(() => validateMealAnalysis(value), { status: 502, code: 'INVALID_AI_RESPONSE' });
  }
});
