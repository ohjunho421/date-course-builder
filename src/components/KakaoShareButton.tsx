"use client";

import { useEffect, useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    Kakao?: any;
  }
}

const SDK_SRC = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js";

function ensureSdkLoaded(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("no window"));
    if (window.Kakao) return resolve();
    const existing = document.getElementById("kakao-sdk") as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("sdk error")));
      return;
    }
    const s = document.createElement("script");
    s.id = "kakao-sdk";
    s.src = SDK_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("sdk error"));
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
  const [copied, setCopied] = useState(false);

  // SDK를 미리 로드/초기화해 둔다 — 클릭 시 동기적으로 공유를 띄워 팝업 차단을 피함
  useEffect(() => {
    if (!jsKey) return;
    let cancelled = false;
    ensureSdkLoaded()
      .then(() => {
        if (cancelled) return;
        try {
          if (window.Kakao && !window.Kakao.isInitialized()) window.Kakao.init(jsKey);
        } catch {
          /* ignore */
        }
      })
      .catch(() => {
        /* SDK 로드 실패 — 클릭 시 링크 복사로 폴백 */
      });
    return () => {
      cancelled = true;
    };
  }, [jsKey]);

  function copyFallback() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard
        .writeText(url)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        })
        .catch(() => {});
    }
  }

  // 동기 함수 — await 없이 사용자 제스처 안에서 바로 공유창을 연다
  function share() {
    const Kakao = typeof window !== "undefined" ? window.Kakao : undefined;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    if (Kakao?.isInitialized?.() && Kakao?.Share) {
      try {
        Kakao.Share.sendDefault({
          objectType: "feed",
          content: {
            title,
            description: description || "같이 갈 코스 골라줘 🌙",
            imageUrl: imageUrl || `${origin}/logo-card.png?v=2`,
            link: { mobileWebUrl: url, webUrl: url },
          },
          buttons: [{ title: "코스 보고 고르기", link: { mobileWebUrl: url, webUrl: url } }],
        });
        return;
      } catch {
        /* fall through to copy */
      }
    }
    copyFallback();
  }

  if (!jsKey) return null;

  return (
    <button
      onClick={share}
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
      {copied ? "링크 복사됨 ✓" : label}
    </button>
  );
}
