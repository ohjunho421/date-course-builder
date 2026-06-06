import { promises as fs } from "fs";
import path from "path";
import { customAlphabet } from "nanoid";
import type { Course, CourseData, CourseResponse, CourseSummary, Place, Stop } from "./types";

const nano = customAlphabet("23456789abcdefghjkmnpqrstuvwxyz", 8);
const nanoToken = customAlphabet("23456789abcdefghjkmnpqrstuvwxyz", 16);

const useDb = !!process.env.DATABASE_URL;

/* ---------- file store (local dev, no DATABASE_URL) ---------- */
const DATA_DIR = path.join(process.cwd(), ".data");
const COURSE_FILE = path.join(DATA_DIR, "courses.json");
const RESP_FILE = path.join(DATA_DIR, "responses.json");
const PART_FILE = path.join(DATA_DIR, "participants.json"); // slug -> [userId, ...]

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}
async function writeJson(file: string, data: unknown) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");
}

/* ---------- courses ---------- */
export async function createCourse(data: CourseData, userId?: string): Promise<Course> {
  const slug = nano();
  const ownerToken = nanoToken();
  const course: Course = { ...data, slug, ownerToken, userId, createdAt: new Date().toISOString() };

  if (useDb) {
    const { prisma } = await import("./prisma");
    await prisma.course.create({
      data: {
        slug,
        ownerToken,
        userId: userId ?? null,
        title: data.title,
        intro: data.intro,
        modes: data.modes.join(","),
        stops: data.stops as unknown as object,
      },
    });
  } else {
    const all = await readJson<Record<string, Course>>(COURSE_FILE, {});
    all[slug] = course;
    await writeJson(COURSE_FILE, all);
  }
  return course;
}

export async function getCourse(slug: string): Promise<Course | null> {
  if (useDb) {
    const { prisma } = await import("./prisma");
    const row = await prisma.course.findUnique({ where: { slug } });
    if (!row) return null;
    return {
      slug: row.slug,
      ownerToken: row.ownerToken,
      title: row.title,
      intro: row.intro ?? "",
      modes: (row.modes || "walk").split(",").filter(Boolean),
      stops: row.stops as unknown as Course["stops"],
      createdAt: row.createdAt.toISOString(),
    };
  }
  const all = await readJson<Record<string, Course>>(COURSE_FILE, {});
  return all[slug] ?? null;
}

/** 코스를 받은(공유 링크로 들어온) 로그인 사용자를 참여자로 기록 (멱등) */
export async function addParticipant(slug: string, userId: string): Promise<void> {
  if (!userId) return;
  if (useDb) {
    const { prisma } = await import("./prisma");
    try {
      await prisma.courseParticipant.upsert({
        where: { courseSlug_userId: { courseSlug: slug, userId } },
        create: { courseSlug: slug, userId },
        update: {},
      });
    } catch {
      /* 코스가 없거나 경쟁 조건 — 무시 */
    }
    return;
  }
  const all = await readJson<Record<string, string[]>>(PART_FILE, {});
  const list = all[slug] ?? [];
  if (!list.includes(userId)) {
    all[slug] = [...list, userId];
    await writeJson(PART_FILE, all);
  }
}

/** append a place to a stop (dedup by placeId within that stop) */
export async function addPlaceToStop(
  slug: string,
  stopId: string,
  place: Place
): Promise<{ added: boolean; stop?: Stop }> {
  if (useDb) {
    const { prisma } = await import("./prisma");
    const row = await prisma.course.findUnique({ where: { slug } });
    if (!row) return { added: false };
    const stops = row.stops as unknown as Stop[];
    const stop = stops.find((s) => s.id === stopId);
    if (!stop) return { added: false };
    if (stop.places.some((p) => p.placeId === place.placeId)) return { added: false, stop };
    stop.places = [...stop.places, place];
    await prisma.course.update({
      where: { slug },
      data: { stops: stops as unknown as object },
    });
    return { added: true, stop };
  }

  const all = await readJson<Record<string, Course>>(COURSE_FILE, {});
  const course = all[slug];
  if (!course) return { added: false };
  const stop = course.stops.find((s) => s.id === stopId);
  if (!stop) return { added: false };
  if (stop.places.some((p) => p.placeId === place.placeId)) return { added: false, stop };
  stop.places.push(place);
  await writeJson(COURSE_FILE, all);
  return { added: true, stop };
}

/* ---------- responses ---------- */
export async function createResponse(
  slug: string,
  input: { name: string; message: string; picks: Record<string, string[]> }
): Promise<CourseResponse> {
  const resp: CourseResponse = {
    id: nano(),
    name: input.name,
    message: input.message,
    picks: input.picks,
    createdAt: new Date().toISOString(),
  };

  if (useDb) {
    const { prisma } = await import("./prisma");
    const row = await prisma.response.create({
      data: {
        courseSlug: slug,
        name: input.name || null,
        message: input.message || null,
        picks: input.picks as unknown as object,
      },
    });
    resp.id = row.id;
    resp.createdAt = row.createdAt.toISOString();
  } else {
    const all = await readJson<Record<string, CourseResponse[]>>(RESP_FILE, {});
    all[slug] = [...(all[slug] ?? []), resp];
    await writeJson(RESP_FILE, all);
  }
  return resp;
}

export async function getResponses(slug: string): Promise<CourseResponse[]> {
  if (useDb) {
    const { prisma } = await import("./prisma");
    const rows = await prisma.response.findMany({
      where: { courseSlug: slug },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((r) => ({
      id: r.id,
      name: r.name ?? "",
      message: r.message ?? "",
      picks: r.picks as unknown as Record<string, string[]>,
      createdAt: r.createdAt.toISOString(),
    }));
  }
  const all = await readJson<Record<string, CourseResponse[]>>(RESP_FILE, {});
  return [...(all[slug] ?? [])].reverse();
}

/* ---------- history (per user): 만든 코스 + 받은 코스 ---------- */
function stopLen(stops: unknown): number {
  return Array.isArray(stops) ? (stops as unknown[]).length : 0;
}

export async function getCoursesByUser(userId: string): Promise<CourseSummary[]> {
  if (useDb) {
    const { prisma } = await import("./prisma");

    // 내가 만든 코스
    const owned = await prisma.course.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        slug: true,
        ownerToken: true,
        title: true,
        stops: true,
        createdAt: true,
        _count: { select: { responses: true } },
      },
    });
    const ownerSummaries: CourseSummary[] = owned.map((r) => ({
      slug: r.slug,
      ownerToken: r.ownerToken,
      title: r.title,
      stopCount: stopLen(r.stops),
      responseCount: r._count.responses,
      createdAt: r.createdAt.toISOString(),
      role: "owner",
    }));

    // 내가 받은 코스 (참여자)
    const parts = await prisma.courseParticipant.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        createdAt: true,
        course: { select: { slug: true, title: true, stops: true, userId: true } },
      },
    });
    const receivedSummaries: CourseSummary[] = parts
      .filter((p) => p.course && p.course.userId !== userId)
      .map((p) => ({
        slug: p.course.slug,
        ownerToken: "",
        title: p.course.title,
        stopCount: stopLen(p.course.stops),
        responseCount: 0,
        createdAt: p.createdAt.toISOString(),
        role: "received",
      }));

    return [...ownerSummaries, ...receivedSummaries];
  }

  // ---- file store ----
  const courses = await readJson<Record<string, Course>>(COURSE_FILE, {});
  const responses = await readJson<Record<string, CourseResponse[]>>(RESP_FILE, {});
  const participants = await readJson<Record<string, string[]>>(PART_FILE, {});

  const ownerSummaries: CourseSummary[] = Object.values(courses)
    .filter((c) => c.userId === userId)
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
    .map((c) => ({
      slug: c.slug,
      ownerToken: c.ownerToken ?? "",
      title: c.title,
      stopCount: c.stops.length,
      responseCount: (responses[c.slug] ?? []).length,
      createdAt: c.createdAt || "",
      role: "owner",
    }));

  const receivedSummaries: CourseSummary[] = Object.entries(participants)
    .filter(([slug, ids]) => ids.includes(userId) && courses[slug] && courses[slug].userId !== userId)
    .map(([slug]) => courses[slug])
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
    .map((c) => ({
      slug: c.slug,
      ownerToken: "",
      title: c.title,
      stopCount: c.stops.length,
      responseCount: 0,
      createdAt: c.createdAt || "",
      role: "received",
    }));

  return [...ownerSummaries, ...receivedSummaries];
}
