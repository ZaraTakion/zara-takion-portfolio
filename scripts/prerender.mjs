import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { render } from "../.ssr/entry-server.js";
const production = process.env.PORTFOLIO_STAGE === "production";
const origin = "https://portfolio.zaratakion.workers.dev";
for (const locale of ["pt", "en"]) {
  const path = locale === "pt" ? "dist/index.html" : "dist/en/index.html";
  let html = await readFile(path, "utf8");
  html = html.replace(
    '<div id="root"></div>',
    `<div id="root">${render(locale)}</div>`,
  );
  const title = html.match(/<title>(.*?)<\/title>/)[1];
  const description = html.match(/name="description"\s+content="([^"]+)"/)[1];
  let metadata = `<meta property="og:type" content="website"/><meta property="og:title" content="${title}"/><meta property="og:description" content="${description}"/><meta property="og:locale" content="${locale === "pt" ? "pt_BR" : "en_US"}"/><meta name="twitter:card" content="summary"/>`;
  if (production) {
    html = html.replace(
      'content="noindex, nofollow"',
      'content="index, follow"',
    );
    metadata += `<link rel="canonical" href="${origin}${locale === "pt" ? "/" : "/en/"}"/><meta property="og:url" content="${origin}${locale === "pt" ? "/" : "/en/"}"/><link rel="alternate" hreflang="pt-BR" href="${origin}/"/><link rel="alternate" hreflang="en" href="${origin}/en/"/><link rel="alternate" hreflang="x-default" href="${origin}/"/>`;
  }
  html = html.replace("</head>", metadata + "</head>");
  await writeFile(path, html);
}
const headers = await readFile("site/_headers", "utf8");
await writeFile(
  "dist/_headers",
  headers + (production ? "" : "\n/*\n  X-Robots-Tag: noindex, nofollow\n"),
);
await writeFile(
  "dist/robots.txt",
  production
    ? await readFile("site/robots.txt", "utf8")
    : "User-agent: *\nDisallow: /\n",
);
await writeFile(
  "dist/sitemap.xml",
  production ? await readFile("site/sitemap.xml", "utf8") : '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>',
);
await mkdir("dist/en", { recursive: true });
await mkdir("dist/data", { recursive: true });
await copyFile("site/data/projects.json", "dist/data/projects.json");
for (const path of ["dist/privacidade.html", "dist/en/privacy.html", "dist/404.html"]) {
  let html = await readFile(path, "utf8");
  html = html.replace(/<link rel="icon"[^>]*>/g, '<link rel="icon" href="data:,">');
  html = html.replace(/<meta name="robots"[^>]*>/g, "");
  if (!production) html = html.replace(/<link rel="(?:canonical|alternate)"[^>]*>/g, "");
  html = html.replace("</head>", `<meta name="robots" content="${production ? "index, follow" : "noindex, nofollow"}"></head>`);
  await writeFile(path, html);
}
console.log(`V4.2 prerender: ${production ? "production candidate (not deployed)" : "private preview / noindex"}; PT + EN.`);
