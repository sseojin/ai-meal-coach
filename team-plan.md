# Team Plan — 역할 분담과 구현 순서

> 팀 내부 문서다. 재현용 묶음(`project_spec.md` + `ai-contract.md`)에는 포함되지 않는다.

## 1. 분담 원칙

두 사람이 **각자 하루씩, 순차로** 작업한다. 1차 구현자가 백엔드와 최초 분석 흐름을 완성하고, 2차 구현자가 나머지 화면과 전체 완성도를 맡는다.

| 구분 | 1차 — 서진 | 2차 — 팀원 |
|---|---|---|
| 목표 | 서버 전체 + 사진 → 리포트 흐름 | History, Edit, 전체 UI 완성도, 시연 준비 |
| 경계 | 모든 API가 독립적으로 동작하는 시점 | 준비된 API를 화면에 연결 |
| 비중 | 약 55% | 약 45% |

인수인계 이후 팀원은 Gemini 프롬프트, DB 스키마, API 응답 계약을 다시 설계하지 않는다.

### 순차 방식의 위험과 대응

팀원 몫이 전부 "이미 존재하는 API에 UI 붙이기"라서, 1차가 반나절 밀리면 팀원은 그만큼 놀게 된다. 지연이 흡수되지 않고 누적되는 구조다.

**대응:** `project_spec.md` 10장의 확정된 API 계약을 기준으로 팀원은 화면을 병렬 구현한다. 서진이 실제 API를 완성하면 연결하고 함께 검증한다.

---

## 2. 시작 전 spike 3개 (1.5시간)

본 구현 전에 아래를 **각각 한 번 성공**시켜 둔다. 이 세 곳이 시간을 가장 많이 잡아먹고, 미리 확인해두면 나머지는 명세대로 채우는 예측 가능한 작업이 된다.

- [ ] 실기기 Expo Go에서 사진을 찍어 노트북 Express로 업로드 성공
- [ ] Gemini에 이미지 1장 보내서 Structured JSON 받기 성공
- [ ] `better-sqlite3`가 설치되고 테이블 생성·조회 성공

---

## 3. 1차 구현 — 서진

**완료 목표**

```text
Expo 앱 실행 → 카메라 촬영 또는 갤러리 선택 → Express 업로드
→ Gemini 실제 분석 → SQLite 저장 → 리포트 표시
```

**작업 순서**

1. 모노레포 구조와 npm 초기화 (`mobile/`, `server/`)
2. 확정된 API 계약을 팀원에게 전달하고 실제 서버 구현 시작
3. SQLite 스키마, mapper, CRUD 서비스
4. Multer 업로드, UUID 파일명, `/uploads` 정적 제공, 실패 시 정리
5. Gemini 프롬프트 2종 + JSON Schema + 검증 V-1~V-10
6. API 6개 구현 및 curl/REST Client로 독립 테스트
7. `MealPhotoPicker` — 촬영·갤러리·권한·JPEG 정규화·미리보기
8. `AnalyzeScreen`, 로딩·오류 처리, `ReportScreen` 읽기 전용까지
9. `mobile/src/api.js`에 `createReport` `getReports` `getReport` `updateReport` `deleteReport`

**담당 파일**

```text
server/src/**
mobile/App.jsx
mobile/src/api.js
mobile/src/config.js
mobile/src/components/MealPhotoPicker.jsx
mobile/src/components/LoadingState.jsx
mobile/src/components/NutritionBalance.jsx
mobile/src/screens/AnalyzeScreen.jsx
mobile/src/screens/ReportScreen.jsx     # 읽기 전용 상태까지
mobile/src/utils/normalizeImage.js
```

---

## 4. 2차 구현 — 팀원

서버 계약을 변경하지 않고 다음을 완성한다.

1. `CoachNote.jsx`
   - 총평 → 부족 요소별 (이유 + 보충 식품 칩) → 마무리
   - **보충 식품 칩은 읽기 전용.** 누를 수 있는 버튼으로 만들지 않는다
   - `nutrientGaps`가 빈 배열이면 부족 블록 없이 총평과 마무리만
2. `HistoryScreen.jsx`
   - 최신 수정순 목록, 썸네일, 빈 상태, 상세 열기
3. `EditReportScreen.jsx`
   - Meal Type 선택, 음식 추가·수정·삭제, `Re-analyze`
   - 재분석 후 판정과 노트가 바뀌는 것을 확인
4. `ReportActions.jsx`
   - 삭제 확인 `Alert`와 DELETE 연결
5. 세로 레이아웃, `ScrollView`, `SafeAreaView`, 터치 영역, 전체 오류·로딩 상태
6. 실기기 전체 흐름 테스트와 3분 데모 준비

**담당 파일**

```text
mobile/src/components/CoachNote.jsx
mobile/src/components/ReportActions.jsx
mobile/src/screens/HistoryScreen.jsx
mobile/src/screens/EditReportScreen.jsx
mobile/src/styles.js
```

연결을 위해 `App.jsx`, `api.js`, `ReportScreen.jsx`는 수정할 수 있다. `server/src/**`의 계약은 변경하지 않는다.

---

## 5. 인수인계 완료 조건

서진은 아래를 모두 확인한 뒤 전달한다.

- [ ] Expo Go에서 앱이 실행된다
- [ ] 실기기에서 카메라 촬영과 갤러리 선택이 모두 동작한다
- [ ] 촬영한 사진이 Express에 업로드된다
- [ ] Gemini 분석 결과가 SQLite에 저장된다
- [ ] 리포트에 음식, 영양 균형, 부족 요소, 코치 노트가 표시된다
- [ ] API 6개가 curl에서 명세대로 동작한다
- [ ] 서버 재시작 후 기존 기록을 조회할 수 있다
- [ ] `.env.example`에 실제 비밀값이 없다
- [ ] `sample-images/`의 샘플 사진으로 재현된다

전달 항목: 프로젝트 폴더 전체, 본 문서 묶음, 시연용 사진 3장, 노트북 LAN IP 입력 위치, 실행 명령.

---

## 6. 변경 금지 계약

| 항목 | 확정값 |
|---|---|
| 제품 | Expo React Native 모바일 앱 |
| 실행 | 실기기의 Expo Go |
| UI 언어 | English |
| 서버·DB | 노트북의 Express + SQLite |
| 이미지 입력 | 카메라 촬영과 갤러리 선택 모두 |
| 평가 영양소 | Carbohydrates, Protein, Fat, Fiber 4개 고정 |
| 부족 요소 | `low` 판정 항목 중에서만, 0~2개 |
| 보충 식품 | 요소별 3~4개, **읽기 전용** |
| 메뉴 추천 | 없음 |
| PDF·공유 | 없음 |
| Gemini 키 | Express 서버에만 |
| 배포 · APK/IPA 빌드 | 없음 |

---

## 7. 3분 시연 시나리오

| 시간 | 내용 |
|---|---|
| 0:00–0:20 | 문제와 컨셉 — "메뉴를 추천하지 않습니다. 부족한 것만 짚어줍니다" |
| 0:20–1:00 | 라면 사진 분석 → 부족 2개(Protein, Fiber)와 코치 노트 |
| 1:00–1:50 | **`Edit foods`에서 `Egg` 추가 → `Re-analyze` → Protein이 Low에서 Moderate로 바뀌고 노트가 달라짐** |
| 1:50–2:20 | 삼겹살 정식 사진 → 부족 0개, "균형이 좋다"로 끝나는 화면 |
| 2:20–2:40 | History에서 기록 확인 후 하나 삭제 |
| 2:40–3:00 | 구조 한 줄 — Expo가 화면, Express가 API 키 보호와 CRUD, SQLite가 로컬 저장, Gemini가 이미지 분석 |

**1:00–1:50 구간이 발표의 핵심이다.** 대부분의 팀은 "AI가 한 번 호출되고 끝"인 데모를 보여준다. 사용자가 고치면 AI가 다시 판단하는 장면이 차별점이다.

**2:20 구간도 빼지 말 것.** 억지로 흠을 잡지 않는다는 걸 보여주는 유일한 장면이다.

### 시연 준비

- [ ] `sample-images/`에 성격이 다른 사진 3장 — 라면(부족 2개), 샐러드(부족 1개), 고기 정식(부족 0개)
- [ ] 발표 전 Gemini API 키와 인터넷 연결 확인
- [ ] 같은 사진으로 사전에 한 번 테스트
- [ ] History에 기존 리포트 2~3개 남겨두기
- [ ] 노트북과 휴대폰이 같은 Wi-Fi인지 확인, LAN IP 재확인 (강의실 Wi-Fi에서 바뀜)
- [ ] 휴대폰 화면 미러링 또는 화면 녹화 준비
- [ ] API 장애 시 History 조회로 흐름 마무리

### 부스 체험 (관람객이 직접 써보는 시간)

- 관람객이 자기 점심 사진을 찍어 넣는 게 가장 강한 체험이다. 타이핑이 없어 회전이 빠르다.
- 한식 백반 사진만 연달아 들어오면 결과가 비슷해진다. 준비한 샘플 3장을 섞어 보여준다.

---

## 8. 일정 리스크

| 위험 | 대응 |
|---|---|
| Gemini가 "정확히 3~4개", "low만 gap" 규칙을 어김 | 검증(V-5, V-7)에서 걸러내고 사용자에게 재시도 안내. 자동 재시도는 하지 않는다 |
| iOS HEIC 업로드 실패 | `expo-image-manipulator`로 JPEG 변환 후 전송. spike에서 먼저 확인 |
| 강의실 Wi-Fi에서 IP 변경 | 발표 직전 `npm run ip`로 재확인하고 `.env` 수정 후 `npx expo start -c` |
| 1차가 밀려 팀원이 대기 | 확정된 API 계약으로 화면을 병렬 구현하고 실제 API 완성 후 연결 |
| 코치 노트가 매번 같은 문장 | V-9 검증 + `temperature: 0.4` (`ai-contract.md` 9장) |

---

## 9. 제출 전 체크리스트

- [ ] `en/`에 영어 번역본 생성
- [ ] 1페이지 포스터 작성 (LMS 온라인 제출 + 출력)
- [ ] GitHub 저장소 생성 및 푸시 — `.env`와 `server/data/`, `server/uploads/`가 제외되었는지 확인
- [ ] `package-lock.json` 2개 커밋 확인
- [ ] 3분 발표 리허설 1회
