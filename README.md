# KRVCF App Center — app.krvcf.com (v11)

**한국어** · [English](README.en.md)

vSphere Client(Clarity) 스타일의 미니 앱 공유 플랫폼입니다. **Google 계정으로 로그인한 사용자**가 웹 링크 앱(카탈로그)이나 단일 HTML 시뮬레이터(데모룸)를 등록하면 **승인자 승인을 거쳐서만 공개**됩니다. 승인자는 Google 계정이나 이메일 인증 코드로 로그인하고, 모든 행위는 감사 로그에 남습니다. 플랫폼 코드 패치도 관리 콘솔에서 zip을 올리는 방식으로 합니다.

```
app.krvcf.com      →  GitHub Pages (web/)            정적 프론트엔드, 무료
app-api.krvcf.com  →  Cloudflare Worker (worker/)    API · 인증 · 감사 로그 · 샌드박스 실행 · GitHub 패치
                       ├─ D1  : 앱 · 평점 · 피드백 · 방문 · 승인자 · 승인 이력 · 감사 로그 · 설정
                       ├─ KV  : 업로드된 HTML 소스
                       ├─ Resend API      : 인증 코드 · 승인 요청 · 결과 메일 (선택)
                       ├─ Google Identity : 크리에이터·승인자 Google 로그인 (앱 등록에 필수)
                       └─ GitHub API      : UI 패치 커밋 · 롤백 · 재배포 → Actions 자동 배포
```

## GitHub 불러오기 · AI 설명 · 스크린샷 (v11)
- **앱 등록 → 기본 정보 → GitHub에서 불러오기**: 공개 저장소 주소를 넣으면 저장소 정보와 README를 읽어 이름·설명·태그·카테고리·데모 URL·접속 방법을 채우고, README에 있는 스크린샷(배지·SVG 제외, 상대 경로는 raw 주소로 변환)을 최대 8장 가져옵니다. 이미 입력한 칸이 있으면 덮어쓸지 묻습니다.
- **AI 모델**(관리 콘솔 → 설정 → AI 모델, 관리자 전용): Anthropic · OpenAI · Google Gemini(OpenAI 호환) · 기타 OpenAI 호환(vLLM 등). [목록]으로 키가 쓸 수 있는 모델 ID를 불러오고 [연결 테스트]로 확인합니다. API 키는 `SESSION_SECRET`에서 유도한 키로 AES-GCM 암호화해 D1에 저장하며 화면·감사 로그·설정 API에 다시 나오지 않습니다(SESSION_SECRET을 바꾸면 키를 다시 입력). AI를 끄거나 실패·한도 초과 시에는 저장소 설명과 README 첫 부분으로 채웁니다.
- 한도: 사용자당 하루 30회(관리자 제외), 전체 AI 호출은 설정값(기본 200회/일). 호출마다 `ai.github_import` 감사 로그(모델·소요 시간, README 내용은 기록 안 함).
- **스크린샷**: 등록·수정 화면에서 이미지 업로드(브라우저가 자동 축소, 장당 2MB, PNG·JPEG·GIF·WebP — SVG 불가), https 이미지 URL 추가, 끌어다 놓기·붙여넣기, 순서 변경, 설명 입력. 첫 장이 대표 이미지이며 썸네일이 비어 있으면 카드 썸네일로도 쓰입니다. 상세 화면에 갤러리와 확대 보기(←/→).
- 업로드 이미지는 KV(`img:<id>`)에 저장되어 `https://app-api.krvcf.com/img/<id>`로 제공되며, 어떤 앱도 참조하지 않게 되면 자동 삭제됩니다. 백업 JSON에는 이미지 파일이 포함되지 않습니다(주소만 포함).

## 카탈로그 데모 URL · 접속 방법 (v10)
- 카탈로그(외부 웹 링크) 앱은 등록·수정 시 **데모 URL**(http/https, 사내·랩 주소 허용)과 **접속 방법**(VPN, 테스트 계정, 권장 브라우저 등)이 필수입니다.
- "접속 방법은 로그인한 사용자에게만 보이기"를 켜면 비로그인 방문자에게는 안내 문구만 보이고, 목록 API에는 접속 방법이 아예 실리지 않습니다.
- 상세 화면: **데모 실행** 버튼(실행 수에 집계), "데모 · 접속 방법" 패널(복사 버튼), 앱 정보에 데모 URL. 관리 콘솔 검토 화면·Owner Studio에도 표시됩니다.
- 기존 링크 앱은 그대로 공개되며, 소유자가 다음에 수정할 때 두 항목을 입력해야 합니다(관리자 편집은 예외). DB: `migrations/0007_demo_access.sql`.

## 운영 편의 기능 (v9)

| 기능 | 내용 |
|---|---|
| 알림 센터 | 헤더 🔔(로그인 시). 크리에이터: 승인·반려, 새 리뷰, 비공개 피드백, 링크 장애·복구. 승인자: 신규·재승인 요청. 관리자: 신고 접수, 링크 장애. 1분마다 갱신, 클릭하면 해당 화면(내 앱 관리 / 관리 콘솔 탭)으로 이동. 90일 보관 |
| 리뷰 답글 | 앱 소유자가 Owner Studio → 리뷰·피드백에서 공개 리뷰에 답글을 달고 수정·삭제. 앱 상세의 리뷰 아래에 "작성자 답글"로 표시 |
| 즐겨찾기 동기화 | 로그인하면 이 브라우저의 즐겨찾기가 계정에 합쳐지고, 다른 기기에서도 같은 목록을 씁니다 |
| 변경 비교 | 승인 시점의 버전을 `approved_version`으로 기록. 공개 앱이 수정돼 재승인을 요청하면 관리 콘솔 검토 창에 **변경 비교**(공개 버전 → 새 버전 줄 단위 diff, +/− 통계)가 뜹니다. Owner Studio 대기 배너·버전 목록의 **현재와 비교**도 같은 화면 |
| 링크 상태 점검 | 매일 크론에서 링크 앱 40개씩(가장 오래 점검 안 된 순) HEAD/GET 점검. 401·403·429는 정상으로 간주, 404·5xx·타임아웃은 "연결 불가"로 표시하고 소유자·관리자에게 알림. 관리 콘솔 **링크 일괄 점검**(관리자), 검토 창 **링크 점검**(승인자+) |
| 공유 미리보기 | 상세의 **공유**는 `https://app-api.krvcf.com/s/<id>` 링크를 복사합니다. 카카오톡·Slack·Teams가 앱 이름·설명·이미지(`icons/og.png` 또는 썸네일)로 미리보기를 만들고, 클릭하면 앱 상세로 이동. 승인되지 않은 앱은 정보 없이 홈으로 보냅니다 |
| 초성 검색 | 검색창과 Ctrl/⌘+K에서 `ㅅㅇㅈ` → "사이저"처럼 한글 초성으로 찾기 |

마이그레이션 `0006_notifications_replies_links.sql`은 배포 워크플로가 자동 적용합니다(기존 공개 앱은 현재 버전을 승인 버전으로 백필).

## 계정과 Owner Studio (v8)

| 항목 | 내용 |
|---|---|
| 등록 조건 | **앱 등록·수정·삭제·복원은 Google 로그인 필수.** 로그인하지 않으면 등록 화면 대신 로그인 안내가 나옵니다. 승인자로 등록되지 않은 Google 계정은 **크리에이터**(`user`) 역할로 로그인되며 세션은 7일입니다 |
| 소유권 | 새 앱은 로그인한 계정(`apps.owner_email`)에 묶이고, 승인 결과 메일도 그 주소로 갑니다. 다른 계정은 수정·삭제·복원·미리보기를 할 수 없습니다 |
| Owner Studio | 헤더 계정 메뉴·내비게이션 **내 앱 관리**(`#/studio`): 내 앱 KPI(공개·대기·반려, 7일 조회·실행, 평균 평점, 미처리 신고), 앱 목록. 앱별 관리(`#/studio/<id>`)는 **개요**(30일 조회·실행 차트, 평점 분포, 승인 이력) · **버전**(미리보기·복원) · **리뷰·피드백**(공개 리뷰 + 비공개 피드백) · **설정**(앱 정보, 앱 이름을 입력해 삭제) |
| 기존 앱 연결 | v7까지 **소유 키**로 등록한 앱은 Owner Studio → **기존 앱 연결**(앱 ID + 소유 키, 또는 내보낸 JSON)로 계정에 연결합니다. 이 브라우저에 키가 있으면 **모두 연결** 배너가 뜹니다. 이미 다른 계정에 연결된 앱은 연결되지 않습니다 |
| 관리 | 관리 콘솔 **사용자** 탭: 로그인한 계정·앱 수·최근 로그인, **차단**(즉시 세션 무효, 재로그인 불가). 앱 검토 창에서 **소유자 계정 변경** |
| 보안 | 세션 토큰·소유 키는 URL로 받지 않습니다. 승인 전 앱이나 이전 버전 미리보기는 앱 하나에만 유효한 **5분짜리 실행 티켓**(`/run/:id?rt=`)을 씁니다. 샌드박스 HTML이 자기 URL을 읽어도 세션이 새지 않습니다 |

> **운영 전 필수**: `GOOGLE_CLIENT_ID` 시크릿이 없으면 최고 관리자(비밀번호) 외에는 누구도 앱을 등록할 수 없습니다. 아래 *3-A. Google 로그인*을 먼저 설정하세요. 마이그레이션 `0005_user_accounts.sql`은 배포 워크플로가 자동 적용합니다.

## 커뮤니티 기능 (v7)

| 기능 | 내용 |
|---|---|
| 태그 | 앱당 최대 5개(소문자·20자 이하). 카드·상세에 표시, `#/tag/<태그>` 페이지, 홈 **인기 태그**, 검색창에 `#태그` 입력 |
| 작성자 페이지 | 카드·상세의 작성자 이름 클릭 → `#/author/<이름>` (앱 수·누적 실행·평균 평점) |
| 버전 기록 | 소스(HTML·URL)가 바뀔 때마다 v+1, **변경 내용** 메모와 함께 최근 10개 보관. 소유자·관리자는 이전 버전 **미리보기**(`/run/:id?v=N`)와 **복원**(새 버전으로 기록, 관리자 외에는 재승인) |
| 공개 리뷰 | 별점 + 닉네임 + 리뷰 글(브라우저당 1개, 수정·삭제 가능), 별점 분포 막대. 기존 비공개 피드백은 **비공개 피드백** 버튼으로 유지 |
| 신고 | 스팸·악성 코드·동작 안 함·저작권·부적절·기타 (IP당 하루 5건). 관리 콘솔 **신고·리뷰** 탭에서 조치 완료/기각, 리뷰 숨김/삭제 |
| 웹훅 | 설정 탭에서 URL과 이벤트(신규 등록·승인 결정·신고·새 리뷰) 지정. Google Chat·Slack은 `{text}`, Discord는 `{content}`, 그 외는 JSON. 전송 결과는 감사 로그 `webhook.send` |
| RSS | `https://app-api.krvcf.com/feed.xml` — 최근 등록·승인된 앱 30개 |
| 빠른 이동 | **Ctrl/⌘ + K** — 페이지·앱·태그(`#`)·작성자(`@`) 검색 후 Enter. 모바일은 메뉴의 **빠른 이동** |

마이그레이션 `0004_tags_versions_comments_reports.sql`은 Worker 배포 워크플로가 자동 적용합니다(기존 앱은 v1으로 백필).

## 역할과 승인 절차

| 역할 | 로그인 | 할 수 있는 일 |
|---|---|---|
| 크리에이터 | Google (필수) | 앱 등록, 내 앱 수정(→ 재승인 대기)·삭제·버전 복원, Owner Studio에서 상태·통계·리뷰·피드백 확인 |
| 승인자 | Google / 이메일 코드 | 승인 대기 앱 실행·검토, 승인, 반려(사유 필수), 피드백 열람 |
| 관리자 | Google / 이메일 코드 | 승인자 업무 + 승인자 등록·비활성화, 감사·방문 로그, 설정, 패치·롤백, 백업 |
| 최고 관리자 | `ADMIN_PASSWORD` | 관리자 업무 + **관리자 역할 부여·회수** (비상용 계정) |

1. 작성자가 앱을 등록하거나 수정하면 상태가 `승인 대기`가 되고, 활성 승인자 전원에게 승인 요청 메일이 갑니다.
2. 승인자가 관리 콘솔에서 검토를 열어 실행해 본 뒤 승인 또는 반려(사유 필수)합니다.
3. 결과와 사유는 작성자 이메일, 앱의 **승인 이력** 타임라인, **감사 로그**에 기록됩니다.
4. 승인자를 비활성화하거나 삭제하면 그 사람의 로그인 세션이 **즉시** 무효가 됩니다(요청마다 DB에서 확인).

자동 승인, 메일 알림, 로그 보관 기간, 상단 공지는 관리 콘솔 → 설정에서 바꿉니다.

## 다국어 (v5) — 한국어 / English

- **언어 결정**: 헤더의 `EN` / `한국어` 버튼으로 바꾸고, 선택은 브라우저에 저장됩니다. 저장된 값이 없으면 브라우저 언어를 따릅니다(ko → 한국어, 그 외 → English).
- **번역 범위**: 모든 UI 문구, placeholder·툴팁, 토스트, 확인창, 서버 오류 메시지, 날짜·숫자 형식(`en-US`), 국가명(Intl)을 번역합니다. 앱 이름·설명·작성자 같은 **사용자 작성 콘텐츠는 번역하지 않습니다**.
- **동작 방식**: `web/i18n.js`가 화면에 그려진 텍스트를 사전(정확히 일치) → 정규식 규칙(숫자·이름이 들어간 문장) → `·`, `/`로 나눈 조각 순으로 번역합니다. 그 뒤에 그려지는 화면은 MutationObserver가 처리합니다. 같은 값을 다시 쓰지 않고, 비정상적으로 반복되면 관찰을 멈추는 안전장치가 있습니다.
- **API**: 응답 메시지도 언어별로 나갑니다. 웹이 항상 보내는 `x-lang: en|ko` 헤더를 따르고, 헤더가 없으면 `Accept-Language`(한국어가 아니면 영어)를 따릅니다.
- **메일**: 인증 코드, 승인 요청, 승인·반려 결과, 승인자 초대, 테스트 메일을 모두 **한국어 + English 병기**로 보냅니다. 샌드박스 실행 오류 페이지도 두 언어로 함께 표시합니다.
- **문구 추가·수정**: UI 문구를 새로 추가하면 `web/i18n.js`의 `EN` 사전(고정 문구)이나 `RX` 규칙(변수가 들어간 문구)에 영어를 함께 넣으세요. API 메시지는 `worker/src/index.js`의 `MSG_EN`도 함께 고칩니다.
- **코드·문서**: 소스 주석, 로그, 샘플 앱은 영어(샘플 앱은 한/영 전환)로 작성되어 있고, 영문 문서는 [README.en.md](README.en.md)에 있습니다.

## 모바일 (v4)

| 항목 | 내용 |
|---|---|
| 하단 탭 바 | 홈 · 전체 앱 · **등록(+)** · 즐겨찾기 · 내 앱(로그인 시 관리). 화면 폭 600px 이하에서 표시하고, "최근 작업" 패널은 숨깁니다 |
| 표 → 카드 | 관리 콘솔의 모든 표(승인 대기·전체 앱·승인자·감사 로그·피드백 등)를 "열 이름: 값" 카드로 바꿔 가로 스크롤을 없앴습니다 |
| 실행 화면 | 전체 화면 + 아이콘 버튼만 있는 헤더(제목 한 줄), `100dvh` 적용으로 주소창 높이 변화에 대응합니다 |
| 모달 | 하단에서 올라오는 바텀 시트로 바꾸고 버튼을 꽉 차게 배치했습니다 |
| 등록 마법사 | 단계 탭은 가로 스크롤, 이전·다음 버튼은 하단에 고정됩니다 |
| 입력 | 글자 크기 16px로 iOS 자동 확대를 막았고, 터치 기기에서는 누르는 영역을 40~44px로 키웠습니다 |
| 노치 대응 | `viewport-fit=cover` + safe-area 여백 (헤더·탭 바·실행 화면) |
| 홈 화면 앱 | `manifest.webmanifest` + 아이콘(192/512/maskable/apple-touch). 홈 화면에 추가하면 전체 화면 앱으로 실행되고, 바로가기는 데모룸·등록·즐겨찾기입니다 |
| 기타 | 카테고리 칩 한 줄 가로 스크롤, 내비게이터는 왼쪽으로 밀어서 닫기, 관리 탭은 선택한 탭이 가운데로 오도록 자동 스크롤 |

## 방문자 통계 (v3)

| 지표 | 산출 방식 |
|---|---|
| 방문자(UV) | 브라우저별 익명 ID(localStorage 무작위값, 서버에는 해시만 저장). 없으면 IP 해시 |
| 오늘 방문자 / 신규 / 재방문 | `daily_seen`으로 하루 1회만 집계(KST 기준), 처음 본 ID는 신규 |
| 페이지뷰(PV) | SPA 화면 전환마다 1회(같은 화면 연속 이동은 제외) |
| 현재 접속 | 60초 heartbeat, 최근 3분 내 활동 |
| 누적 방문자 · 7일 · 30일 | `visitors` 테이블(영구) |
| 앱 조회수 | 상세 화면 진입. 같은 방문자는 30분에 1회만 집계 |
| 유입 경로 | 세션 첫 페이지의 referrer 도메인(없으면 직접 방문) |
| 국가 · 기기 · 브라우저 | Cloudflare 국가 코드, User-Agent(카카오톡·네이버·웨일 인앱 구분) |

- **제외**: 봇·크롤러 UA, 관리 콘솔 화면
- **보관**: 일별 집계(`daily`, `app_daily`)는 영구 보관합니다. 페이지·유입·국가·기기 분석은 원본 방문 로그 보관 기간(기본 30일) 안에서만 계산합니다.
- **표시 위치**:
  - 홈: 오늘·누적·현재 접속 카드, 이번 주 인기 앱
  - 좌측 하단: 실시간 카운터
  - 관리 콘솔 → **방문 통계**(승인자 이상): 일별 추이 차트(7일·30일·90일·1년, 표 보기), 시간대별, 실시간 접속 목록, 인기 페이지·앱, 유입·국가·기기, 30초 자동 갱신
- **D1 쓰기량**: 페이지뷰 1건에 약 6~8행을 씁니다. 무료 한도(하루 10만 행) 안에서 하루 약 1만 페이지뷰까지 운영할 수 있습니다.

그 밖에 앱 카드·상세 화면에 조회수와 **즐겨찾기(★)** 를 추가했습니다(좌측 "즐겨찾기", 홈 섹션). 홈에는 **최근 본 앱**을 표시하고, 정렬 기준에 **조회순**을 넣었습니다.

## 감사 로그

아래 행위는 사용자, 역할, 대상, 상세(JSON), 성공 여부, 마스킹된 IP, 국가, User-Agent와 함께 `audit_log`에 남습니다. 관리 콘솔에서 조건별로 조회하고 CSV로 내보낼 수 있습니다.

`app.create / update / delete / review / run / preview / rate / feedback / feature` · `auth.login`(성공·실패 사유) · `auth.otp_request` · `auth.logout` · `approver.create / update / delete` · `settings.update` · `repo.patch / rollback / redeploy` · `backup.export / restore` · `stats.reset` · `visits.clear` · `feedback.delete` · `mail.*`(발송 성공 여부)

보관 기간은 기본 180일이고, 매일 03:17 KST에 Cron이 오래된 로그를 정리합니다.

## UI 패치 (관리 콘솔 → 패치 / 배포)

1. zip 또는 개별 파일을 끌어다 놓습니다. zip 안의 경로는 저장소 루트 기준이고(`web/app.js`), 최상위 폴더 하나는 자동으로 제거됩니다. `node_modules`, `.git`, `.dev.vars`는 무시합니다.
2. 브라우저가 각 파일의 git blob SHA를 계산해 저장소와 비교하고 **신규·변경·동일**로 표시합니다. 경로는 직접 고칠 수 있고, 개별 파일은 파일명이 같은 경로에 자동으로 매칭합니다.
3. 파일을 삭제하려면 zip에 `patch.json`을 넣습니다: `{"delete": ["web/old.js"]}`
4. **패치 적용**을 누르면 Worker가 GitHub API로 커밋합니다. 그동안 저장소가 바뀌었으면 충돌로 감지하고 강제 적용 여부를 묻습니다.
5. 바뀐 영역에 따라 Actions가 자동으로 실행되고(web/ → 웹, worker/ → API·DB 마이그레이션), 화면에서 진행 상황을 추적합니다.
6. 커밋 이력에서 **이 버전으로 롤백**을 누르면 해당 시점의 트리로 새 커밋을 만들어 재배포합니다. DB 데이터는 되돌리지 않습니다.
7. 웹이 새로 배포되면 열려 있는 브라우저에 "새 버전 배포됨 · 새로고침" 알림이 뜹니다. 정적 파일에는 `?v=커밋`이 붙어 캐시 문제도 없습니다.

---

## 배포 (최초 1회)

### 0. 자동 설치 스크립트 (B~H)

저장소를 만들어 push한 뒤(1단계), 나머지는 스크립트 하나로 진행할 수 있습니다. Node.js 20+와 `gh auth login`이 필요합니다.

```bash
node scripts/setup.mjs            # 안 끝난 단계부터 이어서 (입력값·진행: ~/.krvcf-setup/)
node scripts/setup.mjs --all      # 모든 단계 다시 (저장된 입력값 재사용)
node scripts/setup.mjs --reset    # 진행 기록 초기화 + Cloudflare Worker·D1·KV 삭제 후 처음부터
node scripts/setup.mjs --forget   # 저장된 입력값까지 삭제
node scripts/setup.mjs --from F   # 특정 단계부터 재개
node scripts/setup.mjs --only G   # 한 단계만
node scripts/setup.mjs --check    # 설치 상태 점검(읽기 전용)
```

Cloudflare 토큰·Google Client ID·GitHub 패치 토큰은 공개 생성 API가 없거나 첫 토큰이 필요해서, 스크립트가 권한이 미리 채워진 화면을 열고 붙여 넣은 값을 검증합니다. 나머지(권한 점검, DNS, Resend 도메인 인증, Secrets, 배포 실행·대기, Pages·HTTPS, 관리자 등록)는 자동입니다. 비밀 값은 디스크에 저장하지 않습니다.

### 1. 저장소 생성

```bash
git init && git add . && git commit -m "KRVCF App Center v2"
gh repo create krvcf-app-center --public --source . --push
```

### 2. GitHub Secrets

| Secret | 필수 | 값 / 발급 방법 |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | ✅ | Cloudflare → API Tokens → 템플릿 "Edit Cloudflare Workers"에 **Account · D1 : Edit** 추가, Zone은 krvcf.com |
| `CLOUDFLARE_ACCOUNT_ID` | ✅ | Cloudflare 대시보드의 Account ID |
| `ADMIN_PASSWORD` | ✅ | 최고 관리자 비밀번호(길게) |
| `SESSION_SECRET` | 권장 | `openssl rand -base64 32` — 세션 서명 키(없으면 ADMIN_PASSWORD 사용) |
| `GOOGLE_CLIENT_ID` | 선택 | 아래 3-A |
| `RESEND_API_KEY` | 선택 | 아래 3-B |
| `MAIL_FROM` | 선택 | 기본 `KRVCF App Center <noreply@krvcf.com>` |
| `PATCH_GITHUB_TOKEN` | 선택 | 아래 3-C (UI 패치용) |

```bash
gh secret set CLOUDFLARE_API_TOKEN
gh secret set CLOUDFLARE_ACCOUNT_ID
gh secret set ADMIN_PASSWORD
openssl rand -base64 32 | gh secret set SESSION_SECRET
```

API 워크플로가 실행될 때마다 값이 있는 시크릿만 Worker에 일괄 동기화합니다(`wrangler secret bulk`). 저장소 이름과 브랜치(`GH_REPO`, `GH_BRANCH`)는 자동으로 들어갑니다.

### 3-A. Google 로그인 (앱 등록에 필수)

1. Google Cloud Console → API 및 서비스 → OAuth 동의 화면을 구성합니다(외부, 앱 이름 "KRVCF App Center").
2. 사용자 인증 정보 → **OAuth 클라이언트 ID** → 유형 **웹 애플리케이션**을 고릅니다.
3. **승인된 JavaScript 원본**에 `https://app.krvcf.com`을 넣습니다(로컬 테스트를 하려면 `http://localhost:8080`도 추가).
4. 발급된 클라이언트 ID(`…apps.googleusercontent.com`)를 `GOOGLE_CLIENT_ID` 시크릿에 넣습니다.

Worker는 Google 공개키로 ID 토큰의 RS256 서명, `iss`, `aud`, 만료, `email_verified`를 직접 검증합니다. 승인자 테이블에 있는 이메일은 승인자·관리자로, 나머지는 크리에이터로 로그인합니다. 차단된 계정은 거부합니다.

### 3-B. 이메일 인증 코드·알림 메일 (선택, Resend)

1. resend.com에 가입한 뒤 Domains에 `krvcf.com`을 추가합니다. 안내되는 DNS 레코드(SPF·DKIM)를 Cloudflare DNS에 넣고 Verify를 누릅니다.
2. API Keys → Create(Sending access)로 키를 만들어 `RESEND_API_KEY`에 넣습니다.
3. 관리 콘솔 → 설정 → **테스트 메일**로 발송을 확인합니다.

Resend 무료 플랜은 월 3,000통, 하루 100통, 도메인 3개입니다([Resend 가격표](https://resend.com/pricing)).

인증 코드는 6자리이고 10분 동안 유효합니다. 시도 5회, IP·이메일별 발송 횟수에 제한이 있습니다. 등록되지 않은 이메일인지 아닌지 응답만으로는 구분되지 않게 했습니다.

### 3-C. UI 패치용 GitHub 토큰 (선택)

GitHub → Settings → Developer settings → **Fine-grained personal access tokens**에서 만듭니다.
- Repository access: **이 저장소만**
- Permissions: **Contents: Read and write**, **Actions: Read and write**, **Workflows: Read and write**(워크플로 파일을 패치할 때만), Metadata: Read

`PATCH_GITHUB_TOKEN` 시크릿에 넣습니다. GitHub는 `GITHUB_`로 시작하는 시크릿 이름을 허용하지 않아서 이 이름을 씁니다.

### 4. API 배포

Actions → **Deploy API (Cloudflare Worker)** → Run workflow를 실행하면 다음이 자동으로 진행됩니다.
D1·KV 생성 → 마이그레이션(0001~0003) → 배포(`app-api.krvcf.com` 커스텀 도메인 자동 연결, `VERSION`=커밋) → 시크릿 동기화

확인: `https://app-api.krvcf.com/api/health`

### 5. 웹 배포 (GitHub Pages + Cloudflare DNS)

1. Settings → Pages → Source를 **GitHub Actions**로 바꿉니다.
2. Actions → **Deploy Web (GitHub Pages)** → Run workflow를 실행합니다.
3. Cloudflare DNS에 `CNAME app → <GitHub 사용자명>.github.io`를 **DNS only(회색 구름)**로 추가합니다.
4. Pages → Custom domain에 `app.krvcf.com`을 입력하고, 인증서가 발급되면 **Enforce HTTPS**를 켭니다.

### 6. 첫 로그인과 승인자 등록

1. `https://app.krvcf.com/#/admin` → "최고 관리자(비밀번호) 로그인"으로 들어갑니다.
2. 설정 탭의 **연동 상태**에서 Google·메일·GitHub가 "설정됨"인지 확인합니다.
3. 승인자 관리 탭에서 이메일을 등록합니다(역할: 승인자/관리자, 안내 메일 발송 선택).
4. 이후 승인자는 Google 또는 이메일 코드로 로그인합니다.

이 단계가 끝나면 플랫폼 코드는 관리 콘솔의 **패치 / 배포** 탭에서 zip으로 올려 반영합니다.

---

## 무료 운영 범위

| 서비스 | 무료 한도 | 이 서비스의 사용처 |
|---|---|---|
| Cloudflare Workers | 하루 요청 100,000건 | API 전체 |
| D1 | 하루 읽기 500만 행·쓰기 10만 행, 저장 5GB | 감사 로그 포함 모든 쓰기 |
| KV | 하루 읽기 100,000건·쓰기 1,000건, 저장 1GB | HTML 등록·수정 때만 쓰기 |
| Resend | 월 3,000통·하루 100통 | 인증 코드, 승인 요청, 결과 메일 |
| GitHub Pages / Actions | public 저장소 무료 | 웹 호스팅, 배포 |

Cloudflare 한도 출처: [Workers Pricing](https://developers.cloudflare.com/workers/platform/pricing/)

Workers 무료 플랜은 요청 하나당 외부 서브요청이 50개로 제한됩니다. 그래서 패치할 때 텍스트 파일은 트리에 바로 넣어 한 번의 호출로 커밋하고, 바이너리 파일만 개별 blob으로 올립니다(한 번에 최대 35개).

## 설정 위치

| 항목 | 위치 |
|---|---|
| 자동 승인, 메일 알림, 로그 보관 기간, 공지 | 관리 콘솔 → 설정 (D1 저장, 즉시 반영) |
| API 주소 | `web/config.js` |
| 허용 도메인(CORS·iframe) | `worker/wrangler.toml`의 `ALLOWED_ORIGINS` |
| 카테고리 | `worker/src/index.js`의 `CATEGORIES`와 `web/app.js`의 `CATS` |

## 로컬 개발

```bash
cd worker && npm install
cat > .dev.vars <<'EOV'
ADMIN_PASSWORD=test1234
MAIL_MODE=console
DEV_LOGIN=true
EOV
npm run dev                                  # http://localhost:8787
cd ../web && python3 -m http.server 8080     # http://localhost:8080
```

`DEV_LOGIN=true`이면 Google 없이 이메일만으로 크리에이터 로그인을 흉내 내는 개발용 폼(`POST /api/auth/dev`)이 로그인 창에 나옵니다. CI 배포(`VERSION=<커밋 SHA>`)에서는 값과 상관없이 꺼져 있습니다. `MAIL_MODE=console`이면 메일을 실제로 보내지 않고 Worker 로그에 출력합니다. 이메일 인증 코드는 로그인 화면에도 표시되므로 **운영에서는 설정하지 마세요**.

## API 요약

| Method | Path | 권한 |
|---|---|---|
| GET | `/api/config` · `/api/apps` · `/api/stats` | 공개 |
| POST | `/api/apps/:id/run` · `/rate` · `/feedback` · `/api/visit` | 공개 |
| GET/PUT/DELETE | `/api/apps/:id` · GET `/source` · `/reviews` | 소유자(로그인) / 승인자 / 관리자 |
| POST | `/api/auth/password` · `/email/start` · `/email/verify` · `/google` · `/dev`(로컬 전용) · `/logout`, GET `/api/auth/me` | — |
| GET | `/api/admin/overview` · `/feedback`, POST `/apps/:id/status` | 승인자+ |
| GET/POST/PUT/DELETE | `/api/admin/approvers[/:email]` | 관리자+ (관리자 역할은 최고 관리자) |
| GET | `/api/admin/audit?action=&actor=&q=&ok=&from=&to=&before=&limit=` | 관리자+ |
| GET/PUT | `/api/admin/settings`, POST `/test-mail` | 관리자+ |
| GET/DELETE | `/api/admin/visits`, DELETE `/feedback/:id`, POST `/apps/:id/feature` · `/reset-stats` | 관리자+ |
| GET | `/api/admin/repo/status` · `/tree` · `/runs?sha=` | 관리자+ |
| POST | `/api/admin/repo/patch` · `/rollback` · `/dispatch` | 관리자+ |
| GET/POST | `/api/admin/backup` · `/restore` | 관리자+ |
| POST | `/api/apps` | Google 로그인 사용자 |
| GET | `/api/my/apps` · `/api/my/apps/:id`, POST `/api/my/claim` | 로그인 사용자(본인 앱) |
| POST | `/api/apps/:id/run-ticket` | 소유자·승인자+ (5분 실행 티켓) |
| GET/POST | `/api/admin/users`, POST `/users/:email` · `/apps/:id/owner` | 관리자+ |
| GET | `/api/apps/:id/versions`, POST `/versions/:v/restore` | 공개(목록) / 소유자·관리자(복원) |
| GET/POST/DELETE | `/api/apps/:id/comments`, POST `/report` | 공개 |
| GET | `/api/admin/reports?status=all` · `/comments`, POST `/reports/:id` · `/comments/:id` | 승인자+ |
| DELETE | `/api/admin/comments/:id`, POST `/test-webhook` | 관리자+ |
| GET | `/feed.xml` | RSS |
| GET | `/s/:id` | 공유 미리보기(Open Graph) → 앱 상세로 이동 |
| GET/POST | `/api/my/notifications`, POST `/api/my/notifications/read` | 로그인 사용자 |
| GET/POST | `/api/my/favs` | 로그인 사용자 |
| POST | `/api/my/apps/:id/comments/:cid/reply` | 소유자·관리자 |
| GET | `/api/apps/:id/versions/:v/source` | 소유자·승인자+ |
| POST | `/api/admin/apps/:id/check-link` · `/api/admin/check-links` | 승인자+ · 관리자+ |
| GET | `/run/:id` | 샌드박스 실행(승인 전·이전 버전 `?v=N`은 `?rt=` 실행 티켓 필요) |

---
비공식 커뮤니티 프로젝트이며, VMware 또는 Broadcom의 공식 서비스가 아닙니다.
