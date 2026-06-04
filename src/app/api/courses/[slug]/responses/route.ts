import { NextRequest, NextResponse } from "next/server";
import { createResponse, getResponses, getCourse } from "@/lib/store";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { slug } = await params;
    const course = await getCourse(slug);
    if (!course) {
      return NextResponse.json({ error: "코스를 찾을 수 없어요." }, { status: 404 });
    }
    const body = (await req.json()) as {
      name?: string;
      message?: string;
      picks?: Record<string, string[]>;
    };
    const picks = body.picks && typeof body.picks === "object" ? body.picks : {};
    if (Object.keys(picks).length === 0) {
      return NextResponse.json({ error: "선택한 장소가 없어요." }, { status: 400 });
    }
    const resp = await createResponse(slug, {
      name: (body.name || "").slice(0, 40).trim(),
      message: (body.message || "").slice(0, 300).trim(),
      picks,
    });
    return NextResponse.json({ id: resp.id });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "응답을 저장하지 못했어요.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { slug } = await params;
    const token = req.nextUrl.searchParams.get("token") || "";
    const course = await getCourse(slug);
    if (!course) {
      return NextResponse.json({ error: "코스를 찾을 수 없어요." }, { status: 404 });
    }
    if (!course.ownerToken || course.ownerToken !== token) {
      return NextResponse.json({ error: "권한이 없어요." }, { status: 403 });
    }
    const responses = await getResponses(slug);
    return NextResponse.json({ responses });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "응답을 불러오지 못했어요.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
