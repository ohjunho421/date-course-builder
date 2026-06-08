import { getSession, kakaoConfigured } from "@/lib/auth";
import Builder from "@/components/Builder";
import LandingPage from "@/components/LandingPage";

export const dynamic = "force-dynamic";

export default async function Home() {
  if (!kakaoConfigured()) {
    return (
      <>
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
    return <LandingPage />;
  }

  return <Builder />;
}
