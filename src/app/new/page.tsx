import { getSession } from "@/lib/auth";
import Builder from "@/components/Builder";

export const dynamic = "force-dynamic";

// 코스 만들기 — 로그인 없이 누구나 사용할 수 있다.
// 로그인하면 만든 코스가 계정에 보관되고, 비로그인이면 이 기기에 보관된다.
export default async function NewCoursePage() {
  const user = await getSession();
  return <Builder loggedIn={!!user} />;
}
