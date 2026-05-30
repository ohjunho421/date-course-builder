import { NextRequest, NextResponse } from "next/server";
import { createCourse } from "@/lib/store";
import type { CourseData, Stop } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<CourseData>;
    const title = (body.title || "").trim();
    const stops = Array.isArray(body.stops) ? body.stops : [];
    const modes =
      Array.isArray(body.modes) && body.modes.length ? body.modes : ["walk"];

    if (!title) {
      return NextResponse.json({ error: "코스 제목을 입력해 주세요." }, { status: 400 });
    }
    const validStops = stops.filter(
      (s: Stop) => s && s.label && Array.isArray(s.places) && s.places.length > 0
    );
    if (validStops.length === 0) {
      return NextResponse.json(
        { error: "최소 한 단계에 장소를 한 곳 이상 추가해 주세요." },
        { status: 400 }
      );
    }

    const course = await createCourse({
      title,
      intro: (body.intro || "").trim(),
      modes: modes.filter((m) => ["walk", "car", "transit"].includes(m)),
      stops: validStops,
    });
    return NextResponse.json({ slug: course.slug, ownerToken: course.ownerToken });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "코스를 저장하지 못했어요.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
