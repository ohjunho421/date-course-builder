"use client";

import { useState } from "react";
import Link from "next/link";

interface SharePanelProps {
  slug: string;
  token: string;
  title: string;
}

export default function SharePanel({ slug, token, title }: SharePanelProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/c/${slug}` : `/c/${slug}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: `${title} — 코스 골라줘!`, url: shareUrl });
      } catch {}
    } else {
      copy();
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "52px 18px 60px", textAlign: "center" }}>
      <div style={{ fontSize: 44, marginBottom: 8 }}>🎉</div>
      <h1 className="serif" style={{ fontSize: 28, color: "var(--wine)", fontWeight: 700, margin: "0 0 8px" }}>
        코스가 만들어졌어요!
      </h1>
      <p style={{ color: "var(--ink-soft)", fontSize: 15, margin: "0 0 26px" }}>
        아래 링크를 상대에게 보내면, 상대가 직접 골라서 보낼 수 있어요.
      </p>

      <div
        style={{
          background: "#fff",
          border: "1px solid var(--line)",
          borderRadius: 16,
          padding: "14px 16px",
          marginBottom: 12,
          textAlign: "left",
        }}
      >
        <div style={{ fontSize: 11, letterSpacing: ".1em", color: "var(--ink-soft)", fontWeight: 700, marginBottom: 6 }}>
          공유 링크
        </div>
        <div style={{ fontSize: 13.5, color: "var(--wine)", wordBreak: "break-all", fontWeight: 600 }}>{shareUrl}</div>
      </div>

      <div style={{ display: "flex", gap: 9, marginBottom: 10 }}>
        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={copy}>
          {copied ? "복사됨 ✓" : "🔗 링크 복사"}
        </button>
        <button className="btn btn-wine" style={{ flex: 1 }} onClick={nativeShare}>
          공유하기
        </button>
      </div>

      <Link
        href={`/c/${slug}`}
        style={{ display: "block", fontSize: 14, color: "var(--ink-soft)", textDecoration: "none", padding: "10px 0", fontWeight: 600 }}
      >
        코스 미리보기 →
      </Link>

      <div
        style={{
          marginTop: 22,
          padding: "16px",
          background: "linear-gradient(180deg,#fdf3ef,#fcf8f1)",
          border: "1px solid var(--line)",
          borderRadius: 16,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--wine)", marginBottom: 4 }}>📥 상대의 선택 확인하기</div>
        <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: "0 0 12px" }}>
          상대가 고르면 여기서 어떤 코스를 골랐는지 볼 수 있어요. 이 링크는 나만 보관하세요.
        </p>
        <Link href={`/c/${slug}/results?key=${token}`} className="btn btn-wine" style={{ width: "100%" }}>
          결과 보기
        </Link>
      </div>

      <Link
        href="/"
        style={{ display: "inline-block", marginTop: 22, fontSize: 13, color: "var(--ink-soft)", textDecoration: "none" }}
      >
        ← 새 코스 만들기
      </Link>
    </div>
  );
}
