"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import BrandLogo from "./BrandLogo";
import TossLoginButton from "./TossLoginButton";
import { useTossEnv } from "@/lib/toss-client";

interface SiteHeaderProps {
  userName: string | null;
  kakaoOn: boolean;
}

function bar(top: number): React.CSSProperties {
  return { position: "absolute", left: 0, top, width: 22, height: 2, borderRadius: 2, background: "currentColor" };
}

const itemBase: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "13px 12px",
  borderRadius: 12,
  fontSize: 15.5,
  fontWeight: 700,
  textDecoration: "none",
};

function MenuLink({ href, icon, label, pathname }: { href: string; icon: string; label: string; pathname: string }) {
  const active = pathname === href;
  return (
    <Link
      href={href}
      style={{
        ...itemBase,
        background: active ? "rgba(206,20,35,.08)" : "transparent",
        color: active ? "var(--wine)" : "var(--ink)",
      }}
    >
      <span style={{ fontSize: 18, width: 24, textAlign: "center", flex: "none" }}>{icon}</span>
      {label}
    </Link>
  );
}

export default function SiteHeader({ userName, kakaoOn }: SiteHeaderProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  // 앱인토스 WebView에서는 정책상 토스 로그인만 노출한다
  const toss = useTossEnv();

  // 라우트가 바뀌면 드로어를 닫는다 (렌더 중 이전 경로와 비교해 조정)
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  // 열려 있는 동안 ESC로 닫고 배경 스크롤을 잠근다
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 60,
          background: "rgba(252,248,241,.85)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div
          style={{
            maxWidth: 600,
            margin: "0 auto",
            padding: "0 12px",
            height: 54,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link href="/" aria-label="홈으로" style={{ display: "inline-flex", alignItems: "center", padding: "4px 6px" }}>
            <BrandLogo height={24} />
          </Link>
          <button
            onClick={() => setOpen(true)}
            aria-label="메뉴 열기"
            aria-expanded={open}
            aria-haspopup="menu"
            style={{
              width: 44,
              height: 44,
              display: "grid",
              placeItems: "center",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--wine)",
              borderRadius: 10,
            }}
          >
            <span style={{ display: "block", position: "relative", width: 22, height: 16 }}>
              <span style={bar(0)} />
              <span style={bar(7)} />
              <span style={bar(14)} />
            </span>
          </button>
        </div>
      </header>

      {open && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(35,12,18,.5)",
            backdropFilter: "blur(3px)",
            WebkitBackdropFilter: "blur(3px)",
            display: "flex",
            justifyContent: "flex-end",
            animation: "fadeIn .18s ease",
          }}
        >
          <nav
            role="menu"
            aria-label="사이트 메뉴"
            style={{
              width: "min(82%, 320px)",
              height: "100%",
              background: "var(--paper)",
              boxShadow: "-20px 0 50px -20px rgba(40,10,18,.5)",
              padding: "calc(12px + env(safe-area-inset-top)) 18px calc(20px + env(safe-area-inset-bottom))",
              display: "flex",
              flexDirection: "column",
              animation: "slideInRight .22s ease",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <BrandLogo height={26} />
              <button
                onClick={() => setOpen(false)}
                aria-label="메뉴 닫기"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "#fff",
                  border: "1px solid var(--line)",
                  fontSize: 20,
                  color: "var(--ink-soft)",
                  cursor: "pointer",
                  flex: "none",
                }}
              >
                ×
              </button>
            </div>

            {userName && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 14px",
                  background: "#fff",
                  border: "1px solid var(--line)",
                  borderRadius: 14,
                  marginBottom: 16,
                }}
              >
                <span
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "var(--wine)",
                    color: "#fff",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 700,
                    fontSize: 16,
                    flex: "none",
                  }}
                >
                  {userName.slice(0, 1)}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: "var(--ink-soft)", fontWeight: 700, letterSpacing: ".06em" }}>로그인됨</div>
                  <div style={{ fontWeight: 700, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {userName}
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: "grid", gap: 4 }}>
              <MenuLink href="/" icon="🏠" label="홈" pathname={pathname} />
              {userName && <MenuLink href="/new" icon="📝" label="코스 만들기" pathname={pathname} />}
              {userName && <MenuLink href="/history" icon="📑" label="내 코스" pathname={pathname} />}
            </div>

            {(kakaoOn || toss) && (
              <div style={{ marginTop: "auto", paddingTop: 18, borderTop: "1px solid var(--line)" }}>
                {userName ? (
                  <a href="/api/auth/logout" style={{ ...itemBase, color: "var(--ink-soft)" }}>
                    <span style={{ fontSize: 18, width: 24, textAlign: "center", flex: "none" }}>↩︎</span>
                    로그아웃
                  </a>
                ) : toss ? (
                  <TossLoginButton
                    next="/history"
                    label="토스로 로그인"
                    style={{ width: "100%", borderRadius: 12, padding: "13px 0", fontSize: 15.5 }}
                  />
                ) : (
                  <a
                    href="/api/auth/kakao/login?next=/history"
                    style={{
                      display: "block",
                      textAlign: "center",
                      background: "#FEE500",
                      color: "#191600",
                      fontWeight: 800,
                      borderRadius: 12,
                      padding: "13px 0",
                      textDecoration: "none",
                    }}
                  >
                    💬 카카오로 로그인
                  </a>
                )}
              </div>
            )}
          </nav>
        </div>
      )}
    </>
  );
}
