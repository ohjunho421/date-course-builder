import { notFound } from "next/navigation";
import { getCourse, getResponses } from "@/lib/store";
import ResultsView from "@/components/ResultsView";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ key?: string }>;
}

export default async function ResultsPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { key } = await searchParams;
  const course = await getCourse(slug);
  if (!course) notFound();

  const authorized = !!course.ownerToken && course.ownerToken === key;
  const responses = authorized ? await getResponses(slug) : null;

  return <ResultsView course={course} responses={responses} />;
}
