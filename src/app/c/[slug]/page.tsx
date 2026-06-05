import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCourse } from "@/lib/store";
import CourseView from "@/components/CourseView";
import ShareBar from "@/components/ShareBar";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ owner?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourse(slug);
  if (!course) return { title: "코스를 찾을 수 없어요" };
  return {
    title: `${course.title} — 달에게 가는 길`,
    description: course.intro || "네이버 리뷰 기반으로 정리한 데이트 코스",
  };
}

export default async function CoursePage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { owner } = await searchParams;
  const course = await getCourse(slug);
  if (!course) notFound();
  const isOwner = !!course.ownerToken && course.ownerToken === owner;
  return (
    <>
      <ShareBar slug={slug} ownerToken={isOwner ? owner : undefined} title={course.title} />
      <CourseView course={course} />
    </>
  );
}
