// 앱인토스 .ait 번들용 정적 셸 빌드 스크립트.
// `ait build`가 granite.config.ts의 web.commands.build로 실행하며,
// outdir(dist-appintoss/)에 index.html이 있어야 한다.
import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const outdir = join(root, "..", "dist-appintoss");

await rm(outdir, { recursive: true, force: true });
await mkdir(outdir, { recursive: true });
await cp(join(root, "web"), outdir, { recursive: true });

console.log(`appintoss shell copied to ${outdir}`);
