import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { spawn } from "node:child_process";
import { writeFile, mkdir } from "node:fs/promises";
import assert from "node:assert/strict";
import { createServer } from "node:net";
import { readFile } from "node:fs/promises";
const out = process.env.V42_OUTPUT || "artifacts/v42";
await mkdir(out, { recursive: true });
let browser, server;
let base = process.env.UI_BASE_URL;
const result = {
  date: new Date().toISOString(),
  states: [],
  checks: [],
  errors: [],
  violations: [],
};
try {
  if (!base) {
    const socket = createServer();
    await new Promise(resolve => socket.listen(0, "127.0.0.1", resolve));
    const port = socket.address().port;
    await new Promise(resolve => socket.close(resolve));
    base = `http://127.0.0.1:${port}`;
    server = spawn(process.env.PYTHON || "python", ["-m", "http.server", String(port), "--bind", "127.0.0.1", "--directory", "dist"], { stdio: "ignore" });
    let ready = false;
    for (let i = 0; i < 80; i++) {
      if (server.exitCode !== null) throw new Error("Test server exited before readiness");
      try { if ((await fetch(base + "/version.json")).ok) { ready = true; break; } } catch {}
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert.ok(ready, "Preview server did not become ready");
  }
  const expected = JSON.parse(await readFile("dist/version.json", "utf8"));
  const served = await (await fetch(base + "/version.json")).json();
  assert.deepEqual(served, expected, "The smoke test must exercise the current build");
  browser = await chromium.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH }
      : {}),
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on("pageerror", (e) => result.errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") result.errors.push(m.text());
  });
  for (const locale of ["pt", "en"])
    for (const theme of ["dark", "light"])
      for (const width of [320, 390, 768, 1366, 3840]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(
          base + (locale === "en" ? "/en/" : "/"),
          { waitUntil: "networkidle" },
        );
        await page.evaluate(
          (t) => localStorage.setItem("obsidiana-theme", t),
          theme,
        );
        await page.reload({ waitUntil: "networkidle" });
        await page.evaluate(() => document.fonts.ready);
        const sw = await page.evaluate(
          () => document.documentElement.scrollWidth,
        );
        assert.ok(
          sw <= width + 1,
          `${locale} ${theme} ${width}: overflow ${sw}`,
        );
        await page.locator(".case-details").evaluateAll(items => items.forEach(item => item.open = true));
        const minMobileText = await page.locator(".brand small, .signature-caption, .eyebrow, figcaption, .model-note").evaluateAll(elements => Math.min(...elements.filter(e => e.getClientRects().length).map(e => parseFloat(getComputedStyle(e).fontSize))));
        assert.ok(minMobileText >= 14, `Supporting text too small: ${minMobileText}px`);
        const axe = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze();
        if (axe.violations.length)
          result.violations.push({
            locale,
            theme,
            width,
            rules: axe.violations.map((v) => ({
              id: v.id,
              nodes: v.nodes.map((n) => n.target),
            })),
          });
        result.states.push({
          locale,
          theme,
          width,
          overflow: false,
          axeViolations: axe.violations.length,
          headerHeight: await page
            .locator(".site-header")
            .evaluate((e) => e.getBoundingClientRect().height),
        });

      }
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(base, { waitUntil: "networkidle" });
  const menu = page.getByRole("button", { name: "Menu", exact: false });
  await menu.focus();
  await page.keyboard.press("Enter");
  assert.equal(await menu.getAttribute("aria-expanded"), "true");
  await page.getByRole("button", { name: /Tema/ }).click();
  await page.getByRole("button", { name: "Reduzir movimento" }).click();
  assert.equal(
    await page.locator("html").getAttribute("data-motion"),
    "reduced",
  );
  await page.evaluate(() => { if(document.activeElement instanceof HTMLElement) document.activeElement.blur(); });
      await page.screenshot({ path: `${out}/V4.2_Menu_Mobile.png` });
  const menuAxe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  assert.equal(
    menuAxe.violations.length,
    0,
    JSON.stringify(menuAxe.violations),
  );
  await page.locator(".motion-toggle").focus();
  await page.keyboard.press("Escape");
  assert.equal(await menu.getAttribute("aria-expanded"), "false");
  assert.equal(
    await page.evaluate(() => document.activeElement?.className),
    "menu-toggle",
  );
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(
    await page.locator("html").getAttribute("data-motion"),
    "reduced",
  );
  result.checks.push(
    "Mobile menu, keyboard Enter/Escape/focus return, preferences, motion persistence and expanded-menu axe",
  );
  for (const locale of ["pt", "en"]) {
    await page.goto(
      base + (locale === "en" ? "/en/" : "/"),
      { waitUntil: "networkidle" },
    );
    const technical = page.getByRole("button", {
      name: locale === "pt" ? "Visão técnica" : "Technical view",
      exact: true,
    });
    await technical.click();
    await page.locator(".journey-nodes button").nth(2).click();
    assert.match(
      await page.locator("#journey-explanation").innerText(),
      locale === "pt" ? /outbox/ : /outbox/,
    );
    await page
      .getByRole("button", {
        name: locale === "pt" ? "Em poucas palavras" : "In plain words",
        exact: true,
      })
      .click();
    assert.match(
      await page.locator("#journey-explanation").innerText(),
      locale === "pt" ? /depois/ : /later/,
    );
    await page.locator(".processor-node").click();
    assert.match(await page.locator("#transaction-note").innerText(), /Celery/);
    await page.locator(".transaction-nodes button").nth(1).focus();
    await page.keyboard.press("Enter");
    assert.match(
      await page.locator("#transaction-note").innerText(),
      locale === "pt" ? /mesma transação/ : /same transaction/,
    );
  }
  result.checks.push(
    "PT/EN reading modes, request steps, outbox diagram and keyboard activation",
  );
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto(base, { waitUntil: "networkidle" });
  await page.addStyleTag({
    content:
      "*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}p{margin-bottom:2em!important}",
  });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    "Text-spacing overflow",
  );
  await page.getByRole("button", { name: "Menu", exact: false }).click();
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    "Expanded menu text spacing overflow",
  );
  result.checks.push("320px text-spacing, closed and expanded menu");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Menu", exact: false }).click();
  assert.equal(await page.locator(".motion-toggle").isDisabled(), true);
  assert.equal(
    await page
      .locator(".journey-nodes button")
      .first()
      .evaluate((e) => getComputedStyle(e).transitionDuration),
    "0s",
  );
  result.checks.push(
    "System reduced motion disables motion and preserves control state",
  );
  for (const locale of ["pt", "en"]) {
    await page.goto(base + (locale === "en" ? "/en/" : "/"), {waitUntil: "networkidle"});
    const suffix = locale === "pt" ? "PTBR" : "EN";
    for (const ext of ["pdf", "docx"]) {
      const href = `/downloads/Rodrigo_Pinheiro_2026_${suffix}.${ext}`;
      assert.ok(await page.locator(`a[href="${href}"]`).count(), "Localized résumé link missing");
      const response = await page.request.get(base + href);
      assert.equal(response.status(), 200);
      assert.deepEqual(await response.body(), await readFile(`site${href}`));
    }
    await page.locator(".case-details summary").first().click();
    assert.equal(await page.locator(".case-details").first().getAttribute("open"), "");
  }
  const certificate = await page.request.get(base + "/documents/Certificado_Udemy_Python_Geek_University.pdf");
  assert.equal(certificate.status(), 200);
  for (const path of ["/privacidade.html", "/en/privacy.html", "/404.html"]) {
    await page.goto(base + path, {waitUntil: "networkidle"});
    assert.equal(await page.locator("h1").count(), 1);
  }
  const certificateBytes = await certificate.body();
  assert.deepEqual(certificateBytes, await readFile("public/documents/Certificado_Udemy_Python_Geek_University.pdf"));
  result.checks.push("Current build identity, localized original PDF/DOCX downloads, certificate, case details, privacy and 404");
  await page.goto(base, {waitUntil: "networkidle"});
  await page.addStyleTag({content: ":root { font-size: 34px !important; }"});
  await page.getByRole("button", {name: /Menu/}).click();
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "200% text resize at 320px must reflow");
  result.checks.push("200% text resize at 320px with expanded menu");
  // Capture a fresh browsing state, separately from accessibility and keyboard checks.
  const visualContext = await browser.newContext();
  const visual = await visualContext.newPage();
  for (const theme of ["dark", "light"]) {
    for (const width of [390, 1366]) {
      await visual.setViewportSize({ width, height: 900 });
      await visual.goto(base, {waitUntil:"networkidle"});
      await visual.evaluate(t => localStorage.setItem("obsidiana-theme", t), theme);
      await visual.reload({waitUntil:"networkidle"});
      await visual.evaluate(() => document.fonts.ready);
      await visual.screenshot({path:`${out}/V4.2_${width===390?"Mobile":"Desktop"}_${theme==="dark"?"Escuro":"Claro"}.png`});
      if(width===1366) {
        await visual.locator(".project-0 h3").click();
        await visual.locator(".project-0").screenshot({path:`${out}/V4.2_Caso_Chamados_${theme==="dark"?"Escuro":"Claro"}.png`});
      }
    }
  }
  await visualContext.close();
  assert.equal(result.errors.length, 0);
  assert.equal(result.violations.length, 0, JSON.stringify(result.violations));
  result.result = "PASS";
} catch (e) {
  result.result = "FAIL";
  result.error = String(e.stack || e);
  process.exitCode = 1;
} finally {
  await browser?.close();
  server?.kill();
  await writeFile(
    out + "/verificacao-previa.json",
    JSON.stringify(result, null, 2),
  );
  console.log(JSON.stringify(result, null, 2));
}
