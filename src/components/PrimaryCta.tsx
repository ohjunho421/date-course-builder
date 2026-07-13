"use client";

import Link from "next/link";
import { useTossEnv } from "@/lib/toss-client";
import TossLoginButton from "./TossLoginButton";

const KAKAO_HREF = "/api/auth/kakao/login?next=/";
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

const kakaoBtn: React.CSSProperties = { ...ctaBase, background: "#FEE500", color: "#191600" };
const wineBtn: React.CSSProperties = { ...ctaBase, background: "var(--wine)", color: "#fff" };

// 랜딩 메인 CTA. 앱인토스 WebView에서는 정책상 토스 로그인만 노출한다.
export default function PrimaryCta({ loggedIn, full = false }: { loggedIn: boolean; full?: boolean }) {
  const toss = useTossEnv();
  const extra: React.CSSProperties = full ? { width: "100%", maxWidth: 320 } : {};

  if (loggedIn) {
    return (
      <Link href={NEW_HREF} style={{ ...wineBtn, ...extra }}>
        🗓️ 새 코스 만들기
      </Link>
    );
  }
  if (toss) {
    return <TossLoginButton next="/" style={extra} />;
  }
  return (
    <a href={KAKAO_HREF} style={{ ...kakaoBtn, ...extra }}>
      💬 카카오로 시작하기
    </a>
  );
}
