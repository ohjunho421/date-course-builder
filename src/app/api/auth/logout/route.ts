import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";

function clearAndHome(req: NextRequest) {
  const res = NextResponse.redirect(`${req.nextUrl.origin}/`);
  res.cookies.set(SESSION_COOKIE, "", { maxAge: 0, path: "/" });
  return res;
}

export async function GET(req: NextRequest) {
  return clearAndHome(req);
}

export async function POST(req: NextRequest) {
  return clearAndHome(req);
}
