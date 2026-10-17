import { execFileSync } from "node:child_process";
import { assertReviewBuildAllowed, revisionManifest } from "./revision.mjs";

// This branch is approved for integration only. Stop hosted builds before any
// deployment/preview command can run, without changing the hosting settings.
assertReviewBuildAllowed(process.env);
const env = { ...process.env };
if (process.argv.includes("--production")) env.PORTFOLIO_STAGE = "production";
// Reject an untraceable production candidate before touching existing output.
revisionManifest({ production: env.PORTFOLIO_STAGE === "production" });
for (const args of [
  ["node_modules/typescript/bin/tsc", "--noEmit"],
  ["node_modules/vite/bin/vite.js", "build"],
  ["node_modules/vite/bin/vite.js", "build", "--ssr", "src/entry-server.tsx", "--outDir", ".ssr"],
  ["scripts/copy-public.mjs"],
  ["scripts/prerender.mjs"],
]) execFileSync(process.execPath, args, { stdio: "inherit", env });
