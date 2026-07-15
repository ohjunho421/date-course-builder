import https from "node:https";

// 앱인토스(Apps in Toss) 파트너 API 클라이언트 — 토스 로그인 토큰 교환용.
// 파트너 API는 콘솔에서 발급한 mTLS 클라이언트 인증서가 필요하다.
// https://developers-apps-in-toss.toss.im/login/develop.md 기준.
// 엔드포인트 경로가 문서와 다르면 아래 상수만 수정하면 된다.
const TOSS_API_BASE_URL = process.env.TOSS_API_BASE_URL || "https://apps-in-toss-api.toss.im";
const GENERATE_TOKEN_PATH = "/api-partner/v1/apps-in-toss/user/oauth2/generate-token";
const LOGIN_ME_PATH = "/api-partner/v1/apps-in-toss/user/oauth2/login-me";

/** PEM을 env에서 읽는다. *_BASE64(한 줄) 우선, 없으면 원문 PEM. */
function readPem(name: string): string | null {
  const b64 = process.env[`${name}_BASE64`];
  if (b64) {
    try {
      return Buffer.from(b64, "base64").toString("utf8");
    } catch {
      return null;
    }
  }
  const raw = process.env[name];
  // Railway 등에서 개행이 \n 문자로 들어오는 경우 복원
  return raw ? raw.replace(/\\n/g, "\n") : null;
}

/** 토스 로그인은 mTLS 인증서와 세션 서명 키가 모두 있어야 활성화된다 */
export function tossConfigured(): boolean {
  return !!readPem("TOSS_MTLS_CERT") && !!readPem("TOSS_MTLS_KEY") && !!process.env.AUTH_SECRET;
}

type TossEnvelope<T> = {
  resultType?: string;
  success?: T;
  error?: { errorCode?: string; reason?: string };
};

function tossApi<T>(
  path: string,
  { method, bearer, body }: { method: "GET" | "POST"; bearer?: string; body?: unknown }
): Promise<T> {
  const cert = readPem("TOSS_MTLS_CERT");
  const key = readPem("TOSS_MTLS_KEY");
  if (!cert || !key) {
    return Promise.reject(new Error("TOSS_MTLS_CERT / TOSS_MTLS_KEY가 설정되지 않았어요"));
  }
  const url = new URL(path, TOSS_API_BASE_URL);
  const payload = body != null ? JSON.stringify(body) : undefined;

  return new Promise<T>((resolve, reject) => {
    const req = https.request(
      {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method,
        cert,
        key,
        headers: {
          "Content-Type": "application/json",
          ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
          ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
        },
        timeout: 10000,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          let data: TossEnvelope<T>;
          try {
            data = JSON.parse(text);
          } catch {
            reject(new Error(`토스 API 응답 파싱 실패 (HTTP ${res.statusCode}): ${text.slice(0, 300)}`));
            return;
          }
          if (res.statusCode !== 200 || data.resultType !== "SUCCESS" || data.success == null) {
            const code = data.error?.errorCode ?? String(res.statusCode);
            const reason = data.error?.reason ?? "unknown";
            reject(new Error(`토스 API 오류 ${code}: ${reason}`));
            return;
          }
          resolve(data.success);
        });
      }
    );
    req.on("timeout", () => req.destroy(new Error("토스 API 요청 시간 초과")));
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

type TossTokens = {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
};

type TossMe = {
  userKey: string | number;
  name?: string;
  nickname?: string;
};

/** 인가 코드를 토큰으로 교환하고 사용자 식별키를 조회한다 */
export async function loginWithAuthorizationCode(
  authorizationCode: string,
  referrer: string
): Promise<{ userKey: string; name: string }> {
  const tokens = await tossApi<TossTokens>(GENERATE_TOKEN_PATH, {
    method: "POST",
    body: { authorizationCode, referrer },
  });
  const me = await tossApi<TossMe>(LOGIN_ME_PATH, {
    method: "GET",
    bearer: tokens.accessToken,
  });
  if (me.userKey == null) {
    throw new Error("토스 API 응답에 userKey가 없어요");
  }
  return {
    userKey: String(me.userKey),
    name: me.name || me.nickname || "토스 사용자",
  };
}
