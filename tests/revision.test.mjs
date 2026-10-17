import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { revisionManifest, assertReviewBuildAllowed } from "../scripts/revision.mjs";

test("version describes the real checkout, dirtiness and unavailable Git honestly", () => {
  const cwd = mkdtempSync(join(tmpdir(), "portfolio-revision-"));
  const git = (...args) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  try {
    assert.equal(revisionManifest({ cwd }).revision, null);
    assert.equal(revisionManifest({ cwd }).revisionSource, "unavailable");
    assert.throws(() => revisionManifest({ cwd, production: true }), /Git revision/);
    git("init", "--quiet");
    writeFileSync(join(cwd, "source.txt"), "first revision");
    git("add", "source.txt");
    git("-c", "user.name=Revision Test", "-c", "user.email=test@example.invalid", "commit", "-m", "initial");
    const revision = git("rev-parse", "HEAD");
    const savedSHA = process.env.GITHUB_SHA;
    let manifest;
    try {
      process.env.GITHUB_SHA = "0".repeat(40);
      manifest = revisionManifest({ cwd, production: true });
    } finally {
      if (savedSHA === undefined) delete process.env.GITHUB_SHA;
      else process.env.GITHUB_SHA = savedSHA;
    }
    assert.equal(manifest.revision, revision);
    assert.equal(manifest.shortRevision, revision.slice(0, 7));
    assert.equal(manifest.dirty, false);
    writeFileSync(join(cwd, "source.txt"), "uncommitted change");
    assert.equal(revisionManifest({ cwd }).dirty, true);
    assert.throws(() => revisionManifest({ cwd, production: true }), /clean checkout/);
  } finally { rmSync(cwd, { recursive: true, force: true }); }
});

test("hosted build guard allows only the exact Cloudflare review preview branch", () => {
  const preview = {
    CI: "true",
    WORKERS_CI: "1",
    WORKERS_CI_BRANCH: "feat/obsidiana-v42-review",
    WORKERS_CI_COMMIT_SHA: "f".repeat(40),
  };
  assert.doesNotThrow(() => assertReviewBuildAllowed(preview));
  for (const env of [
    { WORKERS_CI: "1" },
    { WORKERS_CI: "1", WORKERS_CI_BRANCH: "main" },
    { WORKERS_CI: "1", WORKERS_CI_BRANCH: "feat/other" },
    { ...preview, PORTFOLIO_STAGE: "production" },
    { ...preview, NETLIFY: "true" },
    { ...preview, CF_PAGES: "1" },
    { NETLIFY: "true" },
    { CF_PAGES: "1" },
  ]) {
    assert.throws(() => assertReviewBuildAllowed(env), /Preview of feat\/obsidiana-v42-review only/);
  }
  assert.doesNotThrow(() => assertReviewBuildAllowed({ GITHUB_ACTIONS: "true", CI: "true" }));
  assert.doesNotThrow(() => assertReviewBuildAllowed({}));
});

test("Wrangler Preview configuration is present without changing production targets", () => {
  const config = JSON.parse(readFileSync(new URL("../wrangler.jsonc", import.meta.url), "utf8"));
  assert.deepEqual(config.previews, {});
  assert.equal(config.name, "portfolio");
  assert.equal(config.workers_dev, true);
  assert.equal(config.assets.directory, "./dist");
  assert.equal(config.assets.not_found_handling, "404-page");
});
