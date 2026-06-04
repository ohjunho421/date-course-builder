"use client";

import { useState } from "react";

interface BrandLogoProps {
  height?: number;
}

/**
 * Shows the handwritten logo at /logo.png.
 * Falls back to a text wordmark if the image is missing or fails to load.
 */
export default function BrandLogo({ height = 40 }: BrandLogoProps) {
  const [ok, setOk] = useState(true);

  if (!ok) {
    return (
      <span
        style={{
          fontWeight: 700,
          color: "var(--wine-2)",
          letterSpacing: ".22em",
          fontSize: Math.max(12, Math.round(height * 0.34)),
        }}
      >
        🌙 달에게 가는 길
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="달에게 가는 길"
      onError={() => setOk(false)}
      style={{ height, width: "auto", display: "inline-block", verticalAlign: "middle" }}
    />
  );
}
