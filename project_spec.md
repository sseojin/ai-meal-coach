# AI Meal Coach — Phase 1 Project Specification

> 문서 상태: 구현 기준선(Baseline)
> 명세 버전: 2.0
> 작성 언어: 한국어 · 제품 UI 언어: 영어
> 대상 과제: Software Engineering Phase 1 Scratch Project
> 프로젝트 유형: 2인 페어 프로젝트 · 로컬 실행

## 관련 문서

| 문서 | 내용 |
|---|---|
| `project_spec.md` | 이 문서 — 제품 정의, 기능, 화면, 데이터, API |
| `ai-contract.md` | Gemini 프롬프트 전문, JSON Schema, 응답 검증 규칙 |
| `README.md` | 설치·실행 방법, 환경변수, 네트워크 설정 |
| `team-plan.md` | 역할 분담, 구현 순서, 시연 시나리오 (팀 내부용) |

재현을 목적으로 이 프로젝트를 다시 만들 때 필요한 문서는 `project_spec.md`와 `ai-contract.md` 두 개다.

---

## 1. 문서 목적

이 문서는 제3자가 별도 설명 없이 **AI Meal Coach**와 동일한 기능의 앱을 재구현할 수 있도록 목적, 기능, 화면, 데이터 구조, API를 정의한다. 여기에 정의하지 않은 기능은 구현 범위에 포함하지 않는다.

구현 중 선택지가 생기면 다음 순서로 결정한다.

1. 본 명세의 명시적 요구사항
2. 하루 안에 완성 가능한 단순성
3. 3분 시연에서 안정적으로 재현되는가
4. 시각적 화려함보다 기능의 완결성

생성형 AI는 비결정적이므로 같은 사진에 대한 문장이 매번 동일하지는 않다. 이 문서가 보장하는 재현 범위는 **동일한 화면 구조, 데이터 계약, 기능 흐름, CRUD 동작, 출력 형식**이다.

---

## 2. 프로젝트 개요

### 2.1 프로젝트명

- 영문명: **AI Meal Coach**
- 부제: **Photo-Based Nutrition Feedback**

### 2.2 한 줄 설명

사용자가 식사를 촬영하거나 갤러리에서 고르면 Gemini가 음식 구성과 한 끼의 영양 균형을 추정하고, 부족한 영양 요소와 그것을 채울 수 있는 식품을 영어 리포트로 알려주는 로컬 모바일 앱이다.

### 2.3 해결하려는 문제

한 끼 식사를 보고 어떤 영양 요소가 많고 적은지 즉시 판단하기는 어렵다. 그렇다고 앱이 다음 끼니 메뉴를 정해주면, 사용자가 그대로 먹기 어려워 조언 전체가 무효가 된다.

AI Meal Coach는 **메뉴를 지시하지 않는다.** 이번 끼니에서 무엇이 부족한지 짚고, 그것을 채울 수 있는 식품을 알려주는 데서 멈춘다. 무엇을 먹을지는 사용자가 정한다.

```
식사 사진
   ↓
음식 구성 추정
   ↓
한 끼의 상대적 영양 균형 판단 (탄·단·지·섬유)
   ↓
부족한 영양 요소 선정 (없으면 없다고 말함)
   ↓
채울 수 있는 식품 제시 + 코치 노트
   ↓
리포트 저장 및 관리
```

### 2.4 사용자 가치

- 음식명을 입력하지 않고 사진 한 장으로 분석이 시작된다.
- 부족한 것을 짚어주되 무엇을 먹으라고 지시하지 않는다. 부담이 없다.
- 균형이 좋으면 좋다고 말한다. 억지로 흠을 잡지 않는다.
- 잘못 인식된 음식은 사용자가 고친 뒤 다시 분석할 수 있다.
- 결과는 기기 안에 저장되어 나중에 다시 볼 수 있다.

### 2.5 AI의 역할

Gemini는 다음 역할만 담당한다.

1. 식사 사진에 보이는 음식 추정
2. 한 끼 안에서 탄수화물·단백질·지방·식이섬유의 상대적 균형 분류
3. `low`로 판정된 항목 중에서만 부족 요소를 최대 2개 선정
4. 각 부족 요소를 채울 수 있는 식품 3~4개 제시
5. 인식된 음식에 근거한 짧은 영어 코치 노트 작성

수치 계산, 칼로리 산출, 질병 진단, 다이어트 처방, 메뉴 추천은 담당하지 않는다.

### 2.6 에이전트적 흐름

본 프로젝트는 범용 자율 에이전트가 아니라 하나의 목표에 제한된 **단일 작업 에이전트 워크플로**이다.

- Perception: 이미지에서 음식 정보를 읽는다.
- Judgment: 한 끼의 영양 균형을 분류한다.
- Feedback: 부족한 요소와 채울 방법을 알려준다.
- Memory: 결과를 SQLite에 저장한다.
- Human correction: 사용자가 인식 오류를 고치면 판단을 갱신한다.

---

## 3. 목표, 범위 및 제약조건

### 3.1 구현 목표

1. 식사 사진을 Gemini API로 분석한다.
2. 영양 균형과 부족 요소, 코치 노트를 영어 리포트로 표시한다.
3. 리포트를 로컬 SQLite에 저장하고 조회·수정·삭제할 수 있다.
4. 모든 기능이 노트북과 실기기에서 로컬로 동작한다.

### 3.2 주요 기능 3개

| 번호 | 주요 기능 | 설명 |
|---|---|---|
| 1 | Analyze a Meal | 촬영 또는 갤러리 사진과 식사 종류를 입력받아 Gemini 분석을 수행한다. |
| 2 | Read the Coach's Note | 영양 균형, 부족 요소, 채울 수 있는 식품, 코치 노트를 리포트로 표시하고 저장한다. |
| 3 | Manage Reports | 저장된 리포트를 조회하고, 음식 인식 결과를 고쳐 재분석하거나 삭제한다. |

### 3.3 CRUD 대응

| CRUD | 사용자 동작 | 시스템 동작 |
|---|---|---|
| Create | 사진을 촬영·선택하고 `Analyze` | 이미지 저장 → Gemini 분석 → 검증 → DB 레코드 생성 |
| Read | `History`에서 기록 선택 | 리포트 목록 또는 상세 반환 |
| Update | `Edit foods`에서 음식명·식사 종류 수정 후 `Re-analyze` | 원본 이미지를 다시 분석 → 같은 레코드 갱신 |
| Delete | `Delete` 후 확인 | DB 레코드와 로컬 이미지 파일 삭제 |

### 3.4 포함 범위

- 이미지 한 장 (카메라 촬영 또는 갤러리 선택)
- 식사 종류: Breakfast, Lunch, Dinner, Snack
- JPEG, PNG, WEBP · 최대 8MB
- 음식명과 대략적인 분량 표현 추정
- 4개 영양 범주를 High / Moderate / Low로 표현
- 부족 요소 0~2개와 각각의 보충 식품 3~4개
- 영어 리포트 화면
- SQLite 기반 CRUD
- 로딩 및 오류 상태

### 3.5 제외 범위

- 회원가입, 로그인, 사용자 프로필
- 정확한 칼로리 및 g 단위 영양소 계산
- 외부 영양성분 DB 연동
- 하루·주간 누적 통계
- 알레르기·질환·식단 제한 개인화
- **다음 끼니 메뉴 추천, 식재료 선택, 추천 새로고침**
- **PDF 생성 및 공유**
- 여러 장의 사진 동시 분석
- 클라우드 배포, 클라우드 DB, 앱 스토어 빌드
- Phase 2 프로젝트로의 코드 재사용

### 3.6 제약조건

- 구현은 2인이 각자 하루 안에 완료할 수 있는 수준으로 제한한다.
- 화면 문구는 모두 영어로 작성한다.
- 서버와 앱 모두 로컬에서 실행한다. 실기기와 노트북은 같은 Wi-Fi에 있어야 한다.
- 실제 Gemini API만 사용하며 Mock AI 모드는 구현하지 않는다.
- 인터넷이나 Gemini API가 실패하면 신규 분석·재분석은 불가능하지만 **기존 기록 조회·삭제는 가능해야 한다.**

---

## 4. 기능 요구사항

기능은 7개다. 각 항목 첫 줄의 흐름 요약이 해당 기능의 사용자 경로다.

### 4.1 FR-01 식사 사진 입력

> `Meal Type 선택 → Take a Photo 또는 Choose from Library → 미리보기 → Analyze 활성화`

**입력:** Meal Type 1개, 이미지 1장.

- Meal Type 기본값은 `Lunch`.
- `Take a Photo`와 `Choose from Library` 두 버튼을 모두 제공한다.
- 최초 사용 시 카메라·사진 접근 권한을 요청한다. 거부 시 설정에서 허용할 수 있다는 영어 안내를 표시한다.
- 선택한 이미지 미리보기를 표시하고 `Change Photo`로 교체할 수 있다.
- 촬영·선택을 취소하면 기존 이미지가 있으면 유지하고, 없으면 빈 상태를 유지한다.
- 업로드 전에 `expo-image-manipulator`로 JPEG 품질 0.8로 정규화하여 HEIC 등 기기별 형식 차이를 제거한다.
- 지원 형식 `image/jpeg`, `image/png`, `image/webp` · 최대 8MB.
- 이미지가 없으면 분석 요청을 보내지 않는다.

**완료 조건:** 유효한 사진 선택 시 미리보기 표시. 잘못된 형식·용량 초과 시 영어 오류 메시지.

### 4.2 FR-02 AI 분석 및 저장

> `Analyze 클릭 → 버튼 비활성화 → POST /api/reports → 이미지 저장 → Gemini → 검증 → SQLite → 리포트 표시`

1. 버튼을 비활성화하고 `Analyzing your meal...`을 표시한다.
2. `POST /api/reports`에 multipart/form-data를 전송한다.
3. 서버가 이미지를 저장하고 Gemini를 호출한다.
4. Gemini는 음식, 영양 균형, 부족 요소, 보충 식품, 코치 노트를 반환한다.
5. 서버가 응답을 검증하고 SQLite에 저장한다.
6. 성공 응답의 리포트를 화면에 표시한다.

**실패 처리**

- Gemini 호출 또는 DB 저장이 실패하면 DB 레코드를 남기지 않는다.
- DB 저장 전 실패하면 방금 저장한 이미지 파일을 삭제한다.
- 사용자에게 스택 트레이스나 API 키를 노출하지 않는다.

### 4.3 FR-03 리포트 표시

> `저장 완료 → 블록 5개를 순서대로 렌더링`

리포트는 다음 5개 블록으로 구성한다.

| # | 블록 | 내용 |
|---|---|---|
| 1 | Header + Photo | `Meal Analysis Report`, `Saved` 배지, Meal Type과 분석 일시, 업로드한 사진 |
| 2 | Detected Foods | 인식된 음식명 목록 |
| 3 | Nutritional Balance | 탄·단·지·섬유 4개 카드, 각각 High / Moderate / Low |
| 4 | Coach's Note | 총평 1줄 → 부족 요소별 (이유 + 보충 식품 칩) → 마무리 1줄 |
| 5 | Disclaimer + Actions | 비의료적 사용 안내, `Edit foods` · `Delete` |

**Coach's Note의 원칙**

- **보충 식품은 읽기 전용 정보다.** 누를 수 있는 버튼이 아니다.
- 부족 요소가 없으면 부족 항목 없이 총평과 마무리만 표시한다.
- AI는 새로운 메뉴를 제안하지 않는다. 보완은 `거기에 무엇을 더하면`의 형태로만 쓴다.

### 4.4 FR-04 기록 목록 조회

> `History 탭 → 최신 수정순 목록 → 항목 클릭 → 상세 리포트`

- 각 항목은 사진 썸네일, Meal Type, 음식명 최대 3개, 분석 일시를 표시한다.
- 기록이 없으면 `No meal reports yet.`와 `Analyze Your First Meal` 버튼을 표시한다.
- 이 화면은 Gemini를 호출하지 않으므로 인터넷 없이 동작한다.

### 4.5 FR-05 음식 수정 및 재분석

> `Edit foods → 음식명·Meal Type 수정 → Re-analyze → 같은 레코드 갱신`

**이 앱의 핵심 상호작용이다.** AI가 놓친 음식을 사용자가 추가하면 영양 판정과 코치 노트가 함께 바뀐다.

수정 가능한 항목은 두 가지뿐이다.

| 항목 | 수정 방법 |
|---|---|
| Meal Type | Breakfast / Lunch / Dinner / Snack 선택 |
| Detected Foods | 음식명 변경, 항목 추가, 항목 삭제 |

다음은 직접 수정할 수 없다: Nutritional Balance, 부족 요소, 보충 식품, 코치 노트, 분석 일시, 원본 이미지.

**편집 규칙**

- 음식 항목 최소 1개, 최대 8개.
- 각 음식명은 공백 제거 후 2~60자의 영어 문자열.
- 빈 음식명, 중복 음식명 불가.
- `Re-analyze` 시 원본 이미지와 수정 목록을 Gemini에 다시 전달한다.
- Gemini는 수정된 음식명을 **대소문자와 순서까지 그대로** 유지해야 한다. 서버가 검증한다.
- 업데이트 성공 전까지 기존 DB 값을 유지한다.

### 4.6 FR-06 삭제

> `Delete → 확인 대화상자 → DB 레코드 + 이미지 파일 삭제 → History로 이동`

- React Native `Alert`로 확인을 받는다.
- 확인 문구: `Delete this report? This action cannot be undone.`
- Cancel 시 아무 작업도 하지 않는다.
- 이미지 파일 삭제가 실패해도 DB 삭제는 롤백하지 않고 서버 콘솔에 경고만 남긴다.

### 4.7 FR-07 로딩과 중복 요청 방지

- 분석 또는 재분석 중 제출 버튼을 비활성화한다.
- 버튼 문구를 `Analyzing...` 또는 `Re-analyzing...`으로 바꾼다.
- 동일 작업 이중 제출을 클라이언트와 서버 양쪽에서 방어한다.

---

## 5. AI 동작 명세

프롬프트 전문과 JSON Schema는 `ai-contract.md`에 있다. 이 절은 정책만 정의한다.

### 5.1 모델

- 기본 모델: `gemini-3.5-flash-lite` (환경변수 `GEMINI_MODEL`로 관리)
- 호출 위치: Express 백엔드만. 앱은 Gemini를 직접 호출하지 않는다.
- SDK: `@google/genai` · `ai.models.generateContent()`
- 이미지 전송: 로컬 파일을 Base64로 읽어 `inlineData`로 전송
- 응답: JSON Structured Output · 출력 언어 영어

프롬프트는 2종뿐이다: **최초 분석**과 **재분석**.

### 5.2 평가 대상과 선정 기준

평가 대상을 **탄수화물, 단백질, 지방, 식이섬유** 네 가지로 고정한다. 선정 기준은 영양학적 중요도가 아니라 **사진에서 판단할 근거가 있는가**이다.

| 영양소 | 사진에서의 근거 | 채택 | 역할 |
|---|---|:-:|---|
| Carbohydrates | 밥·면·빵 등 주식이 눈에 보인다 | O | 과잉 표시 |
| Protein | 고기·생선·계란·두부가 눈에 보인다 | O | 부족 감지 |
| Fiber | 채소·과일의 유무가 가장 명확하게 드러난다 | O | 부족 감지 |
| Fat | 튀김·조리법으로 부분적으로만 추정된다 | △ | 과잉 표시 |
| 비타민 · 미네랄 | 사진으로 확인할 수 없다 | X | — |
| 나트륨 | 사진으로 확인할 수 없다 | X | — |

지방은 조리유·드레싱·소스가 사진에 드러나지 않아 네 항목 중 추정 정확도가 가장 낮다. 그럼에도 한 끼의 구성을 설명하는 데 필요하므로 포함하되, 부족을 지적하기보다 과잉 여부를 보여주는 맥락으로 사용한다.

비타민·미네랄·나트륨은 제외한다. **화면에 근거를 표시하지 않은 항목을 부족하다고 말하지 않는다**는 원칙과도 일치한다.

영양소 이름은 문서·프롬프트·DB·UI 전체에서 위 표기 한 벌만 사용한다.

### 5.3 판정 기준

AI가 판단하는 값은 사용자의 실제 영양 결핍이나 하루 총섭취량이 아니라 **사진에 보이는 한 끼 구성 안에서의 상대적 균형**이다.

| 상태 | 의미 |
|---|---|
| High | 한 끼 구성에서 상대적으로 큰 비중을 차지함 |
| Moderate | 적정하거나 중간 수준으로 보임 |
| Low | 부족해 보이거나 대표 공급원이 거의 보이지 않음 |

### 5.4 부족 요소 선정 규칙

1. **부족 요소는 `low`로 판정된 항목 중에서만 고른다.**
2. 최대 2개. `low`가 없으면 **빈 배열**을 반환한다.
3. `low`가 3개 이상이면 그 끼니에서 가장 두드러진 2개만 고른다.
4. 각 부족 요소마다 채울 수 있는 식품을 3~4개 제시한다.
5. 식품은 서로 다른 범주에서 고른다 (동물성 / 식물성 / 유제품 등).
6. 식품은 **인식된 음식과 같이 먹을 수 있는 것**으로 고른다.

### 5.5 코치 노트 규칙

코치 노트가 이 앱의 성격을 결정한다.

1. **인식된 음식 이름을 반드시 언급한다.** 일반론을 금지한다.
   - 금지: `Protein is low.`
   - 허용: `Instant ramen has close to none.`
2. **새로운 메뉴를 제안하지 않는다.** 보완은 `거기에 무엇을 더하면`의 형태로만 쓴다.
   - 금지: `Try a tofu salad for dinner.`
   - 허용: `Cracking an egg into the broth is the easiest fix.`
3. 부족 요소가 없으면 균형이 좋다고 말하고 끝낸다. 억지로 흠을 잡지 않는다.
4. `high`인 항목은 지적하되 이번 끼니를 고치라고 하지 않는다.
   - 예: `Fat is on the higher side, which is expected with grilled pork — worth keeping in mind for the next meal rather than fixing this one.`
5. 질환 치료, 체중 감량, 건강 개선을 보장하는 표현을 금지한다.
6. 알레르기 정보가 없으므로 의료·알레르기 안전을 보장하지 않는다.

### 5.6 음식 사진이 아닌 경우

Gemini가 `is_food_image: false`로 반환하면 서버는 DB에 저장하지 않고 HTTP 422를 반환한다.

```text
We could not identify a meal in this image. Please upload a clear food photo.
```

### 5.7 재분석 규칙

재분석 요청에는 원본 이미지, 사용자가 수정한 음식명 목록, 선택한 Meal Type, 재분석 전용 프롬프트가 함께 들어간다.

수정된 음식 목록은 Gemini가 다시 추론할 대상이 아니라 **사용자가 확인한 사실**로 취급한다. `detected_foods[].name`은 입력 목록과 대소문자·순서를 포함해 동일해야 하며, 서버가 검증한다. 불일치하면 자동 재시도 없이 오류를 반환하고 기존 기록을 유지한다.

영양 균형, 부족 요소, 코치 노트는 수정된 목록을 기준으로 새로 만든다.

---

## 6. 화면 및 UX 명세

### 6.1 공통 방향

- 화면 언어: 영어
- 분위기: 차분하고 신뢰감 있는 건강 기록 도구. 과도한 그래픽·애니메이션 금지.
- 모바일 세로 화면 기준. 360px 폭에서 가로 스크롤 없이 사용 가능.
- 색상만으로 상태를 전달하지 않고 High / Moderate / Low 텍스트를 항상 함께 표시한다.

### 6.2 색상

| 용도 | 값 |
|---|---|
| Page background | `#F7F8F3` |
| Card background | `#FFFFFF` |
| Primary text | `#1F2924` |
| Secondary text | `#647069` |
| Primary action | `#245C46` |
| Soft accent | `#DDEBDD` |
| Border | `#DDE3DE` |
| Error | `#B23A3A` |
| High status | `#B56A22` |
| Moderate status | `#397A58` |
| Low status | `#477AA1` |

### 6.3 글꼴

- 시스템 기본 글꼴을 사용한다. 외부 폰트를 다운로드하지 않는다.
- 본문 최소 13px, 입력 필드 최소 16px.

### 6.4 내비게이션

상단에 제품명 `AI Meal Coach`, 하단 또는 상단에 탭 두 개만 둔다.

- `Analyze`
- `History`

별도 내비게이션 라이브러리를 쓰지 않고 `App.jsx`의 `activeView` 상태로 전환해도 된다.

### 6.5 Analyze 화면

```text
Understand your meal.

Take a photo of your meal to see how balanced it is
and what is worth adding.

[ Meal Type: Breakfast | Lunch | Dinner | Snack ]

        ┌─────────────────────┐
        │   사진 미리보기 영역   │
        └─────────────────────┘

      [ Take a Photo ]  [ Choose from Library ]

              [ Analyze ]
```

분석 중에는 선택한 이미지와 Meal Type을 유지하고, 버튼 영역에만 스피너와 `Analyzing your meal...`을 표시한다. 화면 전체를 가리는 모달은 사용하지 않는다.

### 6.6 Report 화면

```text
Meal Analysis Report                          [Saved]
Lunch · September 25, 2026 at 12:40 PM

┌──────────────────────────────────────┐
│              음식 사진                 │
└──────────────────────────────────────┘

DETECTED FOODS
[Instant ramen] [Kimchi]

NUTRITIONAL BALANCE
┌ Carbohydrates ┐ ┌ Protein ┐
│ High          │ │ Low     │
└───────────────┘ └─────────┘
┌ Fat           ┐ ┌ Fiber   ┐
│ Moderate      │ │ Low     │
└───────────────┘ └─────────┘

COACH'S NOTE
This meal was mostly carbs — the noodles are doing
almost all the work.

  PROTEIN
  Instant ramen has close to none. Cracking an egg
  into the broth is the easiest fix.
  (Egg) (Tofu) (Milk)

  FIBER
  Kimchi helps a little, but that is about it.
  Any vegetable side counts.
  (Spinach side) (Bean sprouts) (Salad)

  Next time you have ramen, one egg and one
  vegetable side is enough.

AI-generated estimates may be inaccurate and are not
intended for medical or dietary diagnosis.

        [ Edit foods ]        [ Delete ]
```

- 영양 카드는 2열로 배치하고 상태별 색상을 왼쪽 테두리로 표시한다.
- 보충 식품 칩은 **선택할 수 없는 읽기 전용 표시**다.
- 부족 요소가 없으면 부족 항목 블록 없이 총평과 마무리만 표시한다.

### 6.7 Edit 화면

- 기존 리포트 안에서 편집 폼으로 전환한다.
- Meal Type 선택 버튼과, 음식마다 텍스트 입력 + `Remove` 버튼을 표시한다.
- `+ Add Food`로 빈 입력을 추가한다.
- 하단에 `Cancel`, `Re-analyze`를 표시한다.
- Cancel은 DB나 화면 값을 변경하지 않는다.

### 6.8 History 화면

- 제목 `Meal History`, 설명 `Review, update or remove your saved reports.`
- 최근 수정된 기록을 먼저 표시한다.
- 검색, 정렬, 페이지네이션은 구현하지 않는다.

---

## 7. 기술 스택

| 계층 | 기술 | 기준 버전 | 선택 이유 |
|---|---|---|---|
| Runtime | Node.js | 22 LTS | 현재 지원 LTS |
| Package manager | npm | Node 22 동봉 | 추가 도구 불필요 |
| Mobile | Expo (React Native) | SDK 최신 안정 | 실기기에서 Expo Go로 바로 실행 |
| Language | JavaScript ESM | ES2022+ | 설정 부담 최소화 |
| 사진 입력 | `expo-image-picker` | Expo SDK 동봉 | 카메라·갤러리 접근 |
| 이미지 정규화 | `expo-image-manipulator` | Expo SDK 동봉 | HEIC → JPEG 변환 |
| Backend | Express | 5.x | 간단한 CRUD API |
| Database | SQLite (`better-sqlite3`) | 13.x | DB 서버 없이 로컬 파일 |
| File upload | Multer | 2.x | multipart 검증과 저장 |
| GenAI SDK | `@google/genai` | 2.x | Google 공식 JS SDK |
| GenAI model | Gemini 3.5 Flash-Lite | `gemini-3.5-flash-lite` | 이미지 입력 + Structured Output |
| Configuration | dotenv | 17.x | API 키 분리 |
| Styling | React Native StyleSheet | — | UI 라이브러리 학습 비용 제거 |

### 7.1 의존성 원칙

- `package-lock.json`을 반드시 생성하고 함께 보관한다.
- `@google/generative-ai` 구형 SDK는 사용하지 않는다.
- UI 프레임워크, 상태관리 라이브러리, ORM, 내비게이션 라이브러리를 추가하지 않는다.

### 7.2 모노레포 구성

`mobile/`과 `server/`는 **각각 독립된 npm 프로젝트**이며 한 Git 저장소에 둔다. npm workspaces는 사용하지 않는다 — Expo의 Metro 번들러가 워크스페이스 호이스팅과 충돌하는 경우가 있어 하루짜리 프로젝트에서 감수할 이유가 없다.

루트 `package.json`은 의존성을 갖지 않고 실행 편의 스크립트만 제공한다.

---

## 8. 시스템 아키텍처

### 8.1 전체 구조

```text
┌──────────────────────────────────────┐
│  스마트폰 — Expo Go                    │
│                                      │
│  Analyze · Report · History · Edit   │
└───────────────┬──────────────────────┘
                │ HTTP / multipart
                │ 같은 Wi-Fi, 노트북 LAN IP
                ▼
┌──────────────────────────────────────┐
│  노트북 — Node.js + Express           │
│                                      │
│  Routes → Report Service → Gemini    │──┐
│              │                        │  │ HTTPS
│              ▼                        │  │
│  uploads/ (이미지)  data/ (SQLite)     │  │
└──────────────────────────────────────┘  │
                                          ▼
                             ┌─────────────────────┐
                             │     Gemini API      │
                             │  이미지 이해 + JSON   │
                             └─────────────────────┘
```

### 8.2 책임 분리

| 구성요소 | 책임 |
|---|---|
| Expo 앱 | 입력, 미리보기, 리포트 렌더링, 편집, 로딩·오류 상태 |
| Express Routes | HTTP 입력 검증, 상태 코드, 서비스 연결 |
| Report Service | CRUD 흐름, 파일-DB 일관성, 응답 가공 |
| Gemini Service | 프롬프트 생성, Base64 변환, API 호출, 응답 검증 |
| SQLite | 리포트 영속 저장 |
| `uploads/` | 원본 이미지 저장 |

### 8.3 실패 시 원자성

Create는 다음 순서를 지킨다.

1. 이미지 저장
2. Gemini 호출 및 검증
3. DB INSERT

2 또는 3이 실패하면 1에서 저장한 이미지를 삭제한다. 실패한 분석 때문에 고아 이미지나 불완전한 DB 행이 남지 않아야 한다.

Update는 Gemini 분석과 검증이 성공한 후 하나의 UPDATE 문으로 AI 필드를 교체한다. 실패 시 기존 레코드를 유지한다.

### 8.4 오프라인 경계

기록 조회와 삭제는 Gemini 없이 동작한다. 신규 분석과 재분석만 네트워크와 Gemini API가 필요하다.

---

## 9. 데이터베이스 명세

### 9.1 파일

```text
server/data/meal-coach.db
```

서버 시작 시 `data/` 디렉터리와 DB 파일을 자동 생성한다.

### 9.2 테이블

```sql
CREATE TABLE IF NOT EXISTS meal_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  meal_type TEXT NOT NULL
    CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  image_filename TEXT NOT NULL UNIQUE,
  image_original_name TEXT NOT NULL,
  detected_foods TEXT NOT NULL,
  carbohydrates TEXT NOT NULL CHECK (carbohydrates IN ('high','moderate','low')),
  protein       TEXT NOT NULL CHECK (protein       IN ('high','moderate','low')),
  fat           TEXT NOT NULL CHECK (fat           IN ('high','moderate','low')),
  fiber         TEXT NOT NULL CHECK (fiber         IN ('high','moderate','low')),
  nutrient_gaps TEXT NOT NULL,
  coach_note    TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_meal_reports_updated_at
  ON meal_reports(updated_at DESC);
```

### 9.3 JSON 문자열 필드

다음 TEXT 필드는 `JSON.stringify()`로 저장하고 조회 시 `JSON.parse()`한다.

**`detected_foods`**

```json
[
  { "name": "Instant ramen", "estimated_portion": "about one bowl", "confidence": "high" },
  { "name": "Kimchi", "estimated_portion": "a small side", "confidence": "medium" }
]
```

**`nutrient_gaps`** — 0~2개. `low` 판정 항목만 들어간다.

```json
[
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
]
```

**`coach_note`**

```json
{
  "headline": "This meal was mostly carbs — the noodles are doing almost all the work.",
  "closing": "Next time you have ramen, one egg and one vegetable side is enough."
}
```

### 9.4 시간 처리

- DB에는 UTC 문자열을 저장한다.
- API는 ISO 8601로 반환한다.
- 앱은 기기 로컬 시간대로 변환해 표시한다.
- Update 성공 시 `updated_at = datetime('now')`로 갱신한다.

### 9.5 API 응답 변환

DB 행을 그대로 노출하지 않고 camelCase로 변환한다.

```json
{
  "id": 1,
  "mealType": "lunch",
  "imageUrl": "/uploads/48b2f4c8-61c0-4c62-8fa5-9c36ec787b17.jpg",
  "detectedFoods": [],
  "balance": {
    "carbohydrates": "high",
    "protein": "low",
    "fat": "moderate",
    "fiber": "low"
  },
  "nutrientGaps": [],
  "coachNote": { "headline": "...", "closing": "..." },
  "createdAt": "2026-09-25T03:40:00.000Z",
  "updatedAt": "2026-09-25T03:40:00.000Z"
}
```

---

## 10. 백엔드 API 명세

### 10.1 공통 규칙

- Base URL: `http://<노트북 LAN IP>:3001/api`
- JSON 응답 헤더: `Content-Type: application/json`
- 모든 오류는 동일한 구조를 사용한다.

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable English message."
  }
}
```

엔드포인트는 6개다.

| # | Method | 경로 | Gemini |
|---:|---|---|:-:|
| 1 | POST | `/api/reports` | 이미지 |
| 2 | GET | `/api/reports` | — |
| 3 | GET | `/api/reports/:id` | — |
| 4 | PUT | `/api/reports/:id` | 이미지 |
| 5 | DELETE | `/api/reports/:id` | — |
| 6 | GET | `/api/health` | — |

이미지 파일은 `GET /uploads/:filename`으로 정적 제공한다.

### 10.2 POST /api/reports

새 사진을 분석하고 결과를 저장한다.

**Content-Type:** `multipart/form-data`

| 이름 | 형식 | 필수 | 설명 |
|---|---|:-:|---|
| `mealType` | string | Yes | breakfast, lunch, dinner, snack |
| `image` | file | Yes | JPEG, PNG, WEBP, 최대 8MB |

**성공:** `201 Created`, 전체 report 객체

**오류**

| 상태 | 코드 | 상황 |
|---:|---|---|
| 400 | `INVALID_MEAL_TYPE` | 허용되지 않은 식사 종류 |
| 400 | `IMAGE_REQUIRED` | 이미지 없음 |
| 400 | `UNSUPPORTED_IMAGE_TYPE` | 지원되지 않는 MIME type |
| 413 | `IMAGE_TOO_LARGE` | 8MB 초과 |
| 422 | `NO_MEAL_DETECTED` | 음식 사진으로 판단하지 못함 |
| 502 | `GEMINI_REQUEST_FAILED` | Gemini 요청 실패 |
| 502 | `INVALID_AI_RESPONSE` | AI 응답 검증 실패 |
| 500 | `REPORT_CREATE_FAILED` | DB 또는 파일 처리 실패 |

### 10.3 GET /api/reports

```sql
ORDER BY updated_at DESC, id DESC
```

**성공:** `200 OK`

```json
{ "reports": [] }
```

데이터가 소량인 수업 프로젝트이므로 별도 summary DTO를 만들지 않고 전체 report 객체를 반환한다.

### 10.4 GET /api/reports/:id

**오류:** `400 INVALID_REPORT_ID` (양의 정수가 아님), `404 REPORT_NOT_FOUND`

### 10.5 PUT /api/reports/:id

사용자가 수정한 음식 목록을 기준으로 재분석하고 같은 레코드를 갱신한다.

**요청 Body**

```json
{
  "mealType": "lunch",
  "foods": ["Instant ramen", "Kimchi", "Egg"]
}
```

**처리 순서**

1. report 존재 확인
2. `mealType`과 `foods` 검증
3. 저장된 원본 이미지 존재 확인
4. 재분석 프롬프트로 Gemini 호출
5. 수정 목록이 AI 결과에 그대로 유지되었는지 확인
6. 하나의 UPDATE로 AI 필드와 `updated_at` 변경
7. 갱신된 report 반환

**성공:** `200 OK`, 갱신된 전체 report 객체

**추가 오류**

| 상태 | 코드 | 상황 |
|---:|---|---|
| 400 | `INVALID_FOOD_LIST` | 빈 목록, 9개 이상, 빈 이름, 중복 |
| 404 | `REPORT_NOT_FOUND` | 해당 ID 없음 |
| 500 | `SOURCE_IMAGE_MISSING` | 저장된 이미지 파일이 없음 |
| 502 | `FOOD_LIST_MISMATCH` | AI가 음식 목록을 바꿈 |

### 10.6 DELETE /api/reports/:id

1. report 조회
2. DB 레코드 삭제
3. 이미지 파일이 있으면 삭제

**성공:** `204 No Content`, Body 없음

### 10.7 GET /api/health

```json
{ "status": "ok" }
```

Gemini 호출이나 DB 쓰기 테스트는 수행하지 않는다.

---

## 11. 보안, 검증 및 오류 처리

### 11.1 API 키

- `GEMINI_API_KEY`는 `server/.env`에만 저장한다.
- 앱 코드나 `EXPO_PUBLIC_` 접두사 환경변수에 넣지 않는다.
- 서버 로그에 출력하지 않는다.
- `.env`는 Git에 커밋하지 않는다. `.env.example`에는 키 이름만 둔다.

### 11.2 이미지 파일명

사용자 원본 파일명을 저장 파일명으로 쓰지 않는다.

```text
crypto.randomUUID() + validatedExtension
→ 48b2f4c8-61c0-4c62-8fa5-9c36ec787b17.jpg
```

원본명은 화면에 표시하지 않고 `image_original_name`에만 보관한다.

### 11.3 입력 검증

- 허용 MIME: `image/jpeg`, `image/png`, `image/webp`
- 확장자는 MIME에 따라 서버가 결정한다.
- 최대 8MB, 한 요청에 파일 1개
- `uploads/` 외부 경로를 입력으로 받지 않는다.
- 음식명: 앞뒤 공백 제거, 연속 공백 축소, 개행을 공백으로 치환, 2~60자, 최대 8개, 중복 시 400

### 11.4 오류 메시지 원칙

- 화면에는 영어로 짧고 행동 가능한 메시지를 표시한다.
- 응답에 스택 트레이스, 로컬 절대 경로, SQL, API 키를 포함하지 않는다.

| 상황 | 화면 문구 |
|---|---|
| 이미지 없음 | `Choose a meal photo before analyzing.` |
| 지원하지 않는 형식 | `Use a JPEG, PNG or WEBP image.` |
| 용량 초과 | `The image must be 8 MB or smaller.` |
| 음식이 아님 | `We could not identify a meal in this image. Please upload a clear food photo.` |
| Gemini 실패 | `We could not analyze the meal right now. Please try again.` |
| 서버 연결 실패 | `Cannot reach the server. Check that it is running and you are on the same Wi-Fi.` |
| 기록 조회 실패 | `We could not load your meal history.` |
| 수정 검증 실패 | `Add at least one valid food name.` |
| 카메라 권한 거부 | `Camera access is off. You can still choose a photo from your library.` |

### 11.5 로컬 네트워크

실기기가 노트북 서버에 접속하므로 서버는 `0.0.0.0`에 바인딩하고, 앱은 `EXPO_PUBLIC_API_BASE_URL`로 노트북 LAN IP를 받는다. 이 구성은 개발·시연용이며 외부 공개를 전제하지 않는다.

---

## 12. 테스트 및 완료 기준

### 12.1 기능 테스트

| ID | 시나리오 | 기대 결과 |
|---|---|---|
| T-01 | 카메라로 식사 촬영 후 분석 | 리포트 생성, DB 저장, History 표시 |
| T-02 | 갤러리 사진으로 분석 | 정상 분석 |
| T-03 | 이미지 없이 분석 | API 호출 없이 입력 오류 표시 |
| T-04 | 8MB 초과 이미지 | 크기 오류, 파일 미저장 |
| T-05 | 음식이 아닌 사진 | 422 안내, DB 미저장 |
| T-06 | 균형 잡힌 식사 사진 | `nutrientGaps`가 빈 배열, 부족 블록 미표시 |
| T-07 | 탄수화물만 많은 식사 | 부족 요소 1~2개, 각 보충 식품 3~4개 |
| T-08 | 코치 노트 내용 확인 | 인식된 음식 이름이 노트에 포함됨 |
| T-09 | History 진입 | `updatedAt` 최신순 표시 |
| T-10 | 음식명 추가 후 재분석 | 같은 ID의 판정·노트·`updatedAt` 갱신 |
| T-11 | 빈 음식 목록 저장 | 400, 기존 기록 유지 |
| T-12 | Update 중 Gemini 실패 | 기존 DB 내용 유지 |
| T-13 | 리포트 삭제 Confirm / Cancel | 확인 시 DB·이미지 삭제, 취소 시 변화 없음 |
| T-14 | 서버 중지 후 History 진입 | 기존 기록 조회 가능 여부 확인 및 오류 안내 |
| T-15 | 서버 재시작 | 기존 기록 유지 |
| T-16 | Gemini 키 누락 | 서버 시작 시 안전한 설정 오류 |
| T-17 | 카메라 권한 거부 | 갤러리 경로로 계속 진행 가능 |

### 12.2 완료 정의

- [ ] 실기기에서 카메라·갤러리로 사진을 넣을 수 있다.
- [ ] Gemini가 영어 Structured JSON을 반환한다.
- [ ] 음식, 영양 균형, 부족 요소, 코치 노트가 리포트에 표시된다.
- [ ] 부족 요소가 없는 경우가 정상적으로 표시된다.
- [ ] 코치 노트가 인식된 음식 이름을 언급한다.
- [ ] 생성된 리포트가 SQLite에 저장되고 재시작 후에도 남는다.
- [ ] 음식명과 Meal Type을 수정하고 재분석할 수 있다.
- [ ] 삭제 시 DB와 이미지가 함께 제거된다.
- [ ] 지원하지 않는 입력과 API 실패가 사용자 친화적으로 표시된다.
- [ ] API 키가 앱에 노출되지 않는다.
- [ ] 모든 화면 문구가 영어다.

### 12.3 재현 성공 기준

제3자가 `project_spec.md`와 `ai-contract.md`만 보고 다음을 수행할 수 있으면 재현에 성공한 것이다.

1. 동일한 기술 스택으로 프로젝트를 생성한다.
2. 정의된 DB 스키마를 만든다.
3. 동일한 API 경로와 JSON 구조를 구현한다.
4. 동일한 네 화면(Analyze, Report, History, Edit)을 구현한다.
5. Gemini 이미지 분석과 재분석을 연결한다.
6. CRUD 흐름을 시연한다.

---

## 13. 알려진 한계

1. 사진만으로 정확한 재료, 조리법, 중량을 확인할 수 없다.
2. 영양 상태는 한 끼 구성에 대한 상대적 추정이며 하루 전체 영양 상태가 아니다.
3. 칼로리와 영양소의 정확한 수치를 제공하지 않는다.
4. 지방은 조리유·드레싱·소스가 보이지 않아 네 항목 중 추정 정확도가 가장 낮다.
5. 비타민·미네랄·나트륨은 다루지 않는다.
6. 알레르기, 질환, 복용약, 식단 제한을 고려하지 않는다.
7. 같은 사진이라도 Gemini 응답이 일부 달라질 수 있다.
8. 실제 Gemini 호출만 사용하므로 인터넷 또는 API 문제 시 분석이 중단된다.
9. 사용자 계정이 없으므로 앱을 쓰는 모든 사람이 같은 기록을 본다.
10. 데이터와 이미지는 로컬에만 저장되며 자동 백업되지 않는다.
11. 본 결과는 의료적·전문 영양 상담을 대체하지 않는다.

화면 고정 면책 문구:

```text
AI-generated estimates may be inaccurate and are not intended for medical or dietary diagnosis.
```

---

## 14. 참고 문서

- [Gemini API — Image understanding](https://ai.google.dev/gemini-api/docs/image-understanding)
- [Gemini API — Structured outputs](https://ai.google.dev/gemini-api/docs/structured-output)
- [Google Gen AI JavaScript SDK](https://www.npmjs.com/package/@google/genai)
- [Expo — ImagePicker](https://docs.expo.dev/versions/latest/sdk/imagepicker/)
- [Expo — ImageManipulator](https://docs.expo.dev/versions/latest/sdk/imagemanipulator/)
- [Express](https://expressjs.com/)
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
