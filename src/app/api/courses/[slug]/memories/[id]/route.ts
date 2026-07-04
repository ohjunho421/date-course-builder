import { NextRequest, NextResponse } from "next/server";
import { deleteMemory, getMemoryMedia } from "@/lib/store";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ slug: string; id: string }>;
}

/** 미디어 바이너리 서빙 — iOS 사파리 영상 재생을 위해 Range 요청 지원 */
export async function GET(req: NextRequest, { params }: RouteContext) {
  const { slug, id } = await params;
  const media = await getMemoryMedia(slug, id);
  if (!media) {
    return NextResponse.json({ error: "기록을 찾을 수 없어요." }, { status: 404 });
  }

  const total = media.data.byteLength;
  const baseHeaders: Record<string, string> = {
    "Content-Type": media.mimeType,
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, max-age=31536000, immutable",
  };

  const range = req.headers.get("range");
  if (range) {
    const m = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
    const start = m?.[1] ? parseInt(m[1], 10) : 0;
    const end = m?.[2] ? Math.min(parseInt(m[2], 10), total - 1) : total - 1;
    if (!m || Number.isNaN(start) || start > end || start >= total) {
      return new NextResponse(null, {
        status: 416,
        headers: { ...baseHeaders, "Content-Range": `bytes */${total}` },
      });
    }
    const chunk = new Uint8Array(media.data.subarray(start, end + 1));
    return new NextResponse(chunk, {
      status: 206,
      headers: {
        ...baseHeaders,
        "Content-Range": `bytes ${start}-${end}/${total}`,
        "Content-Length": String(chunk.byteLength),
      },
    });
  }

  return new NextResponse(new Uint8Array(media.data), {
    status: 200,
    headers: { ...baseHeaders, "Content-Length": String(total) },
  });
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const { slug, id } = await params;
  const ok = await deleteMemory(slug, id);
  if (!ok) {
    return NextResponse.json({ error: "기록을 찾을 수 없어요." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
