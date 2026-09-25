# AI Meal Coach

식사 사진 한 장으로 한 끼의 영양 균형을 확인하고, 부족한 영양 요소와 그것을 채울 수 있는 식품을 알려주는 로컬 모바일 앱입니다. 메뉴를 추천하지 않습니다.

> Software Engineering Phase 1 Scratch Project · 2인 페어 프로젝트

## 문서

| 문서 | 내용 |
|---|---|
| [`project_spec.md`](./project_spec.md) | 제품 정의, 기능, 화면, 데이터, API |
| [`ai-contract.md`](./ai-contract.md) | Gemini 프롬프트, JSON Schema, 응답 검증 |
| [`team-plan.md`](./team-plan.md) | 역할 분담, 구현 순서, 시연 (팀 내부용) |
| `en/` | 제출용 영어 번역본 (제출 전 생성) |

## 프로젝트 구조

```text
ai meal coach/
├─ project_spec.md
├─ ai-contract.md
├─ team-plan.md
├─ README.md
├─ package.json            # 실행 편의 스크립트만
├─ .gitignore
├─ en/                     # 영어 번역본
├─ sample-images/          # 시연용 샘플 사진
├─ mobile/                 # Expo React Native 앱
│  └─ src/
│     ├─ components/       # MealPhotoPicker, NutritionBalance, CoachNote, LoadingState
│     ├─ screens/          # AnalyzeScreen, ReportScreen, HistoryScreen, EditReportScreen
│     └─ utils/            # normalizeImage, formatDate
└─ server/                 # Node.js + Express + SQLite
   ├─ data/                # meal-coach.db (자동 생성, Git 제외)
   ├─ uploads/             # 업로드 이미지 (Git 제외)
   └─ src/
      ├─ routes/           # reports.js
      ├─ services/         # geminiService.js, reportService.js
      ├─ middleware/       # upload.js, errorHandler.js
      └─ utils/            # reportMapper.js, validators.js
```

`mobile/`과 `server/`는 각각 독립된 npm 프로젝트입니다. npm workspaces는 쓰지 않습니다 — Expo의 Metro 번들러가 워크스페이스 호이스팅과 충돌하는 경우가 있어 하루짜리 프로젝트에서 감수할 이유가 없습니다.

## 사전 조건

- Node.js 22 LTS
- Gemini API key — https://aistudio.google.com/apikey
- 실기기(iOS 또는 Android)에 **Expo Go** 앱 설치
- **노트북과 휴대폰이 같은 Wi-Fi에 연결**되어 있어야 합니다

## 1. 서버 실행

```bash
cd server
npm install
cp .env.example .env     # 그 다음 .env에 실제 API 키 입력
npm run dev
```

확인:

```bash
curl http://localhost:3001/api/health
# {"status":"ok"}
```

## 2. 노트북 LAN IP 확인

휴대폰이 `localhost`로는 노트북에 접속할 수 없습니다. 노트북의 내부 IP가 필요합니다.

```bash
# macOS
ipconfig getifaddr en0

# Windows
ipconfig    # "IPv4 주소" 항목

# Linux
hostname -I | awk '{print $1}'
```

`192.168.0.12` 같은 값이 나옵니다.

## 3. 앱 실행

```bash
cd mobile
npm install
cp .env.example .env      # EXPO_PUBLIC_API_BASE_URL에 위에서 확인한 IP 입력
npx expo start
```

터미널의 QR 코드를 Expo Go로 스캔하면 실기기에서 앱이 열립니다.

## 환경변수

**`server/.env`**

```text
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-3.5-flash-lite
PORT=3001
```

**`mobile/.env`**

```text
EXPO_PUBLIC_API_BASE_URL=http://192.168.0.12:3001
```

`EXPO_PUBLIC_` 접두사가 붙은 값은 앱 번들에 포함됩니다. **API 키를 여기에 절대 넣지 마세요.** Gemini 호출은 서버에서만 일어납니다.

`.env` 파일은 Git에 커밋하지 않습니다.

## 루트 스크립트

```bash
npm run server     # 서버 개발 모드
npm run mobile     # Expo 개발 서버
npm run ip         # 노트북 LAN IP 출력 (macOS/Linux)
```

## 트러블슈팅

| 증상 | 확인할 것 |
|---|---|
| 앱에서 `Cannot reach the server` | 노트북과 휴대폰이 같은 Wi-Fi인지, `EXPO_PUBLIC_API_BASE_URL`의 IP가 맞는지. Wi-Fi를 바꾸면 IP도 바뀝니다. |
| `curl`은 되는데 앱만 실패 | 서버가 `0.0.0.0`에 바인딩되어 있는지. `localhost`만 듣고 있으면 외부에서 접속 못 합니다. |
| 방화벽 | macOS 시스템 설정 → 네트워크 → 방화벽에서 Node 수신 허용 |
| `.env` 수정이 반영 안 됨 | Expo는 `.env`를 시작 시 읽습니다. `npx expo start -c`로 캐시 지우고 재시작하세요. |
| 사진 업로드가 실패 | iOS HEIC 원본이 그대로 전송되고 있지 않은지. `expo-image-manipulator`로 JPEG 변환 후 전송해야 합니다. |
| 분석이 계속 실패 | `server/.env`의 API 키, 노트북의 인터넷 연결, 서버 콘솔의 Gemini 오류 로그 |
| 서버 재시작 후 기록이 사라짐 | `server/data/meal-coach.db`가 생성되어 있는지. `.gitignore`에는 있지만 로컬에는 남아야 합니다. |

## 제약

- 로컬 개발·시연 전용입니다. 배포나 앱 스토어 빌드를 전제하지 않습니다.
- 계정이 없으므로 이 서버에 붙는 모든 기기가 같은 기록을 봅니다.
- 데이터는 노트북에만 저장되며 자동 백업되지 않습니다.
- Mock AI 모드가 없어 인터넷이나 Gemini API가 죽으면 신규 분석과 재분석이 중단됩니다. 기존 기록 조회와 삭제는 계속 동작합니다.

## 면책

```text
AI-generated estimates may be inaccurate and are not intended for
medical or dietary diagnosis.
```
