import { NextRequest, NextResponse } from "next/server";
import { signSession, SESSION_COOKIE, type SessionUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const code = req.nextUrl.searchParams.get("code");
  const key = process.env.KAKAO_REST_KEY;
  if (!code || !key) {
    return NextResponse.redirect(`${origin}/?login=fail`);
  }

  const redirectUri = `${origin}/api/auth/kakao/callback`;
  const clientSecret = process.env.KAKAO_CLIENT_SECRET || "";

  try {
    const tokenRes = await fetch("https://kauth.kakao.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      cache: "no-store",
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: key,
        redirect_uri: redirectUri,
        code,
        ...(clientSecret ? { client_secret: clientSecret } : {}),
      }),
    });
    const token = await tokenRes.json();
    if (!tokenRes.ok || !token.access_token) {
      return NextResponse.redirect(`${origin}/?login=fail`);
    }

    const meRes = await fetch("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${token.access_token}` },
      cache: "no-store",
    });
    const me = await meRes.json();
    const profile = me?.kakao_account?.profile ?? {};
    const user: SessionUser = {
      id: `kakao:${me.id}`,
      name: profile.nickname || me?.properties?.nickname || "카카오 사용자",
      image: profile.profile_image_url || me?.properties?.profile_image || undefined,
    };

    const jwt = await signSession(user);
    const next = req.cookies.get("dgg_oauth_next")?.value;
    const dest = next && next.startsWith("/") ? next : "/history";

    const res = NextResponse.redirect(`${origin}${dest}`);
    res.cookies.set(SESSION_COOKIE, jwt, {
      httpOnly: true,
      secure: origin.startsWith("https"),
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
    res.cookies.set("dgg_oauth_next", "", { maxAge: 0, path: "/" });
    return res;
  } catch {
    return NextResponse.redirect(`${origin}/?login=fail`);
  }
}
