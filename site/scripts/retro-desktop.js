const DESKTOP_QUERY = "(min-width: 1200px)";

export function initRetroDesktop() {
  const main = document.querySelector(".retro-desktop-stage");
  const startScreen = main?.querySelector(".startup-screen");
  const bootScreen = main?.querySelector(".boot-screen");
  if (!main || !startScreen || !bootScreen) return;

  document.body.classList.add("aqua-portfolio");

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
    maximize: "Maximize window",
    restore: "Restore window",
    close: "Close window",
    desktop: "desktop",
  } : {
    home: "bem-vindo.exe",
    projects: "projetos/",
    about: "digital_me.exe",
    archive: "arquivo/",
    education: "formacao.sys",
    contact: "connect.exe",
    minimize: "Minimizar janela",
    maximize: "Maximizar janela",
    restore: "Restaurar janela",
    close: "Fechar janela",
    desktop: "desktop",
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

  let bootTimer = null;
  let desktopStarted = false;
  let activeKey = null;
  let zCounter = 100;
  const openWindows = new Set();
  const launchedWindows = new Set();
  const tray = document.createElement("nav");
  tray.className = "desktop-task-tray";
  tray.setAttribute("aria-label", isEnglish ? "Open applications" : "Aplicativos abertos");
  main.querySelector(".desktop-statusbar-app")?.after(tray);

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

  function statusLabelFor(key) {
    const map = {
      inicio: labels.home,
      projetos: labels.projects,
      sobre: labels.about,
      arquivo: labels.archive,
      formacao: labels.education,
      contato: labels.contact,
    };
    return map[key] || labels.desktop;
  }

  function updateWorkspaceStatus(key = null) {
    const status = main.querySelector("[data-active-app]");
    if (status) status.textContent = key ? statusLabelFor(key) : labels.desktop;

    for (const launcher of main.querySelectorAll("[data-app-open]")) {
      const launcherKey = canonicalKey(launcher.dataset.appOpen);
      if (key && launcherKey === key) launcher.setAttribute("aria-current", "page");
      else launcher.removeAttribute("aria-current");
    }
  }

  function renderTaskTray() {
    tray.replaceChildren();
    for (const key of launchedWindows) {
      if (!windows.get(key)) continue;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "desktop-task-button";
      button.textContent = statusLabelFor(key);
      const opened = openWindows.has(key);
      button.classList.toggle("is-minimized", !opened);
      button.classList.toggle("is-current", opened && activeKey === key);
      button.setAttribute("aria-pressed", String(opened && activeKey === key));
      button.setAttribute("aria-label", (isEnglish ? "Switch to " : "Alternar para ") + statusLabelFor(key));
      button.addEventListener("click", () => setActiveWindow(key));
      tray.append(button);
    }
  }

  function focusWindow(section) {
    if (!section || !desktopActive()) return;
    window.requestAnimationFrame(() => section.querySelector("h1, h2")?.focus({ preventScroll: true }));
  }

  function setActiveWindow(key, { focus = true } = {}) {
    const section = windows.get(key);
    if (!section || !desktopActive()) return false;
    openWindows.add(key);
    launchedWindows.add(key);
    section.classList.add("is-open");
    for (const [, current] of windows) {
      current?.classList.toggle("has-focus", current === section);
    }
    activeKey = key;
    section.style.zIndex = String(++zCounter);
    updateWorkspaceStatus(key);
    renderTaskTray();
    if (focus) focusWindow(section);
    return true;
  }

  function clearSectionHash(section) {
    if (!section || location.hash !== "#" + section.id) return;
    history.replaceState(null, "", location.pathname + location.search);
  }

  function activateLastWindow() {
    const last = [...openWindows].sort((a, b) =>
      Number(windows.get(b)?.style.zIndex || 0) - Number(windows.get(a)?.style.zIndex || 0))[0];
    if (last) setActiveWindow(last, { focus: false });
    else {
      activeKey = null;
      updateWorkspaceStatus(null);
      renderTaskTray();
    }
  }

  function minimizeWindow(key, section) {
    openWindows.delete(key);
    section.classList.remove("is-open", "has-focus");
    if (activeKey === key) activateLastWindow();
    else renderTaskTray();
    launcherFor(key)?.focus({ preventScroll: true });
  }

  function closeWindow(key, section) {
    clearSectionHash(section);
    openWindows.delete(key);
    launchedWindows.delete(key);
    section.classList.remove("is-open", "has-focus", "is-maximized");
    section.style.left = "";
    section.style.top = "";
    section.style.transform = "";
    section.style.zIndex = "";
    if (activeKey === key) activateLastWindow();
    else renderTaskTray();
    launcherFor(key)?.focus({ preventScroll: true });
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

    const identity = document.createElement("span");
    identity.className = "retro-window-identity";
    identity.setAttribute("aria-hidden", "true");
    identity.textContent = "ZT";

    const title = document.createElement("span");
    title.className = "retro-window-title";
    title.textContent = statusLabelFor(key);

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
    titlebar.append(identity, title, controls);
    section.insertBefore(titlebar, section.firstChild);

    minimize.addEventListener("click", () => minimizeWindow(key, section));
    close.addEventListener("click", () => closeWindow(key, section));
  }

  for (const [key, section] of windows) {
    if (section) createWindowChrome(key, section);
  }

  function openApp(rawKey, { focus = true } = {}) {
    if (!desktopActive()) return false;

    const key = canonicalKey(rawKey);
    if (!key || !windows.get(key)) return false;

    if (!desktopStarted) startDesktop(key, { focus });
    else setActiveWindow(key, { focus });

    return true;
  }

  function startDesktop(openKey = "inicio", { focus = true } = {}) {
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

    setActiveWindow(canonicalKey(openKey) || "inicio", { focus });
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

    const wait = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 120 : 820;
    bootTimer = window.setTimeout(() => startDesktop(), wait);
  }

  function syncLocationToDesktop() {
    if (!desktopActive()) return;
    const key = appKeyForHref(location.hash);
    if (key) {
      openApp(key, { focus: false });
      return;
    }
    if (desktopStarted) setActiveWindow("inicio", { focus: false });
  }

  function applyViewportMode() {
    if (desktopQuery.matches) {
      main.classList.add("retro-enhanced");
      if (desktopStarted) {
        document.body.classList.add("retro-session-active");
        setActiveWindow(activeKey, { focus: false });
      }

      const key = appKeyForHref(location.hash);
      if (key) {
        if (!desktopStarted) startDesktop(key, { focus: false });
        else setActiveWindow(key, { focus: false });
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
    if (event.key !== "Escape" || !desktopActive() || !desktopStarted) return;
    const section = windows.get(activeKey);
    if (section) closeWindow(activeKey, section);
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

  updateWorkspaceStatus("inicio");
  applyViewportMode();
}
