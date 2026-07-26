"use client";

import { useState } from "react";
import Link from "next/link";
import { useTossEnv, tossShare } from "@/lib/toss-client";

interface ShareBarProps {
  slug: string;
  ownerToken?: string; // present only for the creator viewing their just-made course
}

export default function ShareBar({ slug, ownerToken }: ShareBarProps) {
  const [copied, setCopied] = useState(false);
  // 앱인토스에서는 토스 공유 시트를 쓴다 (외부 링크 정책)
  const toss = useTossEnv();
  const shareUrl =
    typeof window !== "undefined" ? `${window.location.origin}/c/${slug}` : `/c/${slug}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  async function nativeShare() {
    if (toss) {
      try {
        await tossShare(`같이 갈 코스 골라줘 🌙 ${shareUrl}`);
        return;
      } catch {}
    }
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "달에게 가는 길", text: "같이 갈 코스 골라줘 🌙", url: shareUrl });
      } catch {}
    } else {
      copyLink();
    }
  }

  // creator banner — shown right after creating a course
  if (ownerToken) {
    return (
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "14px 18px 0" }}>
        <div
          style={{
            background: "linear-gradient(180deg,#fdf3ef,#fcf8f1)",
            border: "1px solid var(--line)",
            borderRadius: 16,
            padding: "14px 16px",
          }}
        >
          <div style={{ fontWeight: 800, color: "var(--wine)", fontSize: 15, marginBottom: 2 }}>
            🎉 코스가 만들어졌어요!
          </div>
          <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: "0 0 12px" }}>
            아래 링크를 상대에게 보내면, 상대가 직접 골라서 보낼 수 있어요.
          </p>
          {/* 카카오톡 공유 버튼은 동작하지 않아 제거했다.
              일반 브라우저에서는 아래 "공유하기"가 OS 공유 시트를 열고,
              거기서 카카오톡을 포함해 원하는 앱으로 보낼 수 있다. */}
          {toss && (
            <button
              className="btn btn-wine"
              style={{ width: "100%", padding: "12px 0", marginBottom: 8 }}
              onClick={nativeShare}
            >
              💌 코스 링크 공유하기
            </button>
          )}
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <button className="btn btn-ghost" style={{ flex: 1, padding: "11px 0" }} onClick={copyLink}>
              {copied ? "복사됨 ✓" : "🔗 링크 복사"}
            </button>
            <button className="btn btn-wine" style={{ flex: 1, padding: "11px 0" }} onClick={nativeShare}>
              공유하기
            </button>
          </div>
          <Link
            href={`/c/${slug}/results?key=${ownerToken}`}
            style={{
              display: "block",
              textAlign: "center",
              fontSize: 13.5,
              fontWeight: 700,
              color: "var(--wine)",
              textDecoration: "none",
              padding: "8px 0 2px",
            }}
          >
            📥 상대가 고른 결과 보기 →
          </Link>
        </div>
      </div>
    );
  }

  // default compact bar (for the partner / shared link)
  return (
    <div
      style={{
        maxWidth: 560,
        margin: "0 auto",
        padding: "14px 18px 0",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
      }}
    >
      <Link href="/" style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-soft)", textDecoration: "none" }}>
        🌙 새 코스
      </Link>
      <button
        onClick={copyLink}
        className="chip"
        style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}
      >
        {copied ? "링크 복사됨 ✓" : "🔗 링크 복사"}
      </button>
    </div>
  );
}
