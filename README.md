# 코스픽 (CoursePick)

네이버 지도 공유 링크만 넣으면, **사진·리뷰·지도 동선**까지 담긴 데이트 코스 페이지가 완성되는 서비스. 상대에게 **링크 하나**로 공유하세요.

## 특징

- **코스 구조 자유 설정** — 카페→저녁→한잔, 저녁→한잔, 카페→저녁 등 단계를 자유롭게 추가/삭제/정렬
- **네이버 링크 → 자동 카드** — `naver.me` 공유 링크를 넣으면 가게명·카테고리·사진·방문자/블로그 리뷰 수·리뷰 키워드·메뉴·영업시간·좌표를 자동 추출
- **단계별 다중 선택지** — 한 단계에 여러 후보를 넣으면, 상대가 직접 고를 수 있는 페이지가 생성됨
- **지도 동선 + 이동수단 토글** — 도보/차량/대중교통을 전환하면 경로와 예상 시간이 바뀜. 구간마다 네이버 길찾기 딥링크 제공
- **로그인 없이** 누구나 코스 생성 → 공유 링크 발급

## 기술 스택

- Next.js 16 (App Router) · React 19 · TypeScript
- PostgreSQL + Prisma (로컬은 `DATABASE_URL` 미설정 시 `.data/` 파일 저장으로 폴백)
- Leaflet + OpenStreetMap (지도)
- OpenRouteService (도보/차량 실경로, 선택) — 키 없으면 직선거리 추정

## 로컬 실행

```bash
npm install
npm run dev
# http://localhost:3000
```

`DATABASE_URL` 없이도 동작합니다(코스는 `.data/courses.json`에 저장). Postgres를 쓰려면 `.env`에 `DATABASE_URL`을 넣고 `npx prisma db push`.

## 환경 변수

| 변수 | 필수 | 설명 |
|------|------|------|
| `DATABASE_URL` | 배포 시 | PostgreSQL 연결 문자열 (Railway가 자동 주입) |
| `ORS_API_KEY` | 선택 | OpenRouteService 키. 있으면 도보/차량 실제 도로 경로, 없으면 직선거리 추정 |
| `TOSS_MTLS_CERT_BASE64` / `TOSS_MTLS_KEY_BASE64` | 앱인토스 | 토스 로그인용 mTLS 인증서 (앱인토스 콘솔에서 발급, base64 한 줄) |

## 배포 (Railway)

1. PostgreSQL 플러그인 추가 → `DATABASE_URL` 연결
2. 배포 시 `postinstall`에서 `prisma generate`, `start`에서 `prisma db push` 자동 실행
3. (선택) `ORS_API_KEY` 추가

## 앱인토스 (Apps in Toss)

`npm run build:appintoss`로 미니앱 번들(`date-course.ait`)을 만들 수 있습니다.
앱인토스 WebView에서는 정책에 따라 카카오 대신 **토스 로그인**과 **토스 공유
시트**가 노출됩니다. 콘솔 등록 입력값은 `submission/inputs.md`, 배포 절차와
정책 대응 현황은 `appintoss/README.md`를 참고하세요.
