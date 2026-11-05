import Link from "next/link";
import type { CourseSummary } from "@/lib/types";
import LocalCourses from "@/components/LocalCourses";

// 내 코스 페이지 뷰 — Next 서버 컴포넌트(/history)와 앱인토스 미니앱(CSR)이 함께 쓴다.
// 비로그인(user=null)이면 이 기기에 보관된 코스(LocalCourses)를 보여준다.

interface HistoryViewProps {
  user: { name: string } | null;
  courses: CourseSummary[];
  /** 로그아웃 동작 — 웹은 기본(/api/auth/logout 링크), 미니앱은 토큰 삭제 콜백을 넘긴다 */
  logoutHref?: string;
  onLogout?: () => void;
}

function Shell({ children }: { children: React.ReactNode }) {
  // width:100% 없으면 flex 컬럼(body) 안에서 auto 마진이 콘텐츠 폭으로 수축해 좌우 여백이 과도해짐
  return <div style={{ width: "100%", maxWidth: 520, margin: "0 auto", padding: "44px 18px 60px" }}>{children}</div>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 13, fontWeight: 800, color: "var(--wine)", margin: "0 2px 12px" }}>{children}</div>;
}

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

function Header({ title }: { title: string }) {
  return (
    <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 22 }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, letterSpacing: ".2em", fontWeight: 700, color: "var(--wine-2)" }}>MY COURSES</div>
        <h1
          className="serif"
          style={{ fontSize: 24, color: "var(--wine)", fontWeight: 700, margin: "6px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
        >
          {title}
        </h1>
      </div>
      <Link href="/new" className="btn btn-wine" style={{ flex: "none", padding: "10px 14px", fontSize: 14, whiteSpace: "nowrap" }}>
        + 새 코스
      </Link>
    </header>
  );
}

export default function HistoryView({ user, courses, logoutHref = "/api/auth/logout", onLogout }: HistoryViewProps) {
  if (!user) {
    return (
      <Shell>
        <Header title="내가 만든 코스" />
        <LocalCourses />
      </Shell>
    );
  }

  const owned = courses.filter((c) => c.role === "owner");
  const received = courses.filter((c) => c.role === "received");

  return (
    <Shell>
      <Header title={`${user.name}님의 코스`} />

      {courses.length === 0 ? (
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
          아직 코스가 없어요.
          <br />
          <Link href="/new" style={{ color: "var(--wine)", fontWeight: 700, textDecoration: "none" }}>
            첫 코스 만들기 →
          </Link>
        </div>
      ) : (
        <>
          {owned.length > 0 && (
            <section style={{ marginBottom: 26 }}>
              <SectionTitle>✨ 내가 만든 코스 {owned.length}</SectionTitle>
              {owned.map((c) => (
                <article key={c.slug} className="card" style={{ padding: "16px 18px", marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                    <div style={{ fontWeight: 800, fontSize: 17, color: "var(--ink)" }}>{c.title}</div>
                    <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{timeAgo(c.createdAt)}</div>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 12 }}>
                    {c.stopCount}단계 · 응답 <b style={{ color: c.responseCount > 0 ? "var(--wine)" : "var(--ink-soft)" }}>{c.responseCount}</b>개
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Link href={`/c/${c.slug}?owner=${c.ownerToken}`} className="btn btn-ghost" style={{ flex: 1, padding: "10px 0", fontSize: 13.5 }}>
                      미리보기
                    </Link>
                    <Link href={`/c/${c.slug}/results?key=${c.ownerToken}`} className="btn btn-wine" style={{ flex: 1, padding: "10px 0", fontSize: 13.5 }}>
                      결과 {c.responseCount > 0 ? `(${c.responseCount})` : ""}
                    </Link>
                  </div>
                </article>
              ))}
            </section>
          )}

          {received.length > 0 && (
            <section style={{ marginBottom: 26 }}>
              <SectionTitle>📨 받은 코스 {received.length}</SectionTitle>
              {received.map((c) => (
                <article key={c.slug} className="card" style={{ padding: "16px 18px", marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                    <div style={{ fontWeight: 800, fontSize: 17, color: "var(--ink)" }}>{c.title}</div>
                    <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{timeAgo(c.createdAt)}</div>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 12 }}>{c.stopCount}단계 · 받은 코스</div>
                  <Link href={`/c/${c.slug}`} className="btn btn-wine" style={{ width: "100%", padding: "10px 0", fontSize: 13.5 }}>
                    코스 보고 고르기 →
                  </Link>
                </article>
              ))}
            </section>
          )}
        </>
      )}

      <div style={{ textAlign: "center", marginTop: 20 }}>
        {onLogout ? (
          <button type="button" onClick={onLogout} style={{ fontSize: 13, color: "var(--ink-soft)", background: "none", border: 0, cursor: "pointer" }}>
            로그아웃
          </button>
        ) : (
          <a href={logoutHref} style={{ fontSize: 13, color: "var(--ink-soft)", textDecoration: "none" }}>
            로그아웃
          </a>
        )}
      </div>
    </Shell>
  );
}
