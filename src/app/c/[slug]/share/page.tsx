import { notFound } from "next/navigation";
import { getCourse } from "@/lib/store";
import SharePanel from "@/components/SharePanel";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ key?: string }>;
}

export default async function SharePage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { key } = await searchParams;
  const course = await getCourse(slug);
  if (!course) notFound();
  const token = course.ownerToken && course.ownerToken === key ? key : "";
  return <SharePanel slug={slug} token={token} title={course.title} />;
}
