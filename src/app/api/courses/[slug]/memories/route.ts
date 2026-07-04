import { NextRequest, NextResponse } from "next/server";
import { createMemory, getMemories } from "@/lib/store";
import type { MemoryKind } from "@/lib/types";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_BYTES = 30 * 1024 * 1024; // 30MB
const MAX_TEXT_LEN = 500;

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { slug } = await params;
  const memories = await getMemories(slug);
  return NextResponse.json({ memories });
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { slug } = await params;
    const form = await req.formData();
    const file = form.get("file");
    const text = String(form.get("text") ?? "").trim().slice(0, MAX_TEXT_LEN);

    let kind: MemoryKind = "text";
    let mimeType: string | undefined;
    let data: Buffer | undefined;

    if (file instanceof File && file.size > 0) {
      if (file.type.startsWith("image/")) kind = "image";
      else if (file.type.startsWith("video/")) kind = "video";
      else {
        return NextResponse.json({ error: "이미지 또는 영상 파일만 올릴 수 있어요." }, { status: 415 });
      }
      const limit = kind === "image" ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
      if (file.size > limit) {
        const mb = Math.round(limit / 1024 / 1024);
        return NextResponse.json(
          { error: `${kind === "image" ? "사진" : "영상"}은 ${mb}MB까지 올릴 수 있어요.` },
          { status: 413 }
        );
      }
      mimeType = file.type;
      data = Buffer.from(await file.arrayBuffer());
    } else if (!text) {
      return NextResponse.json({ error: "사진·영상 또는 한 줄 기록을 남겨주세요." }, { status: 400 });
    }

    const memory = await createMemory(slug, { kind, text, mimeType, data });
    if (!memory) {
      return NextResponse.json({ error: "코스를 찾을 수 없어요." }, { status: 404 });
    }
    return NextResponse.json({ memory });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "기록을 저장하지 못했어요.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
