export function initNavigation() {
  const menuButton = document.querySelector(".menu-toggle");
  const mainNav = document.querySelector("#main-nav");
  if (!menuButton || !mainNav) return;

  const isEnglishPage = document.documentElement.lang.toLowerCase().startsWith("en");
  const menuText = {
    open: isEnglishPage ? "Open menu" : "Abrir menu",
    close: isEnglishPage ? "Close menu" : "Fechar menu",
  };

  function setMenuOpen(isOpen, restoreFocus = false) {
    menuButton.setAttribute("aria-expanded", String(isOpen));
    menuButton.setAttribute("aria-label", isOpen ? menuText.close : menuText.open);
    mainNav.classList.toggle("is-open", isOpen);
    if (restoreFocus) menuButton.focus();
  }

  menuButton.addEventListener("click", () => {
    setMenuOpen(menuButton.getAttribute("aria-expanded") !== "true");
  });

  mainNav.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("a")) setMenuOpen(false);
  });

  document.addEventListener("pointerdown", (event) => {
    const isOpen = menuButton.getAttribute("aria-expanded") === "true";
    if (isOpen && !menuButton.contains(event.target) && !mainNav.contains(event.target)) {
      setMenuOpen(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") {
      setMenuOpen(false, true);
    }
  });

  // Keep the interaction and CSS breakpoints in sync.
  const desktopViewport = window.matchMedia("(min-width: 801px)");
  const closeMenuOnDesktop = (event) => {
    if (event.matches) setMenuOpen(false);
  };
  if (typeof desktopViewport.addEventListener === "function") {
    desktopViewport.addEventListener("change", closeMenuOnDesktop);
  } else {
    desktopViewport.addListener(closeMenuOnDesktop);
  }
}
