# 앱인토스 구조 전환 계획 — 토스 도메인 안에서 렌더링되는 CSR 미니앱

작성일 2026-11-06. 근거는 `apps-in-toss-harness` launch 스킬 절차와 개발자센터 문서
(`/checklist/app-nongame`, `/documentation/integration/server-api`, `/guide/authentication/*`).

## 1. 배경

현재 `.ait` 번들은 정적 셸 하나(`appintoss/web/index.html`)가 `window.location.replace`로
Railway(`date-course-builder-production.up.railway.app`)로 이동하는 구조다.
비게임 체크리스트 "보안 및 안정성" 절은 이 방식을 예시까지 들어 금지한다.

> 브라우저 히스토리 조작이나 웹뷰 임베드 등 어떤 방식으로든 자사 사이트(토스 도메인 외부)로
> 이동하거나 그 콘텐츠를 렌더링할 수 없어요. (예: `window.location.replace` …)
> 서버 사이드 렌더링(SSR)은 사용할 수 없어요. CSR 또는 SSG만 사용할 수 있어요.

함께 걸리는 항목: 확대·축소 미제한, 사용자 식별키 미사용, SDK 2.10.5(최신 3.9.0).

## 2. 목표 구조

| 구성 | 위치 | 역할 |
|---|---|---|
| 웹 + API 서버 | 루트 Next.js (Railway, 그대로) | 일반 웹 UI(SSR, OG 메타) + `/api/*` JSON API |
| 미니앱 | `miniapp/` Vite + React SPA (신규) | 토스 도메인에서 CSR로 렌더링. UI는 루트 `src/components`를 **그대로 재사용** |

핵심 아이디어: 컴포넌트는 이미 대부분 `"use client"`이고 `next/link`·`next/navigation`·
`next/dynamic`만 쓴다. `miniapp/`의 Vite `resolve.alias`로 이 세 모듈을 react-router 기반
shim으로 바꿔 끼우면 컴포넌트 코드를 복사하지 않고 두 타깃에서 같은 UI를 쓸 수 있다.
서버 컴포넌트였던 페이지(`/c/[slug]`, `/history`, `/results`)만 데이터를 API로 받는
클라이언트 뷰로 뽑아낸다.

## 3. 단계

### Phase 1 — 서버(Next) 준비. 웹 동작은 바뀌지 않는다

1. **API 경로 헬퍼** `src/lib/api.ts`: `apiUrl(path)` = `${API_BASE}${path}`. 웹은 `""`,
   미니앱은 Vite `define`으로 `process.env.NEXT_PUBLIC_API_BASE`에 Railway origin을 넣는다.
   fetch 호출 7곳과 `MemoryLog`의 미디어 `src`를 이 헬퍼로 바꾼다
   (`Builder.tsx:102,382`, `CourseView.tsx:123,205,635`, `MemoryLog.tsx:72,98`, `toss-client.ts:24`).
2. **Bearer 세션** `src/lib/auth.ts`의 `getSession()`이 쿠키 다음으로 `Authorization: Bearer`를
   읽게 한다. 미니앱은 교차 도메인이라 쿠키를 쓰지 않고 JWT를 응답 본문으로 받아
   localStorage에 보관한다. `toss/login` 라우트는 `{ ok, token }`을 함께 돌려준다.
3. **익명 식별키 교환** `POST /api/auth/toss/anon` (신규): 클라이언트가 보낸 일회용 `code`를
   mTLS로 `POST /api-partner/v1/apps-in-toss/users/anon-key/exchange` (`{ code }` →
   `success.anonKey`)에 교환하고 `id: toss-anon:<anonKey>` 세션 JWT를 돌려준다.
   `src/lib/toss.ts`의 `tossApi()`를 재사용. 응답 봉투는 `resultType === "SUCCESS"`로만
   판정하고 `errorCode`는 숫자·문자열 모두 비교한다. 클라이언트가 보낸 `getAnonymousKey()`
   해시를 서버가 신뢰하는 코드는 두지 않는다.
4. **JSON 라우트 추가** (서버 컴포넌트가 하던 일을 API로):
   - `GET /api/me` → `{ user | null }`
   - `GET /api/courses/[slug]?owner=` → `{ course, memories, isOwner, viewerName }`
     (`addParticipant` 부수효과 포함, `src/app/c/[slug]/page.tsx` 로직 이식)
   - `GET /api/my-courses` → `getCoursesByUser` 결과
   - 결과 조회는 기존 `GET /api/courses/[slug]/responses?token=` 사용
5. **CORS** `src/proxy.ts` (Next 16은 `middleware.ts`가 아니라 `proxy.ts`,
   `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md` 확인 후 작성).
   `/api/*`에 대해 허용 origin **정확히 두 개**: `https://date-course.apps.tossmini.com`,
   `https://date-course.private-apps.tossmini.com` (SDK 3.1.0+ 표 기준). OPTIONS → 204,
   `Allow-Headers: Content-Type, Authorization`. `*`는 쓰지 않는다. 개발용 localhost
   origin은 `NODE_ENV !== "production"`일 때만.
6. **공용 뷰 추출**: `src/app/c/[slug]/results/page.tsx`의 JSX → `components/ResultsView.tsx`,
   `src/app/history/page.tsx`의 JSX → `components/HistoryView.tsx`. Next 페이지는 데이터만
   받아 이 뷰를 그린다.
7. **확대·축소 제한**: `src/app/layout.tsx` viewport에 `maximumScale: 1, userScalable: false`.
8. **SDK 의존 분리**: 루트 `src/lib/ait-sdk.js`는 "토스 환경 아님"으로 reject하는 스텁으로
   바꾸고 루트 `package.json`에서 `@apps-in-toss/web-framework`를 뺀다. 실제 SDK는 미니앱만 가진다.
9. Railway에 배포(Phase 2 빌드가 이 origin을 번들에 넣으므로 서버가 먼저).

### Phase 2 — `miniapp/` SPA (SDK 3.x)

1. 디렉터리 `miniapp/` — 자체 `package.json`(react·react-dom은 루트와 같은 19.2.x,
   `react-router`, `vite`, `@vitejs/plugin-react`, `@tailwindcss/vite`, `leaflet`,
   `@apps-in-toss/web-framework ^3.9`, dev `@apps-in-toss/devtools`). 하네스 템플릿
   `shared/templates/react-vite/vite.config.ts`의 `optimizeDeps.exclude`를 그대로 가져온다.
2. `miniapp/apps-in-toss.config.ts` (2.x `granite.config.ts` 대체):
   `appName: "date-course"`, `brand: { primaryColor: "#6E1423" }`, `webBundleDir: "dist"`,
   `webView: { pullToRefreshEnabled: false }`. scripts: `build: vite build && ait build`,
   `deploy: ait deploy`. 설치된 `.d.ts`에 있는 키만 쓴다.
3. `vite.config.ts` alias (구체적인 것 먼저):
   - `@/lib/ait-sdk` → `miniapp/src/sdk.ts` (SDK 3.x 재수출: `appLogin`·`share` 또는
     3.x 도메인 객체 — 설치 후 `.d.ts`로 확인)
   - `next/link` → `miniapp/src/shims/link.tsx` (react-router `Link`, `href`→`to`)
   - `next/navigation` → `shims/navigation.ts` (`useRouter().push/replace`, `usePathname`,
     `useSearchParams`, `notFound`)
   - `next/dynamic` → `shims/dynamic.tsx` (`React.lazy` + `Suspense`, `loading` 옵션 지원)
   - `@` → `../src`
   - `define`: `process.env.NEXT_PUBLIC_API_BASE`, `process.env.NODE_ENV`
4. `index.html`: viewport `maximum-scale=1, user-scalable=no`, Pretendard·Gowun Batang·
   leaflet CSS 링크(루트 `layout.tsx`와 동일), `#root`. `src/app/globals.css`를 import.
5. **라우팅**: `HashRouter`. 호스팅의 SPA 폴백 여부가 문서에 없어 경로 기반 라우팅은 쓰지 않는다.
   진입 시 `location.search`의 `slug`·`owner`·`key`를 읽어 `#/c/:slug…`로 이동(딥링크 수신).
   라우트: `/`(LandingPage) `/new`(Builder) `/c/:slug`(ShareBar+CourseView)
   `/c/:slug/results`(ResultsView) `/c/:slug/share`(SharePanel) `/history`(HistoryView)
   `/terms` `/privacy`(LegalDoc). 각 라우트 컴포넌트는 `GET /api/...`로 데이터를 받아 뷰에 넘긴다.
6. **식별**: 앱 시작 시 저장된 토큰이 없으면 `User.createAnonymousKeyAuthCode()` →
   `POST /api/auth/toss/anon` → 토큰 저장. 실패(인증서 미발급 등) 시 익명으로 계속 동작하고
   "내 코스"는 기존 localStorage(`my-courses.ts`)로 폴백. 토스 로그인(`appLogin`)은 이름이
   필요한 "선택 보내기"에서만 선택적으로 노출(기존 `TossLoginButton` 그대로).
7. **공유**: `ShareBar`·`SharePanel`의 shareUrl은 토스 환경에서
   `intoss://date-course?slug=<slug>`(출시 후 유효; QR 테스트 중엔 `intoss-private://…`)로,
   SDK `share`로 보낸다. `intoss-private://`를 공유에 쓰지 않는다(체크리스트).
8. **토스 환경 분기 정리**: `AdBanner`(카카오 애드핏)는 토스 환경에서 렌더하지 않는다
   (인앱 광고는 토스 애즈 기준이라 제3자 광고 SDK는 반려 위험 — 확인 필요 항목).
   카카오 로그인 숨김은 이미 `useTossEnv()`로 처리돼 있다.
9. `npm run build` → `miniapp/dist/index.html` + `.ait`. `.gitignore`에 `miniapp/dist`, `*.ait`.

### Phase 3 — 실기기 검증과 검수

1. `npx ait token add` 후 `ait deploy`, 또는 콘솔 웹에 `.ait` 업로드 → QR로 토스 앱에서 열기
   (하네스 `/ait:test-on-device` 절차).
2. 확인 흐름: 코스 만들기 → 공유 시트 → 상대 기기에서 선택 보내기 → 결과 보기 →
   미니앱 종료 후 재진입 시 "내 코스" 유지 → 안드로이드 백버튼 → 지도 핀치 줌 동작.
3. 하네스 `launch-scan.sh` 재실행(viewport 0건 확인) + 체크리스트 재대조(`/ait:launch`).
4. 검수 요청은 사용자가 승인한 뒤 콘솔에서. **3.x 번들을 출시하면 2.x로 롤백 불가**.

### Phase 4 — 정리

`appintoss/`, 루트 `granite.config.ts`, 루트 scripts `build:appintoss`·`deploy:appintoss` 삭제.
`appintoss/README.md`·`submission/inputs.md`의 "정적 셸 → 이동" 서술을 새 구조로 갱신.

## 4. 바뀌는 파일

| 영역 | 파일 |
|---|---|
| 수정 | `src/lib/auth.ts`, `src/lib/toss.ts`, `src/lib/toss-client.ts`, `src/lib/ait-sdk.js`, `src/app/layout.tsx`, `src/components/{Builder,CourseView,MemoryLog,ShareBar,SharePanel,AdBanner}.tsx`, `src/app/c/[slug]/results/page.tsx`, `src/app/history/page.tsx`, `src/app/api/auth/toss/login/route.ts`, `package.json`, `.gitignore` |
| 신규 | `src/lib/api.ts`, `src/proxy.ts`, `src/components/{ResultsView,HistoryView}.tsx`, `src/app/api/me/route.ts`, `src/app/api/my-courses/route.ts`, `src/app/api/courses/[slug]/route.ts`, `src/app/api/auth/toss/anon/route.ts`, `miniapp/**` |
| 삭제 | `appintoss/`, `granite.config.ts` |

## 5. 검증

- 루트: `npm run build`, `npm run lint` 통과. 웹에서 기존 흐름(생성·공유·응답·결과·히스토리) 동일.
- `curl -I -X OPTIONS -H "Origin: https://date-course.apps.tossmini.com" <railway>/api/me` →
  204 + 정확한 `Access-Control-Allow-Origin`. 다른 origin은 헤더 없음.
- `miniapp`: `npm run build` → `dist/index.html`, `.ait` 생성. 산출물에서
  `location.replace`·`railway.app` 페이지 이동 코드 0건(API base만 존재).
- `launch-scan.sh . ` → `viewport-zoom=0 dark-theme=0 cors-any-origin=0 client-ai-key=0`.
- 실기기 QR 테스트(Phase 3의 흐름).

## 6. 확인 필요 / 사용자가 할 일

- **mTLS 인증서**: 익명 식별키 교환과 토스 로그인 모두 콘솔에서 발급한 인증서가 필요하다.
  사용자가 콘솔 웹에서 발급해 Railway `TOSS_MTLS_CERT_BASE64`·`TOSS_MTLS_KEY_BASE64`에 넣는다.
  없으면 미니앱은 localStorage 폴백으로 동작하지만 "사용자 식별키" 항목은 미충족이다.
- **SPA 폴백**: `<appName>.apps.tossmini.com`이 하위 경로를 `index.html`로 돌려주는지 문서에
  없다. 그래서 해시 라우팅 + 루트 쿼리 딥링크로 간다. 실기기에서 경로 진입이 되면 단순화 가능.
- **핀치 줌과 지도**: viewport로 줌을 막으면 Leaflet 터치 줌에 영향이 있을 수 있다.
  체크리스트가 지도를 예외로 두므로 실기기에서 확인한다.
- **카카오 애드핏**: 토스 환경에서 숨기는 것으로 계획. 유지하려면 운영 정책 확인이 필요하다.
- **intoss 스킴 형식**: 문서 예시는 `intoss://<appName>/path?query`이고 공식 문법은 없다.
  출시 전 QR 테스트 환경에선 `intoss-private://appsintoss?_deploymentId=…`만 동작한다.
- **콘솔**: 토스 로그인을 쓰려면 콘솔에 로그인 등록·약관 URL 설정이 선행돼야 한다
  (미등록이면 `generate-token`이 errorCode 4050으로 실패).
