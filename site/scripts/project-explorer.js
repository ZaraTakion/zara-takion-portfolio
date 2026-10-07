const MOBILE_QUERY = "(max-width: 800px)";

export function initProjectExplorer() {
  const grid = document.querySelector(".featured-project-grid");
  const projects = grid ? [...grid.querySelectorAll(".project-card")] : [];
  if (!grid || projects.length < 2) return;

  const isEnglish = document.documentElement.lang.toLowerCase().startsWith("en");
  const mobileQuery = window.matchMedia(MOBILE_QUERY);
  const list = document.createElement("div");
  list.className = "project-explorer-list";
  list.setAttribute("role", "tablist");
  list.setAttribute("aria-label", isEnglish ? "Featured project folders" : "Pastas de projetos em destaque");

  const panels = document.createElement("div");
  panels.className = "project-explorer-panels";

  const entries = projects.map((project, index) => {
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
    tab.setAttribute("aria-selected", String(index === 0));
    tab.tabIndex = index === 0 ? 0 : -1;
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
    panel.hidden = index !== 0;

    project.dataset.explorerIndex = String(index);
    project.classList.add("project-explorer-case");
    panel.append(project);
    list.append(tab);
    panels.append(panel);
    return { tab, panel, project };
  });

  const explorer = document.createElement("div");
  explorer.className = "project-explorer";
  explorer.append(list, panels);
  grid.replaceWith(explorer);

  function visibleEntries() {
    return entries.filter((entry) => !entry.project.hidden && !entry.tab.hidden);
  }

  function selectEntry(entry, { focus = false } = {}) {
    for (const current of entries) {
      const selected = current === entry;
      current.tab.setAttribute("aria-selected", String(selected));
      current.tab.tabIndex = selected ? 0 : -1;
      current.panel.hidden = !selected;
    }
    if (focus) entry.tab.focus();
  }

  function updateOrientation() {
    list.setAttribute("aria-orientation", mobileQuery.matches ? "horizontal" : "vertical");
  }

  list.addEventListener("click", (event) => {
    const tab = event.target instanceof Element ? event.target.closest('[role="tab"]') : null;
    const entry = entries.find((candidate) => candidate.tab === tab);
    if (entry && !entry.tab.hidden) selectEntry(entry);
  });

  list.addEventListener("keydown", (event) => {
    const tab = event.target instanceof Element ? event.target.closest('[role="tab"]') : null;
    const available = visibleEntries();
    const currentIndex = available.findIndex((entry) => entry.tab === tab);
    if (currentIndex < 0) return;

    const previousKey = mobileQuery.matches ? "ArrowLeft" : "ArrowUp";
    const nextKey = mobileQuery.matches ? "ArrowRight" : "ArrowDown";
    if (![previousKey, nextKey, "Home", "End"].includes(event.key)) return;

    event.preventDefault();
    const nextIndex = event.key === "Home"
      ? 0
      : event.key === "End"
        ? available.length - 1
        : (currentIndex + (event.key === nextKey ? 1 : available.length - 1)) % available.length;
    selectEntry(available[nextIndex], { focus: true });
  });

  const filters = document.querySelector("[data-project-filters]");
  filters?.addEventListener("click", () => {
    window.requestAnimationFrame(() => {
      for (const entry of entries) entry.tab.hidden = entry.project.hidden;
      const visible = visibleEntries();
      const active = entries.find((entry) => !entry.panel.hidden);
      if (visible.length && !visible.includes(active)) selectEntry(visible[0]);
    });
  });

  updateOrientation();
  if (typeof mobileQuery.addEventListener === "function") {
    mobileQuery.addEventListener("change", updateOrientation);
  } else if (typeof mobileQuery.addListener === "function") {
    mobileQuery.addListener(updateOrientation);
  }
}
