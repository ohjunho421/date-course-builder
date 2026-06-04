import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const key = process.env.KAKAO_REST_KEY;
  if (!key) {
    return NextResponse.redirect(`${req.nextUrl.origin}/?login=unconfigured`);
  }
  const origin = req.nextUrl.origin;
  const redirectUri = `${origin}/api/auth/kakao/callback`;
  const next = req.nextUrl.searchParams.get("next") || "/history";

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
  });
  return res;
}
