import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const baseURL = process.env.UI_BASE_URL || "http://127.0.0.1:4173";
const outputDir = "artifacts/ui";
await mkdir(outputDir, { recursive: true });

const viewports = [
  { name: "mobile-360", width: 360, height: 800, desktopShell: false },
  { name: "mobile-390", width: 390, height: 844, desktopShell: false },
  { name: "tablet-768", width: 768, height: 1024, desktopShell: false },
  { name: "laptop-1024", width: 1024, height: 768, desktopShell: false },
  { name: "desktop-1366", width: 1366, height: 768, desktopShell: true },
  { name: "desktop-1920", width: 1920, height: 1080, desktopShell: true },
];

const browser = await chromium.launch({ headless: true });

async function metrics(page) {
  return page.evaluate(() => ({
    viewport: innerWidth,
    html: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
}

async function assertNoHorizontalOverflow(page, label) {
  const value = await metrics(page);
  if (value.html > value.viewport + 1 || value.body > value.viewport + 1) {
    throw new Error(`${label}: horizontal overflow: ${JSON.stringify(value)}`);
  }
}

async function assertNormalDocument(page, label) {
  const state = await page.evaluate(() => ({
    enhanced: document.querySelector(".retro-desktop-stage")?.classList.contains("retro-enhanced"),
    startupVisible: getComputedStyle(document.querySelector(".startup-screen")).display !== "none",
    heroVisible: Boolean(document.querySelector("#inicio, #home")?.getClientRects().length),
    gridVisible: Boolean(document.querySelector(".featured-project-grid")?.getClientRects().length),
    explorerPresent: Boolean(document.querySelector(".project-explorer")),
    navLinks: [...document.querySelectorAll("#main-nav > a:not(.language-switch)")].every((node) => getComputedStyle(node).display !== "none"),
  }));

  if (state.enhanced || state.startupVisible || !state.heroVisible || !state.gridVisible || state.explorerPresent || !state.navLinks) {
    throw new Error(`${label}: base responsive document is not intact: ${JSON.stringify(state)}`);
  }
}

async function assertDesktopWindowsInsideStage(page, label) {
  const result = await page.evaluate(() => {
    const stage = document.querySelector(".retro-desktop-stage");
    const stageRect = stage.getBoundingClientRect();
    const windows = [...stage.querySelectorAll(".retro-app-window.is-open")]
      .filter((node) => getComputedStyle(node).display !== "none")
      .map((node) => {
        const rect = node.getBoundingClientRect();
        return { id: node.id, left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
      });
    return {
      stage: { left: stageRect.left, top: stageRect.top, right: stageRect.right, bottom: stageRect.bottom },
      windows,
    };
  });

  for (const box of result.windows) {
    if (
      box.left < result.stage.left - 1 ||
      box.right > result.stage.right + 1 ||
      box.top < result.stage.top - 1 ||
      box.bottom > result.stage.bottom + 1
    ) {
      throw new Error(`${label}: desktop window escaped stage: ${JSON.stringify({ box, stage: result.stage })}`);
    }
  }
}

for (const viewport of viewports) {
  const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
  await page.goto(baseURL, { waitUntil: "networkidle" });
  await assertNoHorizontalOverflow(page, `${viewport.name}/initial`);

  if (!viewport.desktopShell) {
    await assertNormalDocument(page, viewport.name);
    await page.screenshot({ path: `${outputDir}/${viewport.name}.png`, fullPage: true });
    await page.close();
    continue;
  }

  await page.waitForFunction(() => document.querySelector(".retro-desktop-stage")?.classList.contains("retro-enhanced"));
  const startupDisplay = await page.locator(".startup-screen").evaluate((node) => getComputedStyle(node).display);
  if (startupDisplay === "none") throw new Error(`${viewport.name}: desktop startup screen is missing`);

  await page.locator("[data-desktop-start]").click();
  await page.locator(".retro-desktop-stage.desktop-running").waitFor();
  await page.locator(".project-explorer").waitFor();
  await assertNoHorizontalOverflow(page, `${viewport.name}/desktop`);
  await assertDesktopWindowsInsideStage(page, viewport.name);
  await page.screenshot({ path: `${outputDir}/${viewport.name}.png`, fullPage: true });

  if (viewport.width === 1366) {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForFunction(() => !document.querySelector(".retro-desktop-stage")?.classList.contains("retro-enhanced"));
    await page.waitForFunction(() => Boolean(document.querySelector(".featured-project-grid")));
    await assertNormalDocument(page, "desktop-to-tablet");
    await assertNoHorizontalOverflow(page, "desktop-to-tablet");

    await page.setViewportSize({ width: 1366, height: 768 });
    await page.waitForFunction(() => document.querySelector(".retro-desktop-stage")?.classList.contains("retro-enhanced"));
    await page.waitForFunction(() => Boolean(document.querySelector(".project-explorer")));
    await assertDesktopWindowsInsideStage(page, "tablet-to-desktop");
  }

  await page.close();
}

await browser.close();
console.log("Responsive V2 browser smoke tests passed.");
