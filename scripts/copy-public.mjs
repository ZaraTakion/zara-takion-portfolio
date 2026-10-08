import { copyFile, cp, mkdir } from "node:fs/promises";
import { join } from "node:path";

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
console.log("React bundles, bilingual routes, privacy pages and existing art assembled in dist/.");
