import { redirect } from "next/navigation";
import { getSession, kakaoConfigured } from "@/lib/auth";
import Builder from "@/components/Builder";

export const dynamic = "force-dynamic";

// 코스 만들기 — 로그인한 사용자만. 비로그인/미설정이면 랜딩으로 보낸다.
export default async function NewCoursePage() {
  if (!kakaoConfigured()) {
    redirect("/");
  }
  const user = await getSession();
  if (!user) {
    redirect("/");
  }
  return <Builder />;
}
