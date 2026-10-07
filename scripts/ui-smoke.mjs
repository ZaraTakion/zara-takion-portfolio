import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const baseURL = process.env.UI_BASE_URL || "http://127.0.0.1:4173";
const outputDir = "artifacts/ui";
await mkdir(outputDir, { recursive: true });

const viewports = [
  { name: "desktop-1366", width: 1366, height: 768, mobile: false },
  { name: "desktop-1024", width: 1024, height: 768, mobile: false },
  { name: "mobile-390", width: 390, height: 844, mobile: true },
  { name: "mobile-360", width: 360, height: 800, mobile: true },
];

const browser = await chromium.launch({ headless: true });

async function assertNoHorizontalOverflow(page, label) {
  const metrics = await page.evaluate(() => ({
    viewport: window.innerWidth,
    html: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  if (metrics.html > metrics.viewport + 1 || metrics.body > metrics.viewport + 1) {
    throw new Error(`${label}: horizontal overflow detected: ${JSON.stringify(metrics)}`);
  }
}

async function assertVisibleWindowsStayInsideViewport(page, label) {
  const boxes = await page.locator(".retro-app-window.is-open:visible").evaluateAll((nodes) =>
    nodes.map((node) => {
      const rect = node.getBoundingClientRect();
      return { id: node.id, x: rect.x, y: rect.y, right: rect.right, bottom: rect.bottom };
    })
  );
  const viewport = await page.evaluate(() => ({ width: innerWidth, height: innerHeight }));
  for (const box of boxes) {
    if (box.x < -1 || box.right > viewport.width + 1 || box.y < -1 || box.bottom > viewport.height + 1) {
      throw new Error(`${label}: window outside viewport: ${JSON.stringify({ box, viewport })}`);
    }
  }
}

for (const viewport of viewports) {
  const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
  await page.goto(baseURL, { waitUntil: "networkidle" });
  await assertNoHorizontalOverflow(page, `${viewport.name}/startup`);

  await page.locator("[data-desktop-start]").click();
  await page.locator(".retro-desktop-stage.desktop-running").waitFor();
  await assertNoHorizontalOverflow(page, `${viewport.name}/desktop`);

  if (viewport.mobile) {
    const projectsLauncher = page.locator('[data-app-open="projetos"]');
    await projectsLauncher.click();
    await page.locator("#projetos.is-mobile-active").waitFor();

    const state = await page.evaluate(() => ({
      mainOpen: document.querySelector(".retro-desktop-stage")?.classList.contains("mobile-app-open"),
      bodyLocked: document.body.classList.contains("mobile-app-modal-open"),
      hash: location.hash,
    }));
    if (!state.mainOpen || !state.bodyLocked || state.hash !== "#projetos") {
      throw new Error(`${viewport.name}: mobile app state is inconsistent: ${JSON.stringify(state)}`);
    }

    const box = await page.locator("#projetos.is-mobile-active").boundingBox();
    if (!box || Math.abs(box.x) > 1 || Math.abs(box.y) > 1 || Math.abs(box.width - viewport.width) > 1 || Math.abs(box.height - viewport.height) > 1) {
      throw new Error(`${viewport.name}: mobile app does not fill the viewport: ${JSON.stringify(box)}`);
    }

    await assertNoHorizontalOverflow(page, `${viewport.name}/projects`);
    await page.screenshot({ path: `${outputDir}/${viewport.name}-projects.png`, fullPage: true });

    await page.goBack();
    await page.waitForFunction(() => !document.querySelector(".retro-desktop-stage")?.classList.contains("mobile-app-open"));
    const afterBack = await page.evaluate(() => ({
      bodyLocked: document.body.classList.contains("mobile-app-modal-open"),
      active: Boolean(document.querySelector(".retro-app-window.is-mobile-active")),
      hash: location.hash,
    }));
    if (afterBack.bodyLocked || afterBack.active || afterBack.hash) {
      throw new Error(`${viewport.name}: browser Back did not close the mobile app: ${JSON.stringify(afterBack)}`);
    }

    await projectsLauncher.click();
    await page.locator("#projetos.is-mobile-active").waitFor();
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForFunction(() => !document.body.classList.contains("mobile-app-modal-open"));
    await assertNoHorizontalOverflow(page, `${viewport.name}/resized-desktop`);

    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.waitForFunction(() => document.querySelector("#projetos")?.classList.contains("is-mobile-active"));
    await page.waitForFunction(() => document.body.classList.contains("mobile-app-modal-open"));
    await assertNoHorizontalOverflow(page, `${viewport.name}/resized-mobile`);
  } else {
    await assertVisibleWindowsStayInsideViewport(page, viewport.name);
    await page.screenshot({ path: `${outputDir}/${viewport.name}.png`, fullPage: true });
  }

  await page.close();
}

await browser.close();
console.log("Responsive browser smoke tests passed.");
