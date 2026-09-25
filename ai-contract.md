# AI Contract — Gemini 프롬프트와 응답 계약

> `project_spec.md`의 5장(AI 동작 명세)을 구현 가능한 형태로 확정한 문서다.
> 이 문서와 `project_spec.md` 두 개면 프로젝트를 재현할 수 있다.

## 1. 공통 설정

| 항목 | 값 |
|---|---|
| 모델 | `gemini-3.5-flash-lite` (환경변수 `GEMINI_MODEL`) |
| SDK | `@google/genai` |
| 호출 | `ai.models.generateContent()` |
| 호출 위치 | Express 서버만. 앱은 Gemini를 직접 호출하지 않는다. |
| 이미지 전송 | 로컬 파일을 Base64로 읽어 `inlineData` |
| 응답 형식 | `responseMimeType: "application/json"` + `responseSchema` |
| 출력 언어 | 영어 |

프롬프트는 **2종**이다.

| 프롬프트 | 사용처 | 이미지 | 차이 |
|---|---|:-:|---|
| A. 최초 분석 | `POST /api/reports` | O | 음식을 AI가 인식 |
| B. 재분석 | `PUT /api/reports/:id` | O | 음식 목록을 사용자가 확정해서 전달 |

두 프롬프트는 동일한 JSON Schema를 사용한다.

---

## 2. 고정 어휘

프롬프트, Schema, DB, UI 전체에서 아래 표기 한 벌만 사용한다.

```js
const NUTRIENTS = ["Carbohydrates", "Protein", "Fat", "Fiber"];
const LEVELS    = ["high", "moderate", "low"];
const CONFIDENCE = ["high", "medium", "low"];
const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"];
```

`Dietary fiber`, `Complex carbohydrates`, `Healthy fats` 같은 변형 표기를 쓰지 않는다.

---

## 3. 프롬프트 A — 최초 분석

`{{MEAL_TYPE}}`는 사용자가 선택한 값으로 치환한다. 이미지는 `inlineData`로 함께 보낸다.

```text
You are a meal coach. You look at one meal photo and tell the user how balanced
it is and what is worth adding. You never tell the user what to eat instead.

Meal type selected by the user: {{MEAL_TYPE}}

TASK
1. Decide whether this image shows food or a meal. If it does not, set
   is_food_image to false, return empty arrays, and briefly say what you see
   in coach_note.headline.
2. List the foods you can actually see. Do not guess hidden ingredients.
3. Rate carbohydrates, protein, fat and fiber as "high", "moderate" or "low",
   judged relative to one another WITHIN THIS ONE MEAL. This is not the user's
   daily intake and not a medical assessment.
4. Choose the nutrient gaps.
   - A gap may ONLY be a nutrient you rated "low".
   - Choose at most two. If nothing is "low", return an empty array.
   - If three or more are "low", choose the two that stand out most.
5. For each gap, list three or four foods that would fill it.
   - Pick foods from different categories (animal, plant, dairy, grain).
   - Pick foods that could realistically be eaten ALONGSIDE what is in the
     photo, not a replacement meal.
6. Write coach_note.

COACH NOTE RULES — these decide whether this app is useful or generic.
- ALWAYS name the actual food you saw. Never write a generic sentence.
    BAD:  "Protein is low."
    GOOD: "Instant ramen has close to none."
- NEVER suggest a different meal or a menu. Only suggest ADDING something to
  what the user already has.
    BAD:  "Try a tofu salad for dinner instead."
    GOOD: "Cracking an egg into the broth is the easiest fix."
- If there are no gaps, say the meal looks balanced and stop. Do not invent a
  problem to sound useful.
- If something is "high", you may mention it, but do not tell the user to fix
  this meal. Frame it as something to keep in mind next time.
- headline: one sentence about THIS meal's overall shape.
- closing: one short, low-pressure sentence. It must be something the user
  could do without changing their plans.
- Each gap's "why" is one or two sentences: why that nutrient is missing from
  THIS food, and the easiest way to add it.

HARD RULES
- All user-facing text in English.
- No calorie numbers, no gram amounts, no percentages.
- No medical advice, no treatment claims, no weight-loss or health guarantees.
- Treat this as an estimate of one meal only.
- Match the required JSON schema exactly. Return JSON only.
```

---

## 4. 프롬프트 B — 재분석

`{{CORRECTED_FOODS}}`는 사용자가 확정한 음식명을 줄바꿈으로 구분한 목록으로 치환한다. 원본 이미지를 함께 보낸다.

```text
You are a meal coach. The user has corrected the food list for a meal photo
you analysed before. Their list is now the source of truth.

Meal type selected by the user: {{MEAL_TYPE}}

Foods confirmed by the user:
{{CORRECTED_FOODS}}

TASK
Using the confirmed food list together with the original image:
1. Re-rate carbohydrates, protein, fat and fiber as "high", "moderate" or
   "low" within this one meal.
2. Choose at most two nutrient gaps, ONLY from nutrients you rated "low".
   Return an empty array if nothing is "low".
3. For each gap, list three or four foods that would fill it.
4. Write coach_note.

FOOD LIST RULE — the server verifies this and rejects the response otherwise.
- detected_foods must contain EXACTLY the confirmed foods above.
- Same names, same spelling, same capitalisation, same order.
- Do not add a food. Do not remove a food. Do not rename a food.
- You may fill in estimated_portion and confidence for each one.

Set is_food_image to true, because the user is correcting an existing record.

All COACH NOTE RULES and HARD RULES from the initial analysis apply unchanged.
Return JSON only.
```

---

## 5. JSON Schema

두 프롬프트가 공유한다.

```js
const NUTRIENTS = ["Carbohydrates", "Protein", "Fat", "Fiber"];
const LEVELS = ["high", "moderate", "low"];

export const mealAnalysisSchema = {
  type: "object",
  required: ["is_food_image", "detected_foods", "balance", "nutrient_gaps", "coach_note"],
  properties: {
    is_food_image: { type: "boolean" },

    detected_foods: {
      type: "array",
      maxItems: 8,
      items: {
        type: "object",
        required: ["name", "estimated_portion", "confidence"],
        properties: {
          name:              { type: "string" },
          estimated_portion: { type: "string" },
          confidence:        { type: "string", enum: ["high", "medium", "low"] }
        }
      }
    },

    balance: {
      type: "object",
      required: ["carbohydrates", "protein", "fat", "fiber"],
      properties: {
        carbohydrates: { type: "string", enum: LEVELS },
        protein:       { type: "string", enum: LEVELS },
        fat:           { type: "string", enum: LEVELS },
        fiber:         { type: "string", enum: LEVELS }
      }
    },

    nutrient_gaps: {
      type: "array",
      maxItems: 2,
      items: {
        type: "object",
        required: ["nutrient", "why", "foods"],
        properties: {
          nutrient: { type: "string", enum: NUTRIENTS },
          why:      { type: "string" },
          foods: {
            type: "array",
            minItems: 3,
            maxItems: 4,
            items: { type: "string" }
          }
        }
      }
    },

    coach_note: {
      type: "object",
      required: ["headline", "closing"],
      properties: {
        headline: { type: "string" },
        closing:  { type: "string" }
      }
    }
  }
};
```

---

## 6. 서버 응답 검증

Structured Output은 JSON 문법만 보장한다. 의미는 서버가 검증한다. 하나라도 실패하면 DB에 저장하지 않는다.

| # | 검증 | 실패 시 |
|---|---|---|
| V-1 | `is_food_image`가 `false`면 중단 | `422 NO_MEAL_DETECTED` |
| V-2 | `detected_foods` 길이 1~8, 각 `name`이 빈 문자열이 아님 | `502 INVALID_AI_RESPONSE` |
| V-3 | `balance`의 4개 키가 모두 존재하고 값이 `high`/`moderate`/`low` 중 하나 | `502 INVALID_AI_RESPONSE` |
| V-4 | `nutrient_gaps` 길이 0~2 | `502 INVALID_AI_RESPONSE` |
| V-5 | **각 gap의 `nutrient`가 `balance`에서 `low`인 항목이어야 함** | `502 INVALID_AI_RESPONSE` |
| V-6 | gap의 `nutrient`에 중복 없음 | `502 INVALID_AI_RESPONSE` |
| V-7 | 각 gap의 `foods` 길이 3~4, 빈 문자열 없음, 중복 없음 | `502 INVALID_AI_RESPONSE` |
| V-8 | `coach_note.headline`, `coach_note.closing`이 빈 문자열이 아님 | `502 INVALID_AI_RESPONSE` |
| V-9 | **일반론 차단** — `headline`에 `detected_foods[].name` 중 하나가 포함되어야 함 | `502 INVALID_AI_RESPONSE` |
| V-10 | 재분석 시 `detected_foods[].name`이 입력 목록과 완전히 동일 (대소문자·순서 포함) | `502 FOOD_LIST_MISMATCH` |

### V-5 구현 예시

```js
const lowNutrients = Object.entries(result.balance)
  .filter(([, level]) => level === "low")
  .map(([key]) => key);            // ["protein", "fiber"]

const ok = result.nutrient_gaps.every(gap =>
  lowNutrients.includes(gap.nutrient.toLowerCase())
);
```

### V-9 구현 예시

코치 노트가 일반론으로 빠지는 것을 막는 검사다. 문자열 포함 검사 한 줄이면 된다.

```js
const headline = result.coach_note.headline.toLowerCase();
const mentionsFood = result.detected_foods.some(f => {
  const name = f.name.toLowerCase();
  // 마지막 단어로도 확인: "Instant ramen" → "ramen"
  const lastWord = name.split(" ").pop();
  return headline.includes(name) || headline.includes(lastWord);
});
```

`is_food_image`가 `false`인 경우에는 V-2부터 V-10을 건너뛴다.

**재시도하지 않는다.** 검증 실패 시 사용자에게 오류를 보여주고 다시 시도하게 한다. 자동 재시도는 응답 시간을 두 배로 늘리고 시연에서 대기가 길어진다.

---

## 7. 호출 의사코드

```js
import { GoogleGenAI } from "@google/genai";
import fs from "node:fs";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

async function analyse({ imagePath, mimeType, prompt }) {
  const base64 = fs.readFileSync(imagePath, { encoding: "base64" });

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [{
      role: "user",
      parts: [
        { inlineData: { mimeType, data: base64 } },
        { text: prompt }
      ]
    }],
    config: {
      responseMimeType: "application/json",
      responseSchema: mealAnalysisSchema,
      temperature: 0.4
    }
  });

  return JSON.parse(response.text);
}
```

`temperature: 0.4` — 너무 낮으면 매번 같은 문장이 나오고, 너무 높으면 규칙을 벗어난다.

---

## 8. 응답 예시

### 8.1 부족 2개 — 라면과 김치

```json
{
  "is_food_image": true,
  "detected_foods": [
    { "name": "Instant ramen", "estimated_portion": "about one bowl", "confidence": "high" },
    { "name": "Kimchi", "estimated_portion": "a small side", "confidence": "high" }
  ],
  "balance": {
    "carbohydrates": "high",
    "protein": "low",
    "fat": "moderate",
    "fiber": "low"
  },
  "nutrient_gaps": [
    {
      "nutrient": "Protein",
      "why": "Instant ramen has close to none. Cracking an egg into the broth is the easiest fix.",
      "foods": ["Egg", "Tofu", "Milk"]
    },
    {
      "nutrient": "Fiber",
      "why": "Kimchi helps a little, but that is about it. Any vegetable side counts.",
      "foods": ["Spinach side", "Bean sprouts", "Salad"]
    }
  ],
  "coach_note": {
    "headline": "This meal was mostly carbs — the noodles are doing almost all the work.",
    "closing": "Next time you have ramen, one egg and one vegetable side is enough."
  }
}
```

### 8.2 부족 1개 — 샐러드와 통밀빵

```json
{
  "is_food_image": true,
  "detected_foods": [
    { "name": "Green salad", "estimated_portion": "one large bowl", "confidence": "high" },
    { "name": "Cherry tomatoes", "estimated_portion": "a handful", "confidence": "high" },
    { "name": "Whole grain bread", "estimated_portion": "two slices", "confidence": "medium" }
  ],
  "balance": {
    "carbohydrates": "moderate",
    "protein": "low",
    "fat": "moderate",
    "fiber": "high"
  },
  "nutrient_gaps": [
    {
      "nutrient": "Protein",
      "why": "The salad and bread carry very little. Putting something on top of the salad is the simplest change.",
      "foods": ["Grilled chicken", "Boiled egg", "Chickpeas", "Feta"]
    }
  ],
  "coach_note": {
    "headline": "Vegetables are well covered here — fiber is the strongest part of this meal.",
    "closing": "Only protein is missing. The rest of this plate is fine as it is."
  }
}
```

### 8.3 부족 0개 — 삼겹살 정식

```json
{
  "is_food_image": true,
  "detected_foods": [
    { "name": "Grilled pork belly", "estimated_portion": "one serving", "confidence": "high" },
    { "name": "Steamed rice", "estimated_portion": "one bowl", "confidence": "high" },
    { "name": "Lettuce wraps", "estimated_portion": "a small plate", "confidence": "high" },
    { "name": "Soybean paste stew", "estimated_portion": "one small bowl", "confidence": "medium" }
  ],
  "balance": {
    "carbohydrates": "moderate",
    "protein": "high",
    "fat": "high",
    "fiber": "moderate"
  },
  "nutrient_gaps": [],
  "coach_note": {
    "headline": "This grilled pork set looks well balanced — rice, meat and vegetables are all on the table.",
    "closing": "Fat is on the higher side, which is expected with pork belly. Worth keeping in mind for the next meal rather than fixing this one."
  }
}
```

### 8.4 음식 사진이 아님

```json
{
  "is_food_image": false,
  "detected_foods": [],
  "balance": {
    "carbohydrates": "low",
    "protein": "low",
    "fat": "low",
    "fiber": "low"
  },
  "nutrient_gaps": [],
  "coach_note": {
    "headline": "This looks like a desk and a laptop rather than a meal.",
    "closing": "Please upload a clear photo of your food."
  }
}
```

서버는 `is_food_image: false`를 보면 `balance`와 `coach_note`를 쓰지 않고 `422 NO_MEAL_DETECTED`를 반환한다.

---

## 9. 반복 문제와 대응

같은 조건이면 LLM은 가장 전형적인 답으로 수렴한다. 아무 장치가 없으면 "단백질 부족 → 계란·닭가슴살·두부"가 매번 반복된다.

| 장치 | 효과 |
|---|---|
| 코치 노트에 음식 이름 강제 (V-9) | 문장이 사진마다 달라진다 |
| 보충 식품을 "같이 먹을 수 있는 것"으로 제한 | 파스타에 청국장이 나오지 않는다 |
| 식품을 서로 다른 범주에서 선택 | 계란·우유·치즈처럼 한쪽으로 쏠리지 않는다 |
| `mealType`을 프롬프트에 포함 | 아침이면 계란·요거트, 저녁이면 고기·생선 쪽으로 갈린다 |
| `temperature: 0.4` | 문장 표현에 변화를 준다 |

**한계를 인정한다.** 보충 식품 목록은 어느 정도 겹친다. 계란은 자주 나올 것이고, 그게 실제로 가장 접근성 좋은 단백질이므로 억지로 피하면 조언의 실용성이 떨어진다. 목표는 **식품 목록이 아니라 문장이 매번 이 식사에 대한 것**이 되는 것이다.

시연용 샘플 사진은 성격이 다른 것으로 준비한다 — 라면(부족 2개), 샐러드(부족 1개), 고기 정식(부족 0개).
