const DESKTOP_QUERY = "(min-width: 1200px)";

export function initProjectExplorer() {
  const grid = document.querySelector(".featured-project-grid");
  if (!grid) return;

  const projects = [...grid.querySelectorAll(".project-card")];
  if (projects.length < 2) return;

  const desktopQuery = window.matchMedia(DESKTOP_QUERY);
  const isEnglish = document.documentElement.lang.toLowerCase().startsWith("en");
  const filters = document.querySelector("[data-project-filters]");

  let explorer = null;
  let entries = [];
  let abortController = null;

  function visibleEntries() {
    return entries.filter((entry) => !entry.project.hidden && !entry.tab.hidden);
  }

  function selectEntry(entry, { focus = false } = {}) {
    if (!entry) return;
    for (const current of entries) {
      const selected = current === entry;
      current.tab.setAttribute("aria-selected", String(selected));
      current.tab.tabIndex = selected ? 0 : -1;
      current.panel.hidden = !selected;
    }
    if (focus) entry.tab.focus();
  }

  function syncFilteredEntries() {
    for (const entry of entries) entry.tab.hidden = entry.project.hidden;
    const visible = visibleEntries();
    const active = entries.find((entry) => !entry.panel.hidden);
    if (visible.length && !visible.includes(active)) selectEntry(visible[0]);
  }

  function mountExplorer() {
    if (!desktopQuery.matches || explorer?.isConnected) return;

    abortController = new AbortController();
    const { signal } = abortController;

    const list = document.createElement("div");
    list.className = "project-explorer-list";
    list.setAttribute("role", "tablist");
    list.setAttribute("aria-orientation", "vertical");
    list.setAttribute("aria-label", isEnglish ? "Featured project folders" : "Pastas de projetos em destaque");

    const panels = document.createElement("div");
    panels.className = "project-explorer-panels";

    entries = projects.map((project, index) => {
      const title = project.querySelector("h3")?.textContent.trim() || `${isEnglish ? "Project" : "Projeto"} ${index + 1}`;
      const category = project.querySelector(".project-category")?.textContent.trim() || "";
      const technologies = [...project.querySelectorAll(".project-tags li")]
        .slice(0, 3)
        .map((tag) => tag.textContent.trim())
        .join(" · ");

      const tab = document.createElement("button");
      tab.type = "button";
      tab.className = "project-explorer-item";
      tab.id = `project-tab-${index + 1}`;
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-controls", `project-panel-${index + 1}`);
      tab.setAttribute("aria-selected", "false");
      tab.tabIndex = -1;
      tab.hidden = project.hidden;
      tab.innerHTML = '<span class="folder-icon" aria-hidden="true"></span><span class="project-explorer-item-copy"><strong></strong><small></small><em></em></span>';
      tab.querySelector("strong").textContent = title;
      tab.querySelector("small").textContent = category;
      tab.querySelector("em").textContent = technologies;

      const panel = document.createElement("div");
      panel.className = "project-explorer-panel";
      panel.id = `project-panel-${index + 1}`;
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", tab.id);
      panel.tabIndex = 0;
      panel.hidden = true;

      project.classList.add("project-explorer-case");
      panel.append(project);
      list.append(tab);
      panels.append(panel);
      return { tab, panel, project };
    });

    explorer = document.createElement("div");
    explorer.className = "project-explorer";
    explorer.append(list, panels);
    grid.replaceWith(explorer);

    const initial = visibleEntries()[0];
    if (initial) selectEntry(initial);

    list.addEventListener("click", (event) => {
      const tab = event.target instanceof Element ? event.target.closest('[role="tab"]') : null;
      const entry = entries.find((candidate) => candidate.tab === tab);
      if (entry && !entry.tab.hidden) selectEntry(entry);
    }, { signal });

    list.addEventListener("keydown", (event) => {
      const tab = event.target instanceof Element ? event.target.closest('[role="tab"]') : null;
      const available = visibleEntries();
      const currentIndex = available.findIndex((entry) => entry.tab === tab);
      if (currentIndex < 0) return;
      if (!["ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;

      event.preventDefault();
      const nextIndex = event.key === "Home"
        ? 0
        : event.key === "End"
          ? available.length - 1
          : (currentIndex + (event.key === "ArrowDown" ? 1 : available.length - 1)) % available.length;
      selectEntry(available[nextIndex], { focus: true });
    }, { signal });

    filters?.addEventListener("click", () => {
      window.requestAnimationFrame(syncFilteredEntries);
    }, { signal });
  }

  function unmountExplorer() {
    if (!explorer) return;

    abortController?.abort();
    abortController = null;

    for (const project of projects) {
      project.classList.remove("project-explorer-case");
      project.removeAttribute("data-explorer-index");
      grid.append(project);
    }

    if (explorer.isConnected) explorer.replaceWith(grid);
    explorer = null;
    entries = [];
  }

  function applyViewportMode() {
    if (desktopQuery.matches) mountExplorer();
    else unmountExplorer();
  }

  if (typeof desktopQuery.addEventListener === "function") {
    desktopQuery.addEventListener("change", applyViewportMode);
  } else if (typeof desktopQuery.addListener === "function") {
    desktopQuery.addListener(applyViewportMode);
  }

  applyViewportMode();
}
