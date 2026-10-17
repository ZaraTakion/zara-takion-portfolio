import { copyFile, cp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { revisionManifest } from "./revision.mjs";

// Vite handles React/TypeScript bundles. Copy only vetted public content:
// never allow legacy index.html/scripts to shadow the new React app.
await mkdir("dist/assets", { recursive: true });
await rm("dist/assets/img", { recursive: true, force: true });
await mkdir("dist/assets/img", { recursive: true });
const captures = JSON.parse(await readFile("site/data/image-provenance.json", "utf8"));
for (const capture of captures) {
  if (!/^\/assets\/img\/[\w.-]+\.(png|jpg)$/.test(capture.file)) throw new Error("Invalid capture path");
  const bytes = await readFile(`site${capture.file}`);
  if (createHash("sha256").update(bytes).digest("hex") !== capture.sha256) throw new Error(`Capture integrity failed: ${capture.file}`);
  await copyFile(`site${capture.file}`, `dist${capture.file}`);
}
// Preserve personal/character originals in site/, but never ship them in V4.2.
await cp("site/data", "dist/data", { recursive: true });
await cp("site/downloads", "dist/downloads", { recursive: true });
await copyFile("site/_headers", "dist/_headers");
for (const name of ["404.html", "robots.txt", "sitemap.xml", "privacidade.html"]) {
  await copyFile(join("site", name), join("dist", name));
}
await mkdir("dist/en", { recursive: true });
await copyFile("site/en/privacy.html", "dist/en/privacy.html");

// Privacy and 404 remain readable without React; ship their existing
// stylesheet, but remove the obsolete static-site JavaScript entrypoint.
await mkdir("dist/assets/css", { recursive: true });
await copyFile("site/styles/aqua-workstation.css", "dist/assets/css/site.css");
for (const file of ["dist/privacidade.html", "dist/en/privacy.html"]) {
  const original = await readFile(file, "utf8");
  await writeFile(
    file,
    original.replace(/<script\s+type="module"\s+src="\/scripts\/main\.js"><\/script>/g, ""),
    "utf8",
  );
}
const manifest = revisionManifest({ production: process.env.PORTFOLIO_STAGE === "production" });
await writeFile("dist/version.json", JSON.stringify(manifest) + "\n", "utf8");
console.log(`Ateliê Obsidiana: ${manifest.shortRevision ?? "revision unavailable"}; ${manifest.stage}; dirty=${manifest.dirty}.`);
