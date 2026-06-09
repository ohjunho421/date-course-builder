import { getSession, kakaoConfigured } from "@/lib/auth";
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

  // 로그인 여부와 무관하게 사용방법 랜딩을 보여준다.
  // 로그인 상태면 CTA가 "새 코스 만들기"(/new)로 바뀌어 제작 페이지로 바로 이동한다.
  return <LandingPage loggedIn={!!user} />;
}
