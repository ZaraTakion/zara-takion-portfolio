import { initNavigation } from "./navigation.js";
import { initProjectFilters } from "./project-filters.js";
import { initRetroDesktop } from "./retro-desktop.js";
import { initProjectExplorer } from "./project-explorer.js";

// Progressive enhancement: the static navigation and mail link work without JS.
document.documentElement.classList.add("js");

const currentYear = document.querySelector("#current-year");
if (currentYear) currentYear.textContent = String(new Date().getFullYear());

initNavigation();
initProjectFilters();
initProjectExplorer();
initRetroDesktop();
