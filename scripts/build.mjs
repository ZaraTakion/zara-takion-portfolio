import { execFileSync } from "node:child_process";
import { assertReviewBuildAllowed, isProductionBuild, revisionManifest } from "./revision.mjs";

assertReviewBuildAllowed(process.env);
const env = { ...process.env };
// Cloudflare main is indexable production, other local builds and review
// branches remain noindex previews; no deploy command is run here.
const production = isProductionBuild(env, process.argv.includes("--production"));
env.PORTFOLIO_STAGE = production ? "production" : "preview";
revisionManifest({ production });
for (const args of [
  ["node_modules/typescript/bin/tsc", "--noEmit"],
  ["node_modules/vite/bin/vite.js", "build"],
  ["node_modules/vite/bin/vite.js", "build", "--ssr", "src/entry-server.tsx", "--outDir", ".ssr"],
  ["scripts/copy-public.mjs"],
  ["scripts/prerender.mjs"],
]) execFileSync(process.execPath, args, { stdio: "inherit", env });
