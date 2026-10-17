import { describe, it, expect } from "vitest";
import { validateTitle, getLocale, cvPath, selectedProjects } from "./content";
describe("documented Task Manager title rule", () => {
  it("rejects empty and whitespace-only titles", () => {
    expect(validateTitle("")).toBe("empty");
    expect(validateTitle(" \n\t ")).toBe("empty");
  });
  it("trims before checking the inclusive 200-codepoint limit", () => {
    expect(validateTitle("  " + "x".repeat(200) + " ")).toBe("valid");
    expect(validateTitle("x".repeat(201))).toBe("long");
  });
  it("counts Unicode codepoints, consistent with Python string length", () => {
    expect(validateTitle("🚀".repeat(200))).toBe("valid");
    expect(validateTitle("🚀".repeat(201))).toBe("long");
  });
});
describe("bilingual routing and project boundaries", () => {
  it("matches the English route without misclassifying similar names", () => {
    expect(getLocale("/en/")).toBe("en");
    expect(getLocale("/en")).toBe("en");
    expect(getLocale("/engineering")).toBe("pt");
  });
  it("uses separate originals for both résumé languages and formats", () => {
    expect(
      new Set(
        (["pt", "en"] as const).flatMap((l) =>
          (["pdf", "docx"] as const).map((e) => cvPath(l, e)),
        ),
      ).size,
    ).toBe(4);
  });
  it("preserves private-source boundaries and prioritizes three back-end cases", () => {
    expect(selectedProjects.slice(0, 3).map((p) => p.title)).toEqual([
      "Chamados API",
      "Takion Campus",
      "Task Manager API",
    ]);
    expect(selectedProjects[4].source_private).toBe(true);
  });
});
