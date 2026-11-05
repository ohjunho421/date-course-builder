// 클라이언트 → API 호출 헬퍼.
// 웹(Next)에서는 같은 origin이라 API_BASE가 비어 있고, 앱인토스 미니앱(별도 origin)에서는
// 빌드 시 NEXT_PUBLIC_API_BASE에 Railway origin이 들어간다.
// 미니앱은 교차 도메인이어서 쿠키 대신 Bearer 토큰으로 세션을 전달한다.
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";
const TOKEN_KEY = "dgg_token";

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* 저장 불가 환경 — 무시 */
  }
}

/** fetch 래퍼 — API base를 붙이고, 토큰이 있으면 Authorization 헤더를 더한다 */
export function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);
  return fetch(apiUrl(path), { ...init, headers });
}
