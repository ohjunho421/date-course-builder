import { notFound } from "next/navigation";
import Link from "next/link";
import { getCourse, getResponses } from "@/lib/store";
import type { Stop } from "@/lib/types";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ key?: string }>;
}

function timeAgo(iso: string): string {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "방금 전";
  if (min < 60) return `${min}분 전`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}시간 전`;
  return new Date(iso).toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
}

export default async function ResultsPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { key } = await searchParams;
  const course = await getCourse(slug);
  if (!course) notFound();

  const authorized = !!course.ownerToken && course.ownerToken === key;

  if (!authorized) {
    return (
      <div style={{ maxWidth: 420, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
        <h1 className="serif" style={{ fontSize: 22, color: "var(--wine)", marginBottom: 8 }}>
          결과를 볼 수 없어요
        </h1>
        <p style={{ color: "var(--ink-soft)", fontSize: 14 }}>
          이 페이지는 코스를 만든 사람만 볼 수 있어요. 코스를 만들 때 받은 &quot;결과 보기&quot; 링크로 접속해 주세요.
        </p>
      </div>
    );
  }

  const responses = await getResponses(slug);
  const stopById = (id: string): Stop | undefined => course.stops.find((s) => s.id === id);

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "44px 18px 60px" }}>
      <header style={{ textAlign: "center", marginBottom: 26 }}>
        <div style={{ fontSize: 12, letterSpacing: ".3em", fontWeight: 700, color: "var(--wine-2)" }}>RESULTS</div>
        <h1 className="serif" style={{ fontSize: 28, color: "var(--wine)", fontWeight: 700, margin: "10px 0 6px" }}>
          {course.title}
        </h1>
        <p style={{ color: "var(--ink-soft)", fontSize: 14 }}>
          {responses.length > 0 ? `${responses.length}개의 응답이 도착했어요` : "아직 응답이 없어요"}
        </p>
      </header>

      {responses.length === 0 ? (
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
          상대가 코스를 고르면 여기에 표시돼요.
          <br />
          <Link href={`/c/${slug}`} style={{ color: "var(--wine)", fontWeight: 700, textDecoration: "none" }}>
            공유 링크 다시 보기 →
          </Link>
        </div>
      ) : (
        responses.map((r) => (
          <article
            key={r.id}
            className="card"
            style={{ padding: "16px 18px", marginBottom: 14 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: "var(--ink)" }}>{r.name || "익명의 선택"}</div>
              <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{timeAgo(r.createdAt)}</div>
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              {course.stops.map((st) => {
                const picked = r.picks[st.id];
                const pickedStr = picked && picked.length > 0 ? picked.join(", ") : "—";
                return (
                  <div key={st.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                    <span style={{ color: "var(--ink-soft)" }}>
                      {st.emoji} {st.label}
                    </span>
                    <span style={{ fontWeight: 700, color: picked && picked.length > 0 ? "var(--wine)" : "var(--ink-soft)" }}>
                      {pickedStr}
                    </span>
                  </div>
                );
              })}
              {Object.keys(r.picks)
                .filter((id) => !stopById(id))
                .map((id) => {
                  const names = r.picks[id];
                  const nameStr = Array.isArray(names) ? names.join(", ") : names;
                  return (
                    <div key={id} style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                      <span style={{ color: "var(--ink-soft)" }}>·</span>
                      <span style={{ fontWeight: 700, color: "var(--wine)" }}>{nameStr}</span>
                    </div>
                  );
                })}
            </div>
            {r.message && (
              <div
                className="serif"
                style={{
                  marginTop: 12,
                  padding: "10px 14px",
                  borderRadius: 12,
                  background: "linear-gradient(180deg,#fdf3ef,#fcf8f1)",
                  border: "1px solid var(--line)",
                  color: "var(--wine)",
                  fontSize: 14,
                }}
              >
                &quot;{r.message}&quot;
              </div>
            )}
          </article>
        ))
      )}

      <div style={{ textAlign: "center", marginTop: 8 }}>
        <Link href={`/c/${slug}`} style={{ fontSize: 13, color: "var(--ink-soft)", textDecoration: "none" }}>
          코스 페이지 보기 →
        </Link>
      </div>
    </div>
  );
}
