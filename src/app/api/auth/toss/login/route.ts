import { NextRequest, NextResponse } from "next/server";
import { signSession, SESSION_COOKIE, type SessionUser } from "@/lib/auth";
import { loginWithAuthorizationCode, tossConfigured } from "@/lib/toss";

export const runtime = "nodejs";

// 앱인토스 토스 로그인 — 클라이언트가 appLogin()으로 받은 인가 코드를 전달하면
// 파트너 API로 교환해 세션 쿠키를 발급한다.
export async function POST(req: NextRequest) {
  if (!tossConfigured()) {
    return NextResponse.json({ error: "토스 로그인이 아직 설정되지 않았어요." }, { status: 503 });
  }

  let authorizationCode = "";
  let referrer = "DEFAULT";
  try {
    const body = await req.json();
    authorizationCode = typeof body?.authorizationCode === "string" ? body.authorizationCode : "";
    referrer = body?.referrer === "SANDBOX" ? "SANDBOX" : "DEFAULT";
  } catch {}
  if (!authorizationCode) {
    return NextResponse.json({ error: "인가 코드가 없어요." }, { status: 400 });
  }

  try {
    const { userKey, name } = await loginWithAuthorizationCode(authorizationCode, referrer);
    const user: SessionUser = { id: `toss:${userKey}`, name };
    const jwt = await signSession(user);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin;
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, jwt, {
      httpOnly: true,
      secure: baseUrl.startsWith("https"),
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
    return res;
  } catch (e) {
    console.error("[toss] login failed", e);
    return NextResponse.json({ error: "토스 로그인에 실패했어요. 다시 시도해 주세요." }, { status: 502 });
  }
}
