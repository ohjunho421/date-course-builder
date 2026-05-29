"use client";

import { useState } from "react";
import Link from "next/link";

export default function ShareBar() {
  const [copied, setCopied] = useState(false);
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }
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
      <Link
        href="/"
        style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-soft)", textDecoration: "none" }}
      >
        ← 새 코스
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
