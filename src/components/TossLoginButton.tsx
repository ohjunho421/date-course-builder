"use client";

import { useState } from "react";
import { tossLogin } from "@/lib/toss-client";

interface TossLoginButtonProps {
  next?: string;
  label?: string;
  style?: React.CSSProperties;
}

// 앱인토스 환경 전용 로그인 버튼 (정책상 토스 로그인만 허용).
// TDS 토스 블루를 사용해 토스 로그인임을 분명히 한다.
export default function TossLoginButton({
  next = "/history",
  label = "토스로 시작하기",
  style,
}: TossLoginButtonProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await tossLogin(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "토스 로그인에 실패했어요.");
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleLogin}
        disabled={busy}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          fontWeight: 800,
          fontSize: 16,
          borderRadius: 14,
          padding: "15px 28px",
          border: 0,
          cursor: busy ? "default" : "pointer",
          background: "#3182f6",
          color: "#fff",
          opacity: busy ? 0.7 : 1,
          ...style,
        }}
      >
        {busy ? "로그인하는 중이에요…" : `⚡ ${label}`}
      </button>
      {error && (
        <p style={{ margin: "8px 2px 0", fontSize: 12.5, color: "#f04452", textAlign: "center" }}>
          {error}
        </p>
      )}
    </>
  );
}
