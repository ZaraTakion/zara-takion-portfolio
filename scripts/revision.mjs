import { execFileSync } from "node:child_process";

export function assertReviewBuildAllowed(env) {
  if (env.WORKERS_CI === "1" || env.NETLIFY === "true" || env.CF_PAGES === "1") {
    throw new Error("V4.2 is approved for draft review only. Hosted builds/previews are blocked until a separate release authorization. No deployment was attempted.");
  }
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
