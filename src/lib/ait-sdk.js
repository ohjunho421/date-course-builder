// 앱인토스 SDK 접근점. 타입은 ait-sdk.d.ts가 제공한다.
// 웹(Next) 빌드에서는 SDK를 포함하지 않는 스텁이다 — 토스 환경 감지(isTossEnv)가 true일 때만
// 호출되므로 일반 웹에서는 실행되지 않는다.
// 앱인토스 미니앱(miniapp/)은 Vite alias로 이 모듈을 실제 @apps-in-toss/web-framework 재수출로 바꿔 끼운다.
function notInToss() {
  return Promise.reject(new Error("앱인토스 환경에서만 사용할 수 있어요."));
}

export function appLogin() {
  return notInToss();
}

export function share() {
  return notInToss();
}
