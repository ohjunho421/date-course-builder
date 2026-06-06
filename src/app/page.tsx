import { getSession, kakaoConfigured } from "@/lib/auth";
import Builder from "@/components/Builder";
import AuthNav from "@/components/AuthNav";
import BrandLogo from "@/components/BrandLogo";

export const dynamic = "force-dynamic";

const kakaoBtn: React.CSSProperties = {
  display: "inline-block",
  background: "#FEE500",
  color: "#191600",
  fontWeight: 800,
  fontSize: 16,
  borderRadius: 13,
  padding: "14px 26px",
  textDecoration: "none",
};

export default async function Home() {
  if (!kakaoConfigured()) {
    return (
      <>
        <AuthNav />
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚙️</div>
          <h1 className="serif" style={{ fontSize: 24, color: "var(--wine)", marginBottom: 8 }}>
            로그인 기능을 준비 중이에요
          </h1>
          <p style={{ color: "var(--ink-soft)", fontSize: 14 }}>잠시 후 다시 시도해 주세요.</p>
        </div>
      </>
    );
  }

  const user = await getSession();

  // 로그인 전 — 로그인 랜딩(로그아웃 후 여기로 돌아옴, 자동 재로그인 X)
  if (!user) {
    return (
      <div style={{ maxWidth: 460, margin: "0 auto", padding: "80px 24px 60px", textAlign: "center" }}>
        <BrandLogo height={64} />
        <h1 className="serif" style={{ fontSize: 24, color: "var(--wine)", fontWeight: 700, margin: "22px 0 10px" }}>
          데이트 코스, 링크 하나로
        </h1>
        <p style={{ color: "var(--ink-soft)", fontSize: 15, margin: "0 0 28px", lineHeight: 1.65 }}>
          네이버 지도 링크만 넣으면 사진·리뷰·지도 동선까지 담긴 코스가 완성돼요.
          <br />
          로그인하면 내가 만든 코스와 상대의 선택을 한곳에서 볼 수 있어요.
        </p>
        <a href="/api/auth/kakao/login?next=/" style={kakaoBtn}>
          💬 카카오로 시작하기
        </a>
      </div>
    );
  }

  return (
    <>
      <AuthNav />
      <Builder />
    </>
  );
}
