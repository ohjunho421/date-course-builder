import { redirect } from "next/navigation";
import { getSession, kakaoConfigured } from "@/lib/auth";
import Builder from "@/components/Builder";
import AuthNav from "@/components/AuthNav";

export const dynamic = "force-dynamic";

export default async function Home() {
  // 카카오 로그인이 설정되지 않은 경우 로그인 페이지로 리다이렉트
  if (!kakaoConfigured()) {
    return (
      <>
        <AuthNav />
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚙️</div>
          <h1 className="serif" style={{ fontSize: 24, color: "var(--wine)", marginBottom: 8 }}>
            로그인 기능을 준비 중이에요
          </h1>
          <p style={{ color: "var(--ink-soft)", fontSize: 14 }}>
            잠시 후 다시 시도해 주세요.
          </p>
        </div>
      </>
    );
  }

  // 로그인 상태 확인
  const user = await getSession();
  if (!user) {
    redirect("/api/auth/kakao/login?next=/");
  }

  return (
    <>
      <AuthNav />
      <Builder />
    </>
  );
}
