const DESKTOP_QUERY = "(min-width: 1200px)";

export function initRetroDesktop() {
  const main = document.querySelector(".retro-desktop-stage");
  const startScreen = main?.querySelector(".startup-screen");
  const bootScreen = main?.querySelector(".boot-screen");
  if (!main || !startScreen || !bootScreen) return;

  const desktopQuery = window.matchMedia(DESKTOP_QUERY);
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
  } : {
    home: "bem-vindo.exe",
    projects: "projetos/",
    about: "digital_me.exe",
    archive: "arquivo/",
    education: "formacao.sys",
    contact: "connect.exe",
    minimize: "Minimizar janela",
    close: "Fechar janela",
  };

  const windows = new Map([
    ["inicio", main.querySelector("#inicio") || main.querySelector("#home")],
    ["projetos", main.querySelector("#projetos") || main.querySelector("#projects")],
    ["sobre", main.querySelector("#sobre") || main.querySelector("#about")],
    ["arquivo", main.querySelector("#arquivo") || main.querySelector("#archive")],
    ["formacao", main.querySelector("#formacao") || main.querySelector("#education")],
    ["contato", main.querySelector("#contato") || main.querySelector("#contact")],
  ]);
  const aliases = {
    home: "inicio",
    projects: "projetos",
    about: "sobre",
    archive: "arquivo",
    education: "formacao",
    contact: "contato",
  };
  const sectionToKey = new Map(
    [...windows.entries()]
      .filter(([, section]) => section)
      .map(([key, section]) => [section.id, key]),
  );

  let zIndex = 10;
  let bootTimer = null;
  let desktopStarted = false;

  const canonicalKey = (key) => windows.has(key) ? key : aliases[key];
  const appKeyForHref = (href = "") => sectionToKey.get(href.replace(/^#/, ""));
  const desktopActive = () => desktopQuery.matches && main.classList.contains("retro-enhanced");

  function launcherFor(key) {
    const values = {
      inicio: ["inicio", "home"],
      projetos: ["projetos", "projects"],
      sobre: ["sobre", "about"],
      arquivo: ["arquivo", "archive"],
      formacao: ["formacao", "education"],
      contato: ["contato", "contact"],
    }[key] || [];

    return values
      .map((value) => main.querySelector(`[data-app-open="${value}"]`))
      .find(Boolean) || null;
  }

  function focusWindow(section) {
    if (!section || !desktopActive()) return;
    window.requestAnimationFrame(() => {
      section.querySelector("h1, h2")?.focus({ preventScroll: true });
    });
  }

  function removeWindowFocus(except = null) {
    for (const section of windows.values()) {
      if (section && section !== except) section.classList.remove("has-focus");
    }
  }

  function clearSectionHash(section) {
    if (!section || location.hash !== `#${section.id}`) return;
    history.replaceState(null, "", `${location.pathname}${location.search}`);
  }

  function closeWindow(key, section, { restoreFocus = true, updateUrl = true } = {}) {
    section.classList.remove("is-open", "has-focus");
    if (updateUrl) clearSectionHash(section);
    if (restoreFocus && desktopActive()) launcherFor(key)?.focus({ preventScroll: true });
  }

  function createWindowChrome(key, section) {
    if (section.querySelector(":scope > .retro-window-titlebar")) return;

    section.classList.add("retro-app-window");
    section.dataset.appWindow = key;
    section.tabIndex = -1;

    const heading = section.querySelector("h1, h2");
    if (heading) heading.tabIndex = -1;

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
    close.setAttribute("aria-label", labels.close);
    close.textContent = "×";

    controls.append(minimize, close);
    titlebar.append(title, controls);
    section.insertBefore(titlebar, section.firstChild);

    minimize.addEventListener("click", () => closeWindow(key, section));
    close.addEventListener("click", () => closeWindow(key, section));

    section.addEventListener("pointerdown", () => {
      if (!desktopActive()) return;
      section.style.zIndex = String(++zIndex);
      section.classList.add("has-focus");
      removeWindowFocus(section);
    });
  }

  for (const [key, section] of windows) {
    if (section) createWindowChrome(key, section);
  }

  function openApp(rawKey, { focus = true } = {}) {
    if (!desktopActive()) return false;

    const key = canonicalKey(rawKey);
    const section = windows.get(key);
    if (!section) return false;

    if (!desktopStarted) startDesktop(null, { focus: false });

    section.classList.add("is-open", "has-focus");
    section.style.zIndex = String(++zIndex);
    removeWindowFocus(section);
    if (focus) focusWindow(section);
    return true;
  }

  function startDesktop(openKey = null, { focus = true } = {}) {
    if (!desktopActive()) return;

    if (bootTimer !== null) {
      window.clearTimeout(bootTimer);
      bootTimer = null;
    }

    bootScreen.hidden = true;
    startScreen.hidden = true;
    main.classList.add("desktop-running");
    document.body.classList.add("retro-session-active");
    desktopStarted = true;

    windows.get("inicio")?.classList.add("is-open");
    windows.get("projetos")?.classList.add("is-open");

    if (openKey && openApp(openKey, { focus })) return;
    if (focus) focusWindow(windows.get("inicio"));
  }

  function navigateToApp(link) {
    if (!desktopActive()) return false;

    const href = link.getAttribute("href") || "";
    const key = canonicalKey(link.dataset.appOpen || appKeyForHref(href));
    if (!key || !windows.has(key)) return false;

    openApp(key);
    if (href.startsWith("#") && location.hash !== href) history.pushState(null, "", href);
    return true;
  }

  function startBoot() {
    if (!desktopActive()) return;
    startScreen.hidden = true;
    bootScreen.hidden = false;
    bootScreen.querySelector("[data-boot-skip]")?.focus();

    const wait = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 150 : 900;
    bootTimer = window.setTimeout(() => startDesktop(), wait);
  }

  function syncLocationToDesktop() {
    if (!desktopActive()) return;
    const key = appKeyForHref(location.hash);
    if (key) openApp(key, { focus: false });
  }

  function applyViewportMode() {
    if (desktopQuery.matches) {
      main.classList.add("retro-enhanced");
      if (desktopStarted) document.body.classList.add("retro-session-active");
      if (location.hash) {
        const key = appKeyForHref(location.hash);
        if (key) {
          if (!desktopStarted) startDesktop(key, { focus: false });
          else openApp(key, { focus: false });
        }
      }
      return;
    }

    if (bootTimer !== null) {
      window.clearTimeout(bootTimer);
      bootTimer = null;
    }

    main.classList.remove("retro-enhanced");
    document.body.classList.remove("retro-session-active");
  }

  main.querySelector("[data-desktop-start]")?.addEventListener("click", () => startDesktop());
  main.querySelector("[data-desktop-boot]")?.addEventListener("click", startBoot);
  main.querySelector("[data-boot-skip]")?.addEventListener("click", () => startDesktop());

  main.addEventListener("click", (event) => {
    const link = event.target instanceof Element
      ? event.target.closest("a[data-app-open], a[href^='#']")
      : null;
    if (!link || !main.contains(link)) return;
    if (navigateToApp(link)) event.preventDefault();
  });

  document.querySelector("#main-nav")?.addEventListener("click", (event) => {
    const link = event.target instanceof Element ? event.target.closest("a[href^='#']") : null;
    if (!link) return;
    if (navigateToApp(link)) event.preventDefault();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !desktopActive()) return;
    const focused = [...windows.entries()].find(([, section]) => section?.classList.contains("has-focus"));
    if (focused) closeWindow(focused[0], focused[1]);
  });

  window.addEventListener("hashchange", syncLocationToDesktop);
  window.addEventListener("popstate", syncLocationToDesktop);

  if (typeof desktopQuery.addEventListener === "function") {
    desktopQuery.addEventListener("change", applyViewportMode);
  } else if (typeof desktopQuery.addListener === "function") {
    desktopQuery.addListener(applyViewportMode);
  }

  const clock = main.querySelector("[data-system-clock]");
  const updateClock = () => {
    if (!clock) return;
    clock.textContent = new Intl.DateTimeFormat(isEnglish ? "en-US" : "pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: isEnglish,
    }).format(new Date());
  };
  updateClock();
  window.setInterval(updateClock, 60_000);

  applyViewportMode();
}
