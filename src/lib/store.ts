import { promises as fs } from "fs";
import path from "path";
import { customAlphabet } from "nanoid";
import type { Course, CourseData, CourseResponse } from "./types";

const nano = customAlphabet("23456789abcdefghjkmnpqrstuvwxyz", 8);
const nanoToken = customAlphabet("23456789abcdefghjkmnpqrstuvwxyz", 16);

const useDb = !!process.env.DATABASE_URL;

/* ---------- file store (local dev, no DATABASE_URL) ---------- */
const DATA_DIR = path.join(process.cwd(), ".data");
const COURSE_FILE = path.join(DATA_DIR, "courses.json");
const RESP_FILE = path.join(DATA_DIR, "responses.json");

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
export async function createCourse(data: CourseData): Promise<Course> {
  const slug = nano();
  const ownerToken = nanoToken();
  const course: Course = { ...data, slug, ownerToken, createdAt: new Date().toISOString() };

  if (useDb) {
    const { prisma } = await import("./prisma");
    await prisma.course.create({
      data: {
        slug,
        ownerToken,
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

/* ---------- responses ---------- */
export async function createResponse(
  slug: string,
  input: { name: string; message: string; picks: Record<string, string> }
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
      picks: r.picks as unknown as Record<string, string>,
      createdAt: r.createdAt.toISOString(),
    }));
  }
  const all = await readJson<Record<string, CourseResponse[]>>(RESP_FILE, {});
  return [...(all[slug] ?? [])].reverse();
}
