// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Header } from "./Header";
import { Signature } from "./Signature";
import { RequestJourney } from "./RequestJourney";
import { TransactionDiagram } from "./TransactionDiagram";
import { CampusExplorer, ContractExplorer } from "./ArchitectureExplorer";

let systemReduced = false;
let mediaChange: (() => void) | undefined;
beforeEach(() => {
  localStorage.clear();
  systemReduced = false;
  mediaChange = undefined;
  delete document.documentElement.dataset.theme;
  delete document.documentElement.dataset.motion;
  vi.stubGlobal("matchMedia", vi.fn(() => ({
    get matches() { return systemReduced; },
    addEventListener: (_: string, callback: () => void) => { mediaChange = callback; },
    removeEventListener: vi.fn(),
  })));
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe.each(["pt", "en"] as const)("%s interactive components", (locale) => {
  const pt = locale === "pt";
  it("opens the menu by keyboard, closes with Escape and returns focus", async () => {
    const user = userEvent.setup();
    render(<Header locale={locale} />);
    const menu = screen.getByRole("button", { name: /Menu/ });
    menu.focus();
    await user.keyboard("{Enter}");
    expect(menu.getAttribute("aria-expanded")).toBe("true");
    const theme = screen.getByRole("button", { name: pt ? "Tema claro" : "Light theme" });
    theme.focus();
    await user.keyboard("{Escape}");
    expect(menu.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(menu);
    expect(document.getElementById(menu.getAttribute("aria-controls")!)).not.toBeNull();
  });
  it("persists theme and motion preferences across remounts", async () => {
    const user = userEvent.setup();
    const view = render(<Header locale={locale} />);
    await user.click(screen.getByRole("button", { name: pt ? "Tema claro" : "Light theme" }));
    await user.click(screen.getByRole("button", { name: pt ? "Reduzir movimento" : "Reduce motion" }));
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(document.documentElement.dataset.motion).toBe("reduced");
    view.unmount();
    render(<Header locale={locale} />);
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("light"));
    expect(document.documentElement.dataset.motion).toBe("reduced");
  });
  it("focuses the destination when a menu link closes the mobile panel", async () => {
    const user = userEvent.setup();
    render(<><Header locale={locale} /><section id="projects">Destination</section></>);
    await user.click(screen.getByRole("button", { name: /Menu/ }));
    await user.click(screen.getByRole("link", { name: pt ? "Projetos" : "Projects" }));
    expect(document.activeElement?.id).toBe("projects");
    expect(screen.getByRole("button", { name: /Menu/ }).getAttribute("aria-expanded")).toBe("false");
  });
  it("keeps the creative signature textual and linked to the author's explanation", async () => {
    const user = userEvent.setup();
    const { container } = render(<Signature locale={locale} />);
    const link = screen.getByRole("link", { name: pt ? /Assinatura criativa de Rodrigo/ : /Rodrigo’s creative signature/ });
    expect(link.getAttribute("href")).toBe("#about");
    expect(container.querySelector("img, svg, canvas")).toBeNull();
    link.focus();
    await user.keyboard("{Enter}");
    expect(document.activeElement).toBe(link);
  });
  it("preserves the selected request step when switching reading depth", async () => {
    const user = userEvent.setup();
    render(<RequestJourney locale={locale} />);
    const step = screen.getByRole("button", { name: /Registrar|Record/ });
    step.focus();
    await user.keyboard(" ");
    await user.click(screen.getByRole("button", { name: pt ? "Visão técnica" : "Technical view" }));
    expect(step.getAttribute("aria-pressed")).toBe("true");
    const explanation = document.getElementById(step.getAttribute("aria-controls")!)!;
    expect(explanation.textContent).toMatch(/outbox/);
    expect(explanation.getAttribute("aria-live")).toBe("polite");
    await user.click(screen.getByRole("button", { name: pt ? "Em poucas palavras" : "In plain words" }));
    expect(explanation.textContent).toMatch(pt ? /depois/ : /later/);
    expect(step.getAttribute("aria-pressed")).toBe("true");
  });
  it("distinguishes the transaction from later notification processing", async () => {
    const user = userEvent.setup();
    const { container } = render(<TransactionDiagram locale={locale} />);
    const outbox = screen.getByRole("button", { name: /outbox/i });
    outbox.focus();
    await user.keyboard("{Enter}");
    const note = document.getElementById(outbox.getAttribute("aria-controls")!)!;
    expect(note.textContent).toMatch(pt ? /mesma transação/ : /same transaction/);
    await user.click(screen.getByRole("button", { name: pt ? /Processador/ : /Processor/ }));
    expect(note.textContent).toMatch(/Celery\/Redis/);
    expect(container.querySelectorAll('button[aria-pressed="true"]').length).toBe(1);
  });
  it("describes the academic roles without promising payment processing", async () => {
    const user = userEvent.setup();
    render(<CampusExplorer locale={locale} />);
    await user.click(screen.getByRole("button", { name: pt ? "Administração" : "Administration" }));
    expect(document.getElementById("campus-role-detail")?.textContent).toMatch(pt ? /não processa pagamentos/ : /does not process payments/);
  });
  it("validates the documented Task Manager title boundary and clears stale results", async () => {
    const user = userEvent.setup();
    render(<ContractExplorer locale={locale} />);
    const input = screen.getByRole("textbox");
    await user.click(screen.getByRole("button", { name: pt ? "Validar" : "Validate" }));
    expect(screen.getByRole("status").textContent).toMatch(pt ? /Título vazio/ : /Empty title/);
    fireEvent.change(input, { target: { value: "🚀".repeat(200) } });
    expect(screen.getByRole("status").textContent).toMatch(pt ? /Nenhum dado/ : /No data/);
    await user.click(screen.getByRole("button", { name: pt ? "Validar" : "Validate" }));
    expect(screen.getByRole("status").textContent).toMatch(pt ? /atende/ : /meets/);
    fireEvent.change(input, { target: { value: "x".repeat(201) } });
    input.focus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("status").textContent).toMatch(pt ? /acima do limite/ : /exceeds/);
  });
});

it("honors changes to system reduced motion without overwriting the manual choice", async () => {
  const user = userEvent.setup();
  render(<Header locale="pt" />);
  const motion = screen.getByRole("button", { name: "Reduzir movimento" });
  await user.click(motion);
  systemReduced = true;
  fireEvent(window, new Event("change"));
  const { act } = await import("@testing-library/react");
  act(() => mediaChange?.());
  expect((motion as HTMLButtonElement).disabled).toBe(true);
  expect(document.documentElement.dataset.motion).toBe("reduced");
  systemReduced = false;
  act(() => mediaChange?.());
  expect((motion as HTMLButtonElement).disabled).toBe(false);
  expect(motion.getAttribute("aria-pressed")).toBe("true");
});

it("keeps controls usable when browser storage is unavailable", async () => {
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
  const user = userEvent.setup();
  render(<Header locale="en" />);
  await user.click(screen.getByRole("button", { name: "Light theme" }));
  expect(document.documentElement.dataset.theme).toBe("light");
});
