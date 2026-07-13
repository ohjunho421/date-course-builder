import { defineConfig } from "@apps-in-toss/web-framework/config";

// 앱인토스(Apps in Toss) 미니앱 설정.
// appName은 앱인토스 콘솔의 appName과 정확히 일치해야 한다.
export default defineConfig({
  appName: "date-course",
  brand: {
    displayName: "달에게 가는 길",
    primaryColor: "#6E1423",
    icon: "https://date-course-builder-production.up.railway.app/icon.png",
  },
  web: {
    host: "localhost",
    port: 3000,
    commands: {
      dev: "next dev",
      // 앱인토스 번들은 CSR/SSG 정적 출력만 지원한다 (Next SSR 출력 불가).
      // 정적 셸을 dist-appintoss/에 생성하고, 셸이 호스팅된 서비스로 이동한다.
      build: "node appintoss/build.mjs",
    },
  },
  permissions: [],
  outdir: "dist-appintoss",
});
