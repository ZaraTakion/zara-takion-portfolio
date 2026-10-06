export function initProjectFilters() {
  const controls = document.querySelector("[data-project-filters]");
  if (!controls) return;

  const projects = [...document.querySelectorAll("[data-project-track]")];
  const buttons = [...controls.querySelectorAll("[data-project-filter]")];
  const status = controls.querySelector("[data-project-filter-status]");
  if (!projects.length || !buttons.length || !status) return;

  const counts = projects.reduce((result, project) => {
    const track = project.dataset.projectTrack;
    result[track] = (result[track] || 0) + 1;
    return result;
  }, {});
  counts.all = projects.length;

  for (const total of controls.querySelectorAll("[data-project-total]")) {
    total.textContent = String(counts[total.dataset.projectTotal] || 0);
  }

  function applyFilter(track) {
    const count = counts[track] || 0;
    const trackLabel = controls.dataset[`track${track[0].toUpperCase()}${track.slice(1)}`];
    const unit = track === "all"
      ? (count === 1 ? controls.dataset.countLabelSingular : controls.dataset.countLabel)
      : trackLabel;

    for (const project of projects) {
      project.hidden = track !== "all" && project.dataset.projectTrack !== track;
    }

    for (const button of buttons) {
      button.setAttribute("aria-pressed", String(button.dataset.projectFilter === track));
    }

    status.textContent = `${count} ${unit}`;
  }

  controls.addEventListener("click", (event) => {
    const button = event.target instanceof Element
      ? event.target.closest("[data-project-filter]")
      : null;
    if (!button || !controls.contains(button)) return;
    applyFilter(button.dataset.projectFilter);
  });

  applyFilter("all");
  controls.hidden = false;
}
