import { initNavigation } from "./navigation.js";
import { initContactForm } from "./contact.js";
import { initProjectFilters } from "./project-filters.js";

// Progressive enhancement: the static navigation and mail link work without JS.
document.documentElement.classList.add("js");

const currentYear = document.querySelector("#current-year");
if (currentYear) currentYear.textContent = String(new Date().getFullYear());

initNavigation();
initProjectFilters();
initContactForm();
