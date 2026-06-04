import { NextRequest, NextResponse } from "next/server";
import { addPlaceToStop, getCourse } from "@/lib/store";
import { resolveNaverPlace } from "@/lib/naver";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { slug } = await params;
    const body = (await req.json()) as { stopId?: string; url?: string };
    const stopId = (body.stopId || "").trim();
    const url = (body.url || "").trim();
    if (!stopId || !url) {
      return NextResponse.json({ error: "단계와 링크가 필요해요." }, { status: 400 });
    }
    if (!/naver\.me|naver\.com/.test(url)) {
      return NextResponse.json({ error: "네이버 지도 공유 링크(naver.me)를 넣어주세요." }, { status: 400 });
    }

    const course = await getCourse(slug);
    if (!course) {
      return NextResponse.json({ error: "코스를 찾을 수 없어요." }, { status: 404 });
    }
    if (!course.stops.some((s) => s.id === stopId)) {
      return NextResponse.json({ error: "해당 단계를 찾을 수 없어요." }, { status: 400 });
    }

    const place = await resolveNaverPlace(url);
    const result = await addPlaceToStop(slug, stopId, place);
    if (!result.added) {
      return NextResponse.json({ error: "이미 이 단계에 추가된 곳이에요." }, { status: 409 });
    }
    return NextResponse.json({ place });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "장소를 추가하지 못했어요.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
