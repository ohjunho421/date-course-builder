"use client";

import { useCallback, useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    Kakao?: any;
  }
}

const SDK_SRC = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js";

function loadKakaoSdk(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Kakao) return resolve();
    const existing = document.getElementById("kakao-sdk") as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("kakao sdk load error")));
      return;
    }
    const s = document.createElement("script");
    s.id = "kakao-sdk";
    s.src = SDK_SRC;
    s.async = true;
    s.crossOrigin = "anonymous";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("kakao sdk load error"));
    document.head.appendChild(s);
  });
}

interface KakaoShareButtonProps {
  url: string;
  title: string;
  description?: string;
  imageUrl?: string;
  style?: React.CSSProperties;
  label?: string;
}

export default function KakaoShareButton({
  url,
  title,
  description,
  imageUrl,
  style,
  label = "💬 카카오톡 공유",
}: KakaoShareButtonProps) {
  const jsKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
  const [busy, setBusy] = useState(false);

  const share = useCallback(async () => {
    if (!jsKey) return;
    setBusy(true);
    try {
      await loadKakaoSdk();
      const Kakao = window.Kakao;
      if (!Kakao) return;
      if (!Kakao.isInitialized()) Kakao.init(jsKey);
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      Kakao.Share.sendDefault({
        objectType: "feed",
        content: {
          title,
          description: description || "같이 갈 코스 골라줘 🌙",
          imageUrl: imageUrl || `${origin}/logo-card.png`,
          link: { mobileWebUrl: url, webUrl: url },
        },
        buttons: [
          { title: "코스 보고 고르기", link: { mobileWebUrl: url, webUrl: url } },
        ],
      });
    } catch {
      /* SDK 차단/도메인 미등록 등 — 조용히 무시 */
    } finally {
      setBusy(false);
    }
  }, [jsKey, url, title, description, imageUrl]);

  if (!jsKey) return null;

  return (
    <button
      onClick={share}
      disabled={busy}
      style={{
        background: "#FEE500",
        color: "#191600",
        fontWeight: 700,
        fontSize: 14,
        border: "none",
        borderRadius: 13,
        padding: "12px 14px",
        cursor: "pointer",
        fontFamily: "inherit",
        ...style,
      }}
    >
      {label}
    </button>
  );
}
