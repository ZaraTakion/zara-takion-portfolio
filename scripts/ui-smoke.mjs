import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const base = process.env.UI_BASE_URL || "http://127.0.0.1:4173";
const folder = "artifacts/ui";
await mkdir(folder, { recursive: true });
const browser = await chromium.launch({ headless: true });
const errors = [];
let checks = 0;

const assert = (condition, message) => { checks++; if (!condition) throw new Error(message); };
async function noOverflow(page, name) {
  const x = await page.evaluate(() => ({
    viewport: window.innerWidth,
    html: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  assert(x.html <= x.viewport + 2 && x.body <= x.viewport + 2,
    `${name} horizontal overflow: ${JSON.stringify(x)}`);
}
async function checkLoadedArt(page, name) {
  const img = page.locator(".digital-avatar img").first();
  await img.scrollIntoViewIfNeeded();
  const state = await img.evaluate(el => {
    const image = el;
    return { complete: image.complete, width: image.naturalWidth, rendered: image.getBoundingClientRect().width };
  });
  assert(state.complete && state.width > 50 && state.rendered > 40,
    `${name}: Zara's original portrait did not load: ${JSON.stringify(state)}`);
}

const cases = [
  { name: "mobile-320", width: 320, height: 720, desktop: false },
  { name: "mobile-360", width: 360, height: 800, desktop: false },
  { name: "mobile-390", width: 390, height: 844, desktop: false },
  { name: "tablet-768", width: 768, height: 1024, desktop: false },
  { name: "laptop-1024", width: 1024, height: 768, desktop: false },
  { name: "desktop-1200", width: 1200, height: 800, desktop: true },
  { name: "desktop-1366", width: 1366, height: 768, desktop: true },
  { name: "desktop-1920", width: 1920, height: 1080, desktop: true },
  { name: "desktop-3840", width: 3840, height: 2160, desktop: true },
];

try {
  for (const viewport of cases) {
    const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height }, reducedMotion: "reduce" });
    const runtimeErrors = [];
    page.on("pageerror", error => runtimeErrors.push(error.message));
    await page.goto(base, { waitUntil: "networkidle" });
    await page.locator(".aqua-v3").waitFor({ state: "attached" });
    await noOverflow(page, `${viewport.name}/initial`);
    await page.locator("h1").first().waitFor({ state: viewport.desktop ? "attached" : "visible" });
    assert(await page.locator(".retro-desktop-stage").count() === 1, "React workstation missing");
    const projectCards = await page.locator(".project-card").count();
    assert(projectCards >= (viewport.desktop ? 5 : 7), `${viewport.name}: project data not loaded: ${projectCards}`);
    if (!viewport.desktop) {
      assert(await page.locator(".startup-screen").isVisible() === false,
        `${viewport.name}: optional desktop boot leaked into responsive document`);
      assert(await page.locator(".featured-project-grid").isVisible(), "Mobile project grid missing");
      if (viewport.width <= 390) {
        await page.locator(".menu-toggle").click();
        assert(await page.locator("#main-nav").isVisible(), "Mobile menu failed to open");
        await page.keyboard.press("Escape");
        assert(!(await page.locator("#main-nav").isVisible()), "Escape failed to close menu");
      }
      await checkLoadedArt(page,viewport.name);
      await page.screenshot({ path: `${folder}/${viewport.name}.png`, fullPage: true });
    } else {
      assert(await page.locator(".startup-screen").isVisible(), `${viewport.name}: optional startup is missing`);
      await page.locator("[data-desktop-start]").click();
      await page.locator(".retro-desktop-stage.desktop-running").waitFor();
      assert(await page.locator(".retro-app-window.is-open").count() === 1, "Multiple windows visible");
      await checkLoadedArt(page, viewport.name);
      await page.locator('[data-app-open="projects"]').click();
      assert(await page.locator(".retro-app-window.is-open").count() === 1, "Opening project app leaked windows");
      const explorer = page.locator(".aqua-react-explorer");
      await explorer.waitFor({ state: "visible" });
      const selected = explorer.locator('[role="tab"][aria-selected="true"]');
      assert(await selected.count() === 1, "Explorer has no single selected tab");
      await explorer.locator('[role="tab"]').nth(1).click();
      assert((await explorer.locator('[role="tab"][aria-selected="true"]').count()) === 1, "Explorer selection unstable");
      if (viewport.width === 1366) {
        const expand = page.getByRole("button", { name: "Expandir janela" });
        await expand.click();
        assert(await page.locator(".retro-app-window.aqua-maximized").count() === 1, "Maximize failed");
        await page.getByRole("button", { name: "Restaurar tamanho" }).click();
        await page.keyboard.press("Alt+7");
        await page.locator("#terminal.is-open").waitFor();
        await page.locator("#aqua-terminal-command").fill("help");
        await page.locator(".aqua-terminal-input button[type='submit']").click();
        assert((await page.locator(".aqua-terminal-output").innerText()).includes("Comandos:"), "Terminal help failed");
        await page.keyboard.press("Control+k");
        await page.locator(".aqua-command-palette").waitFor({ state: "visible" });
        await page.locator("#command-search").fill("Contato");
        await page.locator(".aqua-command-results button").first().click();
        await page.locator("#contato.is-open").waitFor();
        await page.goBack();
        await page.locator("#terminal.is-open").waitFor();
        await page.setViewportSize({ width: 1024, height: 768 });
        await page.waitForFunction(() => !document.querySelector(".retro-desktop-stage")?.classList.contains("retro-enhanced"));
        assert(await page.locator(".featured-project-grid").isVisible(), "Desktop-to-tablet conversion lost content");
        await noOverflow(page, "desktop-to-tablet");
        await page.setViewportSize({ width: 1366, height: 768 });
        await page.waitForFunction(() => document.querySelector(".retro-desktop-stage")?.classList.contains("retro-enhanced"));
      }
      await noOverflow(page,`${viewport.name}/desktop`);
      await page.screenshot({ path: `${folder}/${viewport.name}.png`, fullPage: true });
    }
    assert(runtimeErrors.length === 0, `${viewport.name}: JavaScript errors: ${runtimeErrors.join("; ")}`);
    await page.close();
  }

  for (const locale of ["en/", ""]) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(`${base}/${locale}`, { waitUntil: "networkidle" });
    const isEnglish = locale !== "";
    assert(await page.locator("html").getAttribute("lang") === (isEnglish ? "en" : "pt-BR"), "Incorrect locale tag");
    assert(await page.locator("h1").count() === 1, "Accessible heading hierarchy: missing single h1");
    assert((await page.locator("h1").innerText()).includes(isEnglish ? "I build" : "Construo"), "React locale content mismatch");
    assert(await page.locator(".project-card").count() >= 7, "Bilingual projects missing");
    assert(await page.locator(`a[href="${isEnglish ? "/" : "/en/"}"]`).count() > 0, "Language switch missing");
    await noOverflow(page, locale || "pt");
    await page.close();
  }

  const privacy = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  await privacy.goto(`${base}/privacidade.html`, { waitUntil: "networkidle" });
  assert(await privacy.locator("h1").count() === 1, "Privacy page is missing");
  assert(await privacy.locator(".retro-desktop-stage").count() === 0, "React shell leaked into privacy page");
  assert((await privacy.locator('link[rel="stylesheet"]').getAttribute("href")) === "/assets/css/site.css", "Privacy stylesheet missing");
  const cssResponse = await privacy.request.get(`${base}/assets/css/site.css`);
  assert(cssResponse.ok(), "Privacy stylesheet returned an error");
  assert(await privacy.locator('script[src="/scripts/main.js"]').count() === 0, "Legal page uses removed legacy scripts");
  await privacy.close();
  console.log(`React Aqua Workstation: ${checks} assertions across ${cases.length} viewports, both languages, project explorer, terminal, palette and responsive transitions passed.`);
} finally {
  await browser.close();
}
