import { getSession } from "@/lib/auth";
import { getCoursesByUser } from "@/lib/store";
import HistoryView from "@/components/HistoryView";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const user = await getSession();
  // 비로그인 사용자는 이 기기에 보관된 코스를 본다 (HistoryView가 LocalCourses를 그린다)
  const courses = user ? await getCoursesByUser(user.id) : [];
  return <HistoryView user={user ? { name: user.name } : null} courses={courses} />;
}
