import type { Metadata, Viewport } from "next";
import "./globals.css";
import { getSession, kakaoConfigured } from "@/lib/auth";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // 앱인토스 출시 체크리스트: 지도 외 제스처 확대·축소 비활성화
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "달에게 가는 길 — 네이버 링크로 만드는 데이트 코스",
  description:
    "네이버 지도 링크만 넣으면, 사진·리뷰·지도 동선까지 담긴 데이트 코스 페이지가 완성됩니다. 상대에게 링크 하나로 공유하세요.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getSession();

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
      <body className="min-h-full flex flex-col">
        <SiteHeader userName={user?.name ?? null} kakaoOn={kakaoConfigured()} />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
