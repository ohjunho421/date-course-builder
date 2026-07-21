"use client";

import { usePathname } from "next/navigation";

const BLOGCHEATKEY_URL = "https://blogcheatkey.com";
const CONTACT_EMAIL = "wnsghcoswp@gmail.com";

const dot: React.CSSProperties = { margin: "0 8px", color: "var(--ink-soft)", opacity: 0.5 };

// 서비스 운영사(블로그치트키) 정보를 담는 사이트 공통 푸터.
export default function SiteFooter() {
  const pathname = usePathname();
  const year = new Date().getFullYear();

  // 코스 보기 페이지(/c/[slug])에는 하단 고정 액션 바가 있어, 푸터가 그 뒤로
  // 가려지지 않도록 아래 여백을 넉넉히 준다.
  const onCourseView = /^\/c\/[^/]+$/.test(pathname);
  const bottomPad = onCourseView ? "104px" : "30px";

  return (
    <footer
      style={{
        marginTop: "auto",
        borderTop: "1px solid var(--line)",
        background: "rgba(252,248,241,.6)",
        padding: `30px 20px calc(${bottomPad} + env(safe-area-inset-bottom))`,
      }}
    >
      <div
        style={{
          maxWidth: 600,
          margin: "0 auto",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div className="serif" style={{ fontSize: 16, fontWeight: 700, color: "var(--wine)", letterSpacing: ".01em" }}>
          블로그치트키
        </div>

        <div style={{ fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 1.7 }}>
          대표 오준호
          <span style={dot}>·</span>
          문의{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "var(--ink-soft)", textDecoration: "none" }}>
            {CONTACT_EMAIL}
          </a>
        </div>

        <a
          href={BLOGCHEATKEY_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 13, fontWeight: 700, color: "var(--wine)", textDecoration: "none" }}
        >
          blogcheatkey.com →
        </a>

        <div style={{ fontSize: 11.5, color: "var(--ink-soft)", opacity: 0.8, marginTop: 2 }}>
          © {year} 블로그치트키. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
