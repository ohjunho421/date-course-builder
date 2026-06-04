import Link from "next/link";
import { getSession, kakaoConfigured } from "@/lib/auth";

const kakaoBtn: React.CSSProperties = {
  background: "#FEE500",
  color: "#191600",
  fontWeight: 700,
  fontSize: 13,
  borderRadius: 10,
  padding: "8px 14px",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
};

export default async function AuthNav() {
  if (!kakaoConfigured()) return null;
  const user = await getSession();

  return (
    <div
      style={{
        maxWidth: 600,
        margin: "0 auto",
        padding: "12px 18px 0",
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        gap: 12,
      }}
    >
      {user ? (
        <>
          <Link
            href="/history"
            style={{ fontSize: 13, fontWeight: 700, color: "var(--wine)", textDecoration: "none" }}
          >
            📑 내 코스
          </Link>
          <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>{user.name}</span>
          <a href="/api/auth/logout" style={{ fontSize: 12.5, color: "var(--ink-soft)", textDecoration: "none" }}>
            로그아웃
          </a>
        </>
      ) : (
        <a href="/api/auth/kakao/login?next=/history" style={kakaoBtn}>
          💬 카카오 로그인
        </a>
      )}
    </div>
  );
}
