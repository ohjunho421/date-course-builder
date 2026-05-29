import { promises as fs } from "fs";
import path from "path";
import { customAlphabet } from "nanoid";
import type { Course, CourseData } from "./types";

const nano = customAlphabet("23456789abcdefghjkmnpqrstuvwxyz", 8);

const useDb = !!process.env.DATABASE_URL;

/* ---------- file store (local dev, no DATABASE_URL) ---------- */
const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "courses.json");

async function readFileStore(): Promise<Record<string, Course>> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
async function writeFileStore(data: Record<string, Course>) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

/* ---------- public API ---------- */
export async function createCourse(data: CourseData): Promise<Course> {
  const slug = nano();
  const course: Course = { ...data, slug, createdAt: new Date().toISOString() };

  if (useDb) {
    const { prisma } = await import("./prisma");
    await prisma.course.create({
      data: {
        slug,
        title: data.title,
        intro: data.intro,
        modes: data.modes.join(","),
        stops: data.stops as unknown as object,
      },
    });
  } else {
    const all = await readFileStore();
    all[slug] = course;
    await writeFileStore(all);
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
      title: row.title,
      intro: row.intro ?? "",
      modes: (row.modes || "walk").split(",").filter(Boolean),
      stops: row.stops as unknown as Course["stops"],
      createdAt: row.createdAt.toISOString(),
    };
  }
  const all = await readFileStore();
  return all[slug] ?? null;
}
