import { NextRequest, NextResponse } from "next/server";
import { resolveNaverPlace } from "@/lib/naver";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "링크를 입력해 주세요." }, { status: 400 });
    }
    if (!/naver\.me|naver\.com/.test(url)) {
      return NextResponse.json(
        { error: "네이버 지도 공유 링크(naver.me)를 넣어주세요." },
        { status: 400 }
      );
    }
    const place = await resolveNaverPlace(url);
    return NextResponse.json({ place });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "장소를 불러오지 못했어요.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
