import { NextRequest, NextResponse } from "next/server";

// 앱인토스 미니앱(별도 origin)이 /api/* 를 호출할 수 있게 CORS를 허용한다.
// 허용 origin은 개발자센터 server-api 문서의 SDK 3.1.0+ 표 기준 두 도메인만.
// '*' 는 쓰지 않는다 (출시 체크리스트 cors-any-origin).
const APP_NAME = "date-course";
const ALLOWED_ORIGINS = new Set([
  `https://${APP_NAME}.apps.tossmini.com`, // 출시 환경
  `https://${APP_NAME}.private-apps.tossmini.com`, // 콘솔 QR 테스트 환경
]);
const DEV_ORIGINS = new Set(["http://localhost:5173", "http://127.0.0.1:5173"]);

function allowed(origin: string | null): origin is string {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.has(origin)) return true;
  return process.env.NODE_ENV !== "production" && DEV_ORIGINS.has(origin);
}

function corsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, Range",
    "Access-Control-Expose-Headers": "Content-Range, Accept-Ranges",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export function proxy(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!allowed(origin)) return NextResponse.next();

  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
  }
  const res = NextResponse.next();
  for (const [k, v] of Object.entries(corsHeaders(origin))) res.headers.set(k, v);
  return res;
}

export const config = {
  matcher: "/api/:path*",
};
