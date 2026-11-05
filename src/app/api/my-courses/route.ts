import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getCoursesByUser } from "@/lib/store";

export const runtime = "nodejs";

/** 내가 만든 코스 + 받은 코스 — /history 페이지의 데이터를 미니앱용 JSON으로 제공 */
export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }
  try {
    const courses = await getCoursesByUser(user.id);
    return NextResponse.json({ courses });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "코스를 불러오지 못했어요.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
