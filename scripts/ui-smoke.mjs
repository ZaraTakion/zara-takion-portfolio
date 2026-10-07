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

async function assertNoHorizontalOverflow(page, label) {
  const metrics = await page.evaluate(() => ({
    viewport: innerWidth,
    html: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  if (metrics.html > metrics.viewport + 1 || metrics.body > metrics.viewport + 1) {
    throw new Error(`${label}: horizontal overflow: ${JSON.stringify(metrics)}`);
  }
}

async function assertNormalDocument(page, label) {
  const state = await page.evaluate(() => ({
    enhanced: document.querySelector(".retro-desktop-stage")?.classList.contains("retro-enhanced"),
    startupVisible: getComputedStyle(document.querySelector(".startup-screen")).display !== "none",
    heroVisible: Boolean(document.querySelector("#inicio, #home")?.getClientRects().length),
    gridVisible: Boolean(document.querySelector(".featured-project-grid")?.getClientRects().length),
    explorerPresent: Boolean(document.querySelector(".project-explorer")),
    statusbarVisible: getComputedStyle(document.querySelector(".desktop-statusbar")).display !== "none",
  }));

  if (state.enhanced || state.startupVisible || !state.heroVisible || !state.gridVisible || state.explorerPresent || state.statusbarVisible) {
    throw new Error(`${label}: normal responsive document is not intact: ${JSON.stringify(state)}`);
  }
}

async function assertSingleActiveWindow(page, expectedId, label) {
  const state = await page.evaluate(() => {
    const stage = document.querySelector(".retro-desktop-stage");
    const open = [...stage.querySelectorAll(".retro-app-window.is-open")]
      .filter((node) => getComputedStyle(node).display !== "none")
      .map((node) => node.id);
    const current = stage.querySelector("[data-active-app]")?.textContent.trim();
    return { open, current };
  });

  if (state.open.length !== 1 || state.open[0] !== expectedId) {
    throw new Error(`${label}: expected one active window "${expectedId}", got ${JSON.stringify(state)}`);
  }
  return state;
}

async function assertActiveWindowInsideStage(page, label) {
  const result = await page.evaluate(() => {
    const stage = document.querySelector(".retro-desktop-stage");
    const stageRect = stage.getBoundingClientRect();
    const node = stage.querySelector(".retro-app-window.is-open");
    const rect = node?.getBoundingClientRect();
    return {
      stage: { left: stageRect.left, top: stageRect.top, right: stageRect.right, bottom: stageRect.bottom },
      window: rect ? { id: node.id, left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom } : null,
    };
  });

  const box = result.window;
  if (!box ||
      box.left < result.stage.left - 1 ||
      box.right > result.stage.right + 1 ||
      box.top < result.stage.top - 1 ||
      box.bottom > result.stage.bottom + 1) {
    throw new Error(`${label}: active window escaped workspace: ${JSON.stringify(result)}`);
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
  if (startupDisplay === "none") throw new Error(`${viewport.name}: Aqua Workstation startup is missing`);

  await page.locator("[data-desktop-start]").click();
  await page.locator(".retro-desktop-stage.desktop-running").waitFor();
  await page.locator(".project-explorer").waitFor();
  await page.locator(".desktop-statusbar").waitFor();

  const homeId = await page.locator("#inicio, #home").first().getAttribute("id");
  await assertSingleActiveWindow(page, homeId, `${viewport.name}/home`);
  await assertActiveWindowInsideStage(page, `${viewport.name}/home`);
  await assertNoHorizontalOverflow(page, `${viewport.name}/home`);

  const projectLauncher = page.locator('[data-app-open="projetos"], [data-app-open="projects"]').first();
  await projectLauncher.click();
  const projectsId = await page.locator("#projetos, #projects").first().getAttribute("id");
  await page.waitForFunction(
    (id) => document.getElementById(id)?.classList.contains("is-open"),
    projectsId
  );

  const projectState = await assertSingleActiveWindow(page, projectsId, `${viewport.name}/projects`);
  if (!/project|projeto/i.test(projectState.current || "")) {
    throw new Error(`${viewport.name}: status bar did not update for projects: ${JSON.stringify(projectState)}`);
  }
  const currentLauncher = await projectLauncher.getAttribute("aria-current");
  if (currentLauncher !== "page") throw new Error(`${viewport.name}: project launcher is not marked active`);

  await assertActiveWindowInsideStage(page, `${viewport.name}/projects`);
  await assertNoHorizontalOverflow(page, `${viewport.name}/projects`);
  await page.screenshot({ path: `${outputDir}/${viewport.name}-projects.png`, fullPage: true });

  await page.goBack();
  await page.waitForFunction((id) => document.getElementById(id)?.classList.contains("is-open"), homeId);
  await assertSingleActiveWindow(page, homeId, `${viewport.name}/browser-back`);

  if (viewport.width === 1366) {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForFunction(() => !document.querySelector(".retro-desktop-stage")?.classList.contains("retro-enhanced"));
    await page.waitForFunction(() => Boolean(document.querySelector(".featured-project-grid")));
    await assertNormalDocument(page, "desktop-to-laptop");
    await assertNoHorizontalOverflow(page, "desktop-to-laptop");

    await page.setViewportSize({ width: 1366, height: 768 });
    await page.waitForFunction(() => document.querySelector(".retro-desktop-stage")?.classList.contains("retro-enhanced"));
    await page.waitForFunction(() => Boolean(document.querySelector(".project-explorer")));
    await assertSingleActiveWindow(page, homeId, "laptop-to-desktop");
    await assertActiveWindowInsideStage(page, "laptop-to-desktop");
  }

  await page.close();
}

await browser.close();
console.log("Aqua Workstation responsive browser tests passed.");
