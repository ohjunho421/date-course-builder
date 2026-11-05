import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

/** 현재 세션 사용자 — 미니앱(CSR)이 서버 컴포넌트 대신 호출한다 */
export async function GET() {
  const user = await getSession();
  return NextResponse.json({
    user: user ? { id: user.id, name: user.name } : null,
    loginRequired: !!process.env.AUTH_SECRET,
  });
}
