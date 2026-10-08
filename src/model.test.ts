import { describe, expect, it } from "vitest";
import { filterProjects, keyFromHash, slugFor } from "./model";
import type { Project } from "./types";

describe("Aqua workstation route and filtering model", () => {
  it("keeps PT and EN deep links stable", () => {
    expect(slugFor("projects", "pt")).toBe("projetos");
    expect(slugFor("projects", "en")).toBe("projects");
    expect(keyFromHash("#projetos")).toBe("projects");
    expect(keyFromHash("#projects")).toBe("projects");
    expect(keyFromHash("#unknown")).toBeNull();
  });
  it("filters by real project category without mutating source", () => {
    const projects = [{ track: "api" }, { track: "data" }, { track: "api" }] as Project[];
    expect(filterProjects(projects, "api")).toHaveLength(2);
    expect(filterProjects(projects, "web")).toHaveLength(0);
    expect(filterProjects(projects, "all")).toHaveLength(3);
    expect(projects).toHaveLength(3);
  });
});
