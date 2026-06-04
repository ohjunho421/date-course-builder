import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const key = process.env.KAKAO_REST_KEY;
  if (!key) {
    return NextResponse.redirect(`${req.nextUrl.origin}/?login=unconfigured`);
  }
  // 배포 환경에서는 고정된 도메인 사용, 로컬에서는 현재 origin 사용
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin;
  const redirectUri = `${baseUrl}/api/auth/kakao/callback`;
  const next = req.nextUrl.searchParams.get("next") || "/history"; // 로그인 후 이동할 페이지

  const authUrl = new URL("https://kauth.kakao.com/oauth/authorize");
  authUrl.searchParams.set("client_id", key);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");

  const res = NextResponse.redirect(authUrl.toString());
  res.cookies.set("dgg_oauth_next", next.startsWith("/") ? next : "/history", {
    httpOnly: true,
    maxAge: 600,
    path: "/",
    sameSite: "lax",
    secure: baseUrl.startsWith("https"),
  });
  return res;
}
