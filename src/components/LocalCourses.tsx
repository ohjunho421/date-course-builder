"use client";

import Link from "next/link";
import { useMyCourses, removeMyCourse } from "@/lib/my-courses";

function timeAgo(iso: string): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "방금 전";
  if (min < 60) return `${min}분 전`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}시간 전`;
  return new Date(iso).toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
}

// 비로그인 사용자의 '내 코스' — 이 기기에 보관된 목록을 보여준다.
export default function LocalCourses() {
  const courses = useMyCourses();

  // 첫 렌더(하이드레이션) 동안에는 로컬 저장소를 읽기 전이라 빈 상태를 잠시 감춘다.
  if (courses === null) {
    return <div style={{ minHeight: 120 }} aria-hidden />;
  }

  if (courses.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "40px 24px",
          background: "#faf3ec",
          border: "1px dashed var(--line)",
          borderRadius: 18,
          color: "var(--ink-soft)",
          fontSize: 14,
        }}
      >
        아직 이 기기에서 만든 코스가 없어요.
        <br />
        <Link href="/new" style={{ color: "var(--wine)", fontWeight: 700, textDecoration: "none" }}>
          첫 코스 만들기 →
        </Link>
      </div>
    );
  }

  return (
    <section style={{ marginBottom: 26 }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: "var(--wine)", margin: "0 2px 12px" }}>
        ✨ 이 기기에서 만든 코스 {courses.length}
      </div>
      {courses.map((c) => (
        <article key={c.slug} className="card" style={{ padding: "16px 18px", marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
            <div style={{ fontWeight: 800, fontSize: 17, color: "var(--ink)" }}>{c.title}</div>
            <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{timeAgo(c.createdAt)}</div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <Link
              href={`/c/${c.slug}?owner=${c.ownerToken}`}
              className="btn btn-ghost"
              style={{ flex: 1, padding: "10px 0", fontSize: 13.5 }}
            >
              미리보기
            </Link>
            <Link
              href={`/c/${c.slug}/results?key=${c.ownerToken}`}
              className="btn btn-wine"
              style={{ flex: 1, padding: "10px 0", fontSize: 13.5 }}
            >
              결과 보기
            </Link>
          </div>
          <button
            onClick={() => removeMyCourse(c.slug)}
            style={{
              marginTop: 8,
              width: "100%",
              background: "none",
              border: "none",
              color: "var(--ink-soft)",
              fontSize: 12.5,
              cursor: "pointer",
              padding: "4px 0",
            }}
          >
            목록에서 지우기
          </button>
        </article>
      ))}
      <p style={{ fontSize: 12, color: "var(--ink-soft)", textAlign: "center", marginTop: 4 }}>
        이 목록은 이 기기에만 저장돼요. 다른 기기에서도 보려면 로그인하세요.
      </p>
    </section>
  );
}
