import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "코스픽 — 네이버 링크로 만드는 데이트 코스",
  description:
    "네이버 지도 링크만 넣으면, 사진·리뷰·지도 동선까지 담긴 데이트 코스 페이지가 완성됩니다. 상대에게 링크 하나로 공유하세요.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className="h-full">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
