import { NextRequest, NextResponse } from "next/server";
import { addParticipant, getCourse, getMemories } from "@/lib/store";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

/**
 * 코스 상세 — /c/[slug] 서버 컴포넌트가 하던 일을 미니앱(CSR)용 JSON으로 제공한다.
 * ?owner=<ownerToken> 이 맞으면 isOwner, 로그인한 받은 사람은 참여자로 기록한다.
 */
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { slug } = await params;
    const course = await getCourse(slug);
    if (!course) {
      return NextResponse.json({ error: "코스를 찾을 수 없어요." }, { status: 404 });
    }
    const owner = req.nextUrl.searchParams.get("owner") || "";
    const isOwner = !!course.ownerToken && course.ownerToken === owner;

    const viewer = await getSession();
    if (viewer && viewer.id !== course.userId) {
      try {
        await addParticipant(slug, viewer.id);
      } catch {
        /* 기록 실패는 응답에 영향 없음 */
      }
    }

    const memories = await getMemories(slug);
    // ownerToken은 소유자에게만 돌려준다
    const { ownerToken, ...rest } = course;
    return NextResponse.json({
      course: isOwner ? { ...rest, ownerToken } : rest,
      memories,
      isOwner,
      viewerName: viewer?.name ?? null,
      loginRequired: !!process.env.AUTH_SECRET,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "코스를 불러오지 못했어요.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
