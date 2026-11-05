import { NextRequest, NextResponse } from "next/server";
import { signSession, type SessionUser } from "@/lib/auth";
import { exchangeAnonymousKey, tossConfigured } from "@/lib/toss";

export const runtime = "nodejs";

// 앱인토스 익명 식별키 세션 — 미니앱이 User.createAnonymousKeyAuthCode()로 받은
// 일회용 코드를 전달하면 파트너 API로 교환해 식별키 기반 세션 토큰을 발급한다.
// 로그인 없이도 사용자별 "내 코스"가 서버에 유지되게 하는 용도(체크리스트 "사용자 식별키 발급").
export async function POST(req: NextRequest) {
  if (!tossConfigured()) {
    return NextResponse.json({ error: "토스 식별키 교환이 아직 설정되지 않았어요." }, { status: 503 });
  }

  let code = "";
  try {
    const body = await req.json();
    code = typeof body?.code === "string" ? body.code.trim() : "";
  } catch {}
  if (!code) {
    return NextResponse.json({ error: "인증 코드가 없어요." }, { status: 400 });
  }

  try {
    const anonKey = await exchangeAnonymousKey(code);
    const user: SessionUser = { id: `toss-anon:${anonKey}`, name: "토스 사용자" };
    const token = await signSession(user);
    return NextResponse.json({ ok: true, token });
  } catch (e) {
    console.error("[toss] anon key exchange failed", e);
    return NextResponse.json({ error: "식별키를 확인하지 못했어요." }, { status: 502 });
  }
}
