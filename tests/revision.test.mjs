import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
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

test("hosted build guards block automatic review publication while local/GitHub checks remain usable", () => {
  for (const env of [{ WORKERS_CI: "1" }, { NETLIFY: "true" }, { CF_PAGES: "1" }]) {
    assert.throws(() => assertReviewBuildAllowed(env), /draft review only/);
  }
  assert.doesNotThrow(() => assertReviewBuildAllowed({ GITHUB_ACTIONS: "true", CI: "true" }));
  assert.doesNotThrow(() => assertReviewBuildAllowed({}));
});
