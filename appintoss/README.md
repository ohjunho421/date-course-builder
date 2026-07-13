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

## 배포 (콘솔 등록 후)

1. <https://apps-in-toss.toss.im/> 에서 앱 만들기 — 입력값은
   `submission/inputs.md` 참고. appName은 반드시 `date-course`.
2. 콘솔에서 API 키 발급 후 토큰 등록:

   ```bash
   npx ait token add --api-key <발급받은 키>
   ```

3. 번들 업로드(배포):

   ```bash
   npm run deploy:appintoss -- -m "첫 출시"
   ```

4. 콘솔 "앱 출시"에서 QR 코드로 토스 앱 실내 테스트 → 검토 요청.

`ait token add` 없이 콘솔의 앱 출시 화면에서 `date-course.ait` 파일을 직접
업로드할 수도 있습니다.

## 출시 검토 전 확인할 정책 리스크

- 앱인토스는 로그인 수단으로 **토스 로그인만** 허용합니다. 현재 서비스의
  카카오 로그인은 심사 반려 사유가 될 수 있어, 토스 로그인 전환 또는 로그인
  없는 흐름 조정이 필요합니다.
- 장소 카드의 네이버 링크·길찾기 딥링크는 외부 링크 제한 정책 검토 대상입니다.
- 상세 정책: `submission/inputs.md`의 "출시 전 확인 필요" 섹션 참고.
