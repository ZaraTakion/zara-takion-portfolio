import { copyFile, cp, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

// Vite handles React/TypeScript bundles. Copy only vetted public content:
// never allow legacy index.html/scripts to shadow the new React app.
await mkdir("dist/assets", { recursive: true });
await cp("site/assets/img", "dist/assets/img", { recursive: true });
await cp("site/data", "dist/data", { recursive: true });
await copyFile("site/_headers", "dist/_headers");
for (const name of ["404.html", "robots.txt", "sitemap.xml", "privacidade.html"]) {
  await copyFile(join("site", name), join("dist", name));
}
await mkdir("dist/en", { recursive: true });
await copyFile("site/en/privacy.html", "dist/en/privacy.html");
const revision = process.env.GITHUB_SHA
  || process.env.CF_PAGES_COMMIT_SHA
  || execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (!/^[a-f0-9]{40}$/i.test(revision)) {
  throw new Error("Unable to identify the Git revision used to build production.");
}
await writeFile("dist/version.json", JSON.stringify({
  site: "zara-aqua-workstation",
  framework: "React / TypeScript / Vite",
  revision,
  shortRevision: revision.slice(0, 7),
}) + "\\n", "utf8");
console.log(`React Aqua Workstation: ${revision.slice(0, 7)} production release assembled.`);
