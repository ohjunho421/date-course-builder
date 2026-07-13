// 앱인토스 SDK 런타임 재수출 전용 모듈. 타입은 ait-sdk.d.ts가 제공한다.
// SDK의 타입 체인(@apps-in-toss/native-modules → react-native)이 전역 DOM 타입
// (FormData 등)을 오염시키므로, 타입 추적을 여기서 끊는다.
export { appLogin, share } from "@apps-in-toss/web-framework";
