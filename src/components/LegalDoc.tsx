import Link from "next/link";

// 법적 문서(이용약관·개인정보처리방침) 공용 레이아웃.
export function LegalDoc({
  title,
  effectiveDate,
  intro,
  children,
}: {
  title: string;
  effectiveDate: string;
  intro?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div style={{ width: "100%", maxWidth: 720, margin: "0 auto", padding: "40px 20px 80px" }}>
      <header style={{ marginBottom: 24 }}>
        <Link href="/" style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-soft)", textDecoration: "none" }}>
          🌙 달에게 가는 길
        </Link>
        <h1 className="serif" style={{ fontSize: 26, color: "var(--wine)", fontWeight: 700, margin: "12px 0 6px" }}>
          {title}
        </h1>
        <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>시행일: {effectiveDate}</div>
      </header>
      {intro && (
        <p style={{ fontSize: 14.5, lineHeight: 1.8, color: "var(--ink)", margin: "0 0 24px" }}>{intro}</p>
      )}
      <div style={{ fontSize: 14, lineHeight: 1.85, color: "var(--ink)" }}>{children}</div>
      <footer style={{ marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--line)", fontSize: 13 }}>
        <Link href="/terms" style={{ color: "var(--wine)", fontWeight: 700, textDecoration: "none", marginRight: 16 }}>
          이용약관
        </Link>
        <Link href="/privacy" style={{ color: "var(--wine)", fontWeight: 700, textDecoration: "none" }}>
          개인정보처리방침
        </Link>
      </footer>
    </div>
  );
}

export function Article({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 26 }}>
      <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--wine)", margin: "0 0 10px" }}>
        제{n}조 ({title})
      </h2>
      <div>{children}</div>
    </section>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: "0 0 8px" }}>{children}</p>;
}

// 번호/기호 목록. 각 항목을 문자열 또는 노드로.
export function OL({ items, marker = "number" }: { items: React.ReactNode[]; marker?: "number" | "dash" }) {
  return (
    <ol
      style={{
        margin: "4px 0 8px",
        paddingLeft: 20,
        listStyleType: marker === "number" ? "decimal" : "none",
      }}
    >
      {items.map((it, i) => (
        <li key={i} style={{ margin: "0 0 6px", paddingLeft: marker === "dash" ? 8 : 0 }}>
          {marker === "dash" ? <span style={{ marginLeft: -16, marginRight: 8 }}>·</span> : null}
          {it}
        </li>
      ))}
    </ol>
  );
}
