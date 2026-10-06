import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

class MockElement {
  constructor(dataset = {}) {
    this.dataset = dataset;
    this.attributes = {};
    this.hidden = false;
    this.textContent = "";
  }

  setAttribute(name, value) { this.attributes[name] = value; }
  addEventListener(name, callback) { this[`on${name}`] = callback; }
  contains(element) { return element === this || this.buttons?.includes(element); }
  closest(selector) { return selector === "[data-project-filter]" ? this : null; }
}

test("project filters count items, update selection, and hide unrelated projects", async () => {
  const buttons = ["all", "web", "api", "data"].map((filter) => new MockElement({ projectFilter: filter }));
  const totals = ["all", "web", "api", "data"].map((track) => new MockElement({ projectTotal: track }));
  const status = new MockElement();
  const controls = new MockElement({
    countLabel: "projects",
    countLabelSingular: "project",
    trackWeb: "web applications",
    trackApi: "APIs",
    trackData: "data projects",
  });
  controls.buttons = buttons;
  controls.querySelectorAll = (selector) => selector === "[data-project-filter]" ? buttons : totals;
  controls.querySelector = () => status;
  const projects = ["web", "api", "api", "data", "data", "data", "data"]
    .map((track) => new MockElement({ projectTrack: track }));
  globalThis.Element = MockElement;
  globalThis.document = {
    querySelector: () => controls,
    querySelectorAll: () => projects,
  };

  const source = await readFile(new URL("../site/scripts/project-filters.js", import.meta.url), "utf8");
  const { initProjectFilters } = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
  initProjectFilters();

  assert.equal(controls.hidden, false);
  assert.deepEqual(totals.map((item) => item.textContent), ["7", "1", "2", "4"]);
  assert.equal(status.textContent, "7 projects");
  assert.equal(buttons[0].attributes["aria-pressed"], "true");

  controls.onclick({ target: buttons[2] });
  assert.equal(status.textContent, "2 APIs");
  assert.deepEqual(projects.map((project) => project.hidden), [true, false, false, true, true, true, true]);
  assert.equal(buttons[0].attributes["aria-pressed"], "false");
  assert.equal(buttons[2].attributes["aria-pressed"], "true");
});
