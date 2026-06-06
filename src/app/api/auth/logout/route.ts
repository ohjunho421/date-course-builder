import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";

function clearAndHome(req: NextRequest) {
  // 프록시 뒤에서 origin이 내부 호스트(localhost:8080)로 잡히는 문제 방지 — 고정 도메인 사용
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin;
  const res = NextResponse.redirect(`${baseUrl}/`);
  res.cookies.set(SESSION_COOKIE, "", { maxAge: 0, path: "/" });
  return res;
}

export async function GET(req: NextRequest) {
  return clearAndHome(req);
}

export async function POST(req: NextRequest) {
  return clearAndHome(req);
}
