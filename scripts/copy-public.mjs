import { copyFile, cp, mkdir, writeFile, readFile } from "node:fs/promises";
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
}) + "\n", "utf8");
console.log(`React Aqua Workstation: ${revision.slice(0, 7)} production release assembled.`);
