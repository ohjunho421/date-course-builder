"use client";

import { useSyncExternalStore } from "react";

// 앱인토스 WebView(react-native-webview)에서만 주입되는 브릿지로 환경을 감지한다.
export function isTossEnv(): boolean {
  return (
    typeof window !== "undefined" &&
    !!(window as { ReactNativeWebView?: unknown }).ReactNativeWebView
  );
}

const emptySubscribe = () => () => {};

/** SSR/hydration 안전한 앱인토스 환경 감지 훅 — 서버 렌더에서는 항상 false */
export function useTossEnv(): boolean {
  return useSyncExternalStore(emptySubscribe, isTossEnv, () => false);
}

/** 토스 로그인: appLogin으로 인가 코드를 받아 서버 세션을 만든다 */
export async function tossLogin(next: string): Promise<void> {
  const { appLogin } = await import("./ait-sdk");
  const { authorizationCode, referrer } = await appLogin();
  const res = await fetch("/api/auth/toss/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ authorizationCode, referrer }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || "토스 로그인에 실패했어요.");
  }
  window.location.assign(next.startsWith("/") ? next : "/");
}

/** 토스 네이티브 공유 시트로 메시지를 공유한다 */
export async function tossShare(message: string): Promise<void> {
  const { share } = await import("./ait-sdk");
  await share({ message });
}
