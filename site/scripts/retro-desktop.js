const MOBILE_QUERY = "(max-width: 800px)";

export function initRetroDesktop() {
  const main = document.querySelector(".retro-desktop-stage");
  const startScreen = main?.querySelector(".startup-screen");
  const bootScreen = main?.querySelector(".boot-screen");
  if (!main || !startScreen || !bootScreen) return;

  const isEnglish = document.documentElement.lang.toLowerCase().startsWith("en");
  const labels = isEnglish ? {
    home: "welcome.exe",
    projects: "projects/",
    about: "digital_me.exe",
    archive: "archive/",
    education: "education.sys",
    contact: "connect.exe",
    minimize: "Minimize window",
    close: "Close window",
    closeApp: "Close app",
    returnHome: "Return to desktop",
  } : {
    home: "bem-vindo.exe",
    projects: "projetos/",
    about: "digital_me.exe",
    archive: "arquivo/",
    education: "formacao.sys",
    contact: "connect.exe",
    minimize: "Minimizar janela",
    close: "Fechar janela",
    closeApp: "Fechar aplicativo",
    returnHome: "Voltar ao desktop",
  };

  const windows = new Map([
    ["inicio", main.querySelector("#inicio") || main.querySelector("#home")],
    ["projetos", main.querySelector("#projetos") || main.querySelector("#projects")],
    ["sobre", main.querySelector("#sobre") || main.querySelector("#about")],
    ["arquivo", main.querySelector("#arquivo") || main.querySelector("#archive")],
    ["formacao", main.querySelector("#formacao") || main.querySelector("#education")],
    ["contato", main.querySelector("#contato") || main.querySelector("#contact")],
  ]);
  const sectionToKey = new Map([...windows.entries()].filter(([, section]) => section).map(([key, section]) => [section.id, key]));
  const appKeyForHref = (href) => sectionToKey.get(href.replace(/^#/, ""));
  const aliases = { home: "inicio", projects: "projetos", about: "sobre", archive: "arquivo", education: "formacao", contact: "contato" };
  const canonicalKey = (key) => windows.has(key) ? key : aliases[key];
  const mobileQuery = window.matchMedia(MOBILE_QUERY);
  let zIndex = 4;
  let bootTimer;
  let desktopStarted = false;

  for (const [key, section] of windows) {
    if (!section) continue;
    section.classList.add("retro-app-window");
    section.dataset.appWindow = key;
    const heading = section.querySelector("h1, h2");
    const titlebar = document.createElement("div");
    titlebar.className = "retro-window-titlebar";
    const title = document.createElement("span");
    title.className = "retro-window-title";
    title.textContent = labels[key] || key;
    const controls = document.createElement("span");
    controls.className = "retro-window-controls";
    const minimize = document.createElement("button");
    minimize.type = "button";
    minimize.className = "retro-window-minimize";
    minimize.setAttribute("aria-label", labels.minimize);
    minimize.textContent = "−";
    const close = document.createElement("button");
    close.type = "button";
    close.className = "retro-window-close";
    close.setAttribute("aria-label", mobileQuery.matches ? labels.closeApp : labels.close);
    close.textContent = "×";
    controls.append(minimize, close);
    titlebar.append(title, controls);
    section.insertBefore(titlebar, section.firstChild);
    section.tabIndex = -1;

    const minimizeWindow = () => {
      section.classList.remove("is-open", "is-mobile-active");
      main.classList.remove("mobile-app-open");
      if (section.classList.contains("has-focus")) {
        section.classList.remove("has-focus");
        main.querySelector('[data-app-open="projetos"], [data-app-open="projects"]')?.focus();
      }
    };
    minimize.addEventListener("click", minimizeWindow);
    close.addEventListener("click", minimizeWindow);
    section.addEventListener("pointerdown", () => {
      if (mobileQuery.matches) return;
      section.style.zIndex = String(++zIndex);
      section.classList.add("has-focus");
      for (const other of windows.values()) {
        if (other !== section) other?.classList.remove("has-focus");
      }
    });
    if (heading) heading.setAttribute("tabindex", "-1");
  }

  function startDesktop(openKey) {
    if (bootTimer) window.clearTimeout(bootTimer);
    bootScreen.hidden = true;
    startScreen.hidden = true;
    main.classList.add("desktop-running");
    document.body.classList.add("retro-session-active");
    desktopStarted = true;
    const initial = mobileQuery.matches ? ["inicio"] : ["inicio", "projetos"];
    for (const key of initial) windows.get(key)?.classList.add("is-open");
    if (openKey && windows.has(openKey)) openApp(openKey, { focus: true });
    else windows.get("inicio")?.querySelector("h1")?.focus({ preventScroll: true });
  }

  function openApp(key, options = {}) {
    key = canonicalKey(key);
    const section = windows.get(key);
    if (!section) return;
    if (!desktopStarted) startDesktop();
    section.classList.add("is-open", "has-focus");
    section.style.zIndex = String(++zIndex);
    for (const other of windows.values()) {
      if (other !== section) other?.classList.remove("has-focus", "is-mobile-active");
    }
    if (mobileQuery.matches) {
      main.classList.add("mobile-app-open");
      section.classList.add("is-mobile-active");
    } else {
      main.classList.remove("mobile-app-open");
    }
    if (options.focus !== false) {
      requestAnimationFrame(() => section.querySelector("h1, h2")?.focus({ preventScroll: true }));
    }
  }

  function startBoot() {
    startScreen.hidden = true;
    bootScreen.hidden = false;
    bootScreen.querySelector("[data-boot-skip]")?.focus();
    const wait = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 350 : 1800;
    bootTimer = window.setTimeout(() => startDesktop(), wait);
  }

  main.classList.add("retro-enhanced");
  main.querySelector("[data-desktop-start]")?.addEventListener("click", () => startDesktop());
  main.querySelector("[data-desktop-boot]")?.addEventListener("click", startBoot);
  main.querySelector("[data-boot-skip]")?.addEventListener("click", () => startDesktop());

  main.addEventListener("click", (event) => {
    const launcher = event.target instanceof Element ? event.target.closest("[data-app-open]") : null;
    if (!launcher) return;
    const key = canonicalKey(launcher.dataset.appOpen);
    if (!windows.has(key)) return;
    event.preventDefault();
    openApp(key);
    if (location.hash !== launcher.getAttribute("href")) history.replaceState(null, "", launcher.getAttribute("href"));
  });

  document.querySelector("#main-nav")?.addEventListener("click", (event) => {
    const link = event.target instanceof Element ? event.target.closest("a[href^='#']") : null;
    const key = link ? appKeyForHref(link.getAttribute("href")) : null;
    if (!key || !windows.has(key)) return;
    event.preventDefault();
    openApp(key);
    if (location.hash !== link.getAttribute("href")) history.replaceState(null, "", link.getAttribute("href"));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !mobileQuery.matches || !main.classList.contains("mobile-app-open")) return;
    main.classList.remove("mobile-app-open");
    for (const section of windows.values()) section?.classList.remove("is-mobile-active", "has-focus");
    main.querySelector("[data-app-open]")?.focus();
  });

  const updateCloseLabels = () => {
    for (const section of windows.values()) {
      const close = section?.querySelector(".retro-window-close");
      close?.setAttribute("aria-label", mobileQuery.matches ? labels.closeApp : labels.close);
    }
    if (!mobileQuery.matches) main.classList.remove("mobile-app-open");
  };
  mobileQuery.addEventListener?.("change", updateCloseLabels);

  const clock = main.querySelector("[data-system-clock]");
  const updateClock = () => {
    if (clock) clock.textContent = new Intl.DateTimeFormat(isEnglish ? "en-US" : "pt-BR", {
      hour: "2-digit", minute: "2-digit", hour12: isEnglish,
    }).format(new Date());
  };
  updateClock();
  window.setInterval(updateClock, 60_000);

  if (location.hash) {
    const key = appKeyForHref(location.hash);
    if (key) startDesktop(key);
  }
}
