# 앱인토스(Apps in Toss) 배포

이 디렉토리는 앱인토스 미니앱 번들(`.ait`)을 구성하는 정적 셸입니다.

## 구조

앱인토스 웹 번들은 CSR/SSG 정적 출력만 지원합니다. 이 서비스는 Next.js SSR +
API 라우트 + PostgreSQL 구조라 앱 전체를 정적으로 내보낼 수 없으므로, 번들에는
가벼운 정적 셸(`web/index.html`)만 담고, 셸이 호스팅된 서비스로 이동합니다.

```
granite.config.ts      # 앱인토스 앱 설정 (appName, 브랜드, 빌드 명령)
appintoss/build.mjs    # ait build가 호출하는 정적 셸 빌드 스크립트
appintoss/web/         # .ait에 담기는 정적 셸 (스플래시 → 서비스 이동)
dist-appintoss/        # 빌드 출력 (gitignore)
date-course.ait        # 업로드용 번들 (gitignore)
```

셸 동작: 브랜드 스플래시를 그린 뒤 `location.replace`로 서비스 URL로 이동.
오프라인이면 "다시 시도하기" 버튼을 보여주고, 연결이 오래 걸리면 재시도를
안내합니다. 서비스 URL 변경 시 `appintoss/web/index.html`의 `TARGET` 상수를
수정하세요.

앱인토스 런타임 WebView는 http/https 네비게이션을 허용하고 쿠키가 활성화되어
있어(sharedCookies/thirdPartyCookies) 서비스 로그인 세션이 유지됩니다.

## 빌드

```bash
npm run build:appintoss   # 프로젝트 루트에 date-course.ait 생성
```

## 토스 로그인

앱인토스 WebView에서는 정책상 토스 로그인만 노출됩니다 (일반 웹은 카카오
유지). 흐름:

1. 클라이언트: `appLogin()` 브릿지로 인가 코드 획득
   (`src/lib/toss-client.ts`, `src/components/TossLoginButton.tsx`)
2. 서버: `POST /api/auth/toss/login` → 파트너 API로 토큰 교환·사용자 조회 →
   세션 쿠키 발급 (`src/lib/toss.ts`)

활성화에 필요한 서버 환경 변수 (콘솔에서 mTLS 인증서 발급 후):

```
TOSS_MTLS_CERT_BASE64=$(base64 -w0 cert.pem)
TOSS_MTLS_KEY_BASE64=$(base64 -w0 key.pem)
```

미설정 시 토스 로그인 버튼은 "토스 로그인이 아직 설정되지 않았어요" 안내를
보여줍니다. 파트너 API 경로는 공식 문서와 다르면 `src/lib/toss.ts` 상단
상수를 수정하세요 (개발 샌드박스에서 문서 사이트 접근이 차단되어 엔드포인트
경로는 실 인증서로 최종 확인이 필요합니다).

## 배포 (콘솔 등록 후)

1. <https://apps-in-toss.toss.im/> 에서 앱 만들기 — 입력값은
   `submission/inputs.md` 참고. appName은 반드시 `date-course`.
2. 콘솔에서 토스 로그인 설정 + mTLS 인증서 발급 → Railway 환경 변수에 등록.
3. 콘솔에서 API 키 발급 후 토큰 등록:

   ```bash
   npx ait token add --api-key <발급받은 키>
   ```

4. 번들 업로드(배포):

   ```bash
   npm run deploy:appintoss -- -m "첫 출시"
   ```

5. 콘솔 "앱 출시"에서 QR 코드로 토스 앱 실내 테스트 → 검토 요청.

`ait token add` 없이 콘솔의 앱 출시 화면에서 `date-course.ait` 파일을 직접
업로드할 수도 있습니다.

## 정책 대응 현황

- 토스 로그인: 구현 완료 — 앱인토스에서는 토스 로그인만 노출.
- 공유: 앱인토스에서는 카카오톡 공유 대신 토스 공유 시트(`share` 브릿지) 사용.
- 외부 링크: 네이버 장소/길찾기 링크는 전부 웹 URL이라 WebView 안에서 열림
  (앱 설치 유도 없음).
- 상세: `submission/inputs.md`의 "출시 전 확인 필요" 섹션 참고.
