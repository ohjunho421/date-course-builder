"use client";

import { useEffect } from "react";

// 카카오 애드핏(AdFit) 배너. 스크립트는 로드 시점에 아직 렌더되지 않은
// .kakao_ad_area 를 스캔해 채운다. SPA 클라이언트 이동에도 매번 광고가
// 뜨도록, 컴포넌트를 마운트할 때마다 스크립트를 새로 붙인다.
// 앱인토스 웹뷰 등 다양한 실행 환경에서 프로토콜이 달라도 일관되게 로드되도록
// 프로토콜 상대 경로(//) 대신 https 를 명시한다.
const AD_SCRIPT_SRC = "https://t1.kakaocdn.net/kas/static/ba.min.js";

interface AdBannerProps {
  unit?: string;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
}

export default function AdBanner({
  unit = "DAN-V7lDO9robhYiqGrf",
  width = 320,
  height = 50,
  style,
}: AdBannerProps) {
  useEffect(() => {
    const s = document.createElement("script");
    s.src = AD_SCRIPT_SRC;
    s.async = true;
    document.body.appendChild(s);
    return () => {
      s.remove();
    };
    // 광고 파라미터가 바뀌면 스크립트를 다시 붙여 새 광고를 렌더링한다.
  }, [unit, width, height]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        ...style,
      }}
    >
      <span
        style={{
          fontSize: 10,
          letterSpacing: ".18em",
          fontWeight: 700,
          color: "var(--ink-soft)",
          opacity: 0.55,
        }}
      >
        AD
      </span>
      {/* 광고 자리를 미리 잡아 두어 로드 전후 레이아웃이 흔들리지 않게 한다 */}
      <div style={{ minHeight: height, display: "flex", alignItems: "center" }}>
        <ins
          className="kakao_ad_area"
          style={{ display: "none" }}
          data-ad-unit={unit}
          data-ad-width={String(width)}
          data-ad-height={String(height)}
        />
      </div>
    </div>
  );
}
