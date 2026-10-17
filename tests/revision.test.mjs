import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { revisionManifest, assertReviewBuildAllowed, isProductionBuild } from "../scripts/revision.mjs";

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

test("Cloudflare production and review release have correct staging", () => {
  const main = { WORKERS_CI: "1", WORKERS_CI_BRANCH: "main" };
  const preview = { WORKERS_CI: "1", WORKERS_CI_BRANCH: "feat/obsidiana-v42-review" };
  assert.doesNotThrow(() => assertReviewBuildAllowed(main));
  assert.doesNotThrow(() => assertReviewBuildAllowed(preview));
  assert.equal(isProductionBuild(main), true);
  assert.equal(isProductionBuild(preview), false);
  assert.equal(isProductionBuild({}, true), true);
  assert.equal(isProductionBuild({ PORTFOLIO_STAGE: "production" }), true);
  assert.equal(isProductionBuild({}), false);
  for (const env of [
    { WORKERS_CI: "1" }, { WORKERS_CI: "1", WORKERS_CI_BRANCH: "other" },
    { ...preview, PORTFOLIO_STAGE: "production" }, { NETLIFY: "true" }, { CF_PAGES: "1" }
  ]) assert.throws(() => assertReviewBuildAllowed(env), /restricted to Cloudflare main/);
});

test("final React site includes approved Zara Original palette A", () => {
  const app = readFileSync(new URL("../src/v42/App.tsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../src/v42/styles/zara-original.css", import.meta.url), "utf8");
  assert.ok(app.includes('import "./styles/zara-original.css";'));
  for (const color of ["#0D0D12","#FF6773","#F7F7FA","#F9F9FA","#B61C34","#17171F"]) {
    assert.ok(css.includes(color), "Expected color " + color);
  }
  assert.ok(css.includes(':root[data-theme="light"]'));
});

test("Wrangler Preview configuration is present without changing production targets", () => {
  const config = JSON.parse(readFileSync(new URL("../wrangler.jsonc", import.meta.url), "utf8"));
  assert.deepEqual(config.previews, {});
  assert.equal(config.name, "portfolio");
  assert.equal(config.workers_dev, true);
  assert.equal(config.assets.directory, "./dist");
  assert.equal(config.assets.not_found_handling, "404-page");
});
