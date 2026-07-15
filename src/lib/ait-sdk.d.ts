// ait-sdk.js의 타입 선언 — @apps-in-toss/web-bridge의 공개 시그니처만 옮겨 적음.
// SDK 타입을 직접 import하면 react-native 전역 타입이 유입되므로 여기서 선언한다.

/** 토스 인증으로 로그인해 인가 코드를 받는다 */
export declare function appLogin(): Promise<{
  authorizationCode: string;
  referrer: "DEFAULT" | "SANDBOX";
}>;

/** 토스 네이티브 공유 시트를 연다 */
export declare function share(message: { message: string }): Promise<void>;
