import { execFileSync } from "node:child_process";

export function assertReviewBuildAllowed(env) {
  // Cloudflare publishes main, and may preview the authorised review branch.
  const hosted = env.WORKERS_CI === "1";
  const main = hosted && env.WORKERS_CI_BRANCH === "main";
  const preview = hosted && env.WORKERS_CI_BRANCH === "feat/obsidiana-v42-review";
  if ((hosted && !main && !preview) ||
      (preview && env.PORTFOLIO_STAGE === "production") ||
      env.NETLIFY === "true" || env.CF_PAGES === "1") {
    throw new Error("Portfolio hosted builds are restricted to Cloudflare main (production) and the V4.2 review branch.");
  }
}

// Cloudflare uses the same build command for production and preview.
export function isProductionBuild(env, explicit = false) {
  if (env.WORKERS_CI === "1") return env.WORKERS_CI_BRANCH === "main";
  return explicit || env.PORTFOLIO_STAGE === "production";
}

export function revisionManifest({ cwd = process.cwd(), production = false } = {}) {
  let revision = null;
  let dirty = null;
  try {
    revision = execFileSync("git", ["rev-parse", "--verify", "HEAD^{commit}"], { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
    if (!/^[a-f0-9]{40}$/.test(revision)) throw new Error("Invalid Git revision");
    dirty = Boolean(execFileSync("git", ["status", "--porcelain", "--untracked-files=normal"], { cwd, encoding: "utf8" }).trim());
  } catch {
    revision = null;
    dirty = null;
  }
  if (production && (!revision || dirty)) {
    throw new Error("A production candidate requires an available Git revision and a clean checkout.");
  }
  return {
    site: "zara-aqua-workstation",
    framework: "React / TypeScript / Vite",
    version: "4.2.0",
    stage: production ? "production-candidate" : "private-preview",
    revision,
    shortRevision: revision?.slice(0, 7) ?? null,
    revisionSource: revision ? "git" : "unavailable",
    dirty,
  };
}
