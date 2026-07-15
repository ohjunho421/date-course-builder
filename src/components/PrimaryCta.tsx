import Link from "next/link";

const NEW_HREF = "/new";

const ctaBase: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  fontWeight: 800,
  fontSize: 16,
  borderRadius: 14,
  padding: "15px 28px",
  textDecoration: "none",
  cursor: "pointer",
};

const wineBtn: React.CSSProperties = { ...ctaBase, background: "var(--wine)", color: "#fff" };

// 랜딩 메인 CTA — 로그인 없이 누구나 바로 코스를 만들 수 있다.
// 로그인은 선택 사항으로 헤더 메뉴에 있다.
export default function PrimaryCta({ full = false }: { loggedIn?: boolean; full?: boolean }) {
  const extra: React.CSSProperties = full ? { width: "100%", maxWidth: 320 } : {};
  return (
    <Link href={NEW_HREF} style={{ ...wineBtn, ...extra }}>
      🗓️ 새 코스 만들기
    </Link>
  );
}
