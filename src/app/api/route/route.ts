import { NextRequest, NextResponse } from "next/server";
import { routeLeg, type LatLng, type LegResult } from "@/lib/routing";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { mode, points } = (await req.json()) as {
      mode: string;
      points: LatLng[];
    };
    const m = ["walk", "car"].includes(mode) ? mode : "walk";
    const pts = Array.isArray(points)
      ? points.filter((p) => p && typeof p.lat === "number" && typeof p.lng === "number")
      : [];
    if (pts.length < 2) {
      return NextResponse.json({ legs: [] });
    }
    const legs: LegResult[] = [];
    for (let i = 0; i < pts.length - 1; i++) {
      legs.push(await routeLeg(m, pts[i], pts[i + 1]));
    }
    return NextResponse.json({ mode: m, legs });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "경로를 계산하지 못했어요.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
