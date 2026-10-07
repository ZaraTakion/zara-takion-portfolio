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
  const canonicalKey = (key) => windows.has(key) ? key : aliases[key];
  const appKeyForHref = (href = "") => sectionToKey.get(href.replace(/^#/, ""));
  const mobileQuery = window.matchMedia(MOBILE_QUERY);

  let zIndex = 4;
  let bootTimer = null;
  let desktopStarted = false;

  function launcherFor(key) {
    const aliasesForKey = {
      inicio: ["inicio", "home"],
      projetos: ["projetos", "projects"],
      sobre: ["sobre", "about"],
      arquivo: ["arquivo", "archive"],
      formacao: ["formacao", "education"],
      contato: ["contato", "contact"],
    };
    return aliasesForKey[key]
      ?.map((value) => main.querySelector(`[data-app-open="${value}"]`))
      .find(Boolean) || main.querySelector("[data-app-open]");
  }

  function focusWindow(section) {
    if (!section) return;
    window.requestAnimationFrame(() => {
      section.querySelector("h1, h2")?.focus({ preventScroll: true });
    });
  }

  function removeWindowFocus(except = null) {
    for (const section of windows.values()) {
      if (section && section !== except) section.classList.remove("has-focus");
    }
  }

  function setMobileModalOpen(isOpen) {
    main.classList.toggle("mobile-app-open", isOpen);
    document.body.classList.toggle("mobile-app-modal-open", isOpen);
  }

  function closeWindow(key, section, { restoreFocus = true, updateUrl = true } = {}) {
    section.classList.remove("is-open", "is-mobile-active", "has-focus");
    if (mobileQuery.matches) setMobileModalOpen(false);

    if (updateUrl && location.hash === `#${section.id}`) {
      history.replaceState(null, "", `${location.pathname}${location.search}`);
    }

    if (restoreFocus) launcherFor(key)?.focus({ preventScroll: true });
  }

  for (const [key, section] of windows) {
    if (!section) continue;

    section.classList.add("retro-app-window");
    section.dataset.appWindow = key;
    section.tabIndex = -1;

    const heading = section.querySelector("h1, h2");
    if (heading) heading.tabIndex = -1;

    if (section.querySelector(":scope > .retro-window-titlebar")) continue;

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

    minimize.addEventListener("click", () => closeWindow(key, section));
    close.addEventListener("click", () => closeWindow(key, section));

    section.addEventListener("pointerdown", () => {
      if (mobileQuery.matches) return;
      section.style.zIndex = String(++zIndex);
      section.classList.add("has-focus");
      removeWindowFocus(section);
    });
  }

  function startDesktop(openKey = null, { focus = true } = {}) {
    if (bootTimer !== null) {
      window.clearTimeout(bootTimer);
      bootTimer = null;
    }

    bootScreen.hidden = true;
    startScreen.hidden = true;
    main.classList.add("desktop-running");
    document.body.classList.add("retro-session-active");
    desktopStarted = true;

    const initialKeys = mobileQuery.matches ? ["inicio"] : ["inicio", "projetos"];
    for (const key of initialKeys) windows.get(key)?.classList.add("is-open");

    if (openKey) {
      openApp(openKey, { focus });
      return;
    }

    if (focus) focusWindow(windows.get("inicio"));
  }

  function openApp(rawKey, { focus = true } = {}) {
    const key = canonicalKey(rawKey);
    const section = windows.get(key);
    if (!section) return;

    if (!desktopStarted) startDesktop(null, { focus: false });

    section.classList.add("is-open", "has-focus");
    section.style.zIndex = String(++zIndex);
    removeWindowFocus(section);

    if (mobileQuery.matches) {
      setMobileModalOpen(true);
      for (const other of windows.values()) {
        if (other !== section) other?.classList.remove("is-mobile-active");
      }
      section.classList.add("is-mobile-active");
    } else {
      setMobileModalOpen(false);
      for (const other of windows.values()) other?.classList.remove("is-mobile-active");
    }

    if (focus) focusWindow(section);
  }

  function navigateToApp(link) {
    const href = link.getAttribute("href") || "";
    const key = canonicalKey(link.dataset.appOpen || appKeyForHref(href));
    if (!key || !windows.has(key)) return false;

    openApp(key);
    if (href.startsWith("#") && location.hash !== href) {
      history.pushState(null, "", href);
    }
    return true;
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
    if (event.key !== "Escape" || !mobileQuery.matches || !main.classList.contains("mobile-app-open")) return;
    const active = [...windows.entries()].find(([, section]) => section?.classList.contains("is-mobile-active"));
    if (active) closeWindow(active[0], active[1]);
  });

  const updateViewportMode = () => {
    for (const section of windows.values()) {
      const close = section?.querySelector(".retro-window-close");
      close?.setAttribute("aria-label", mobileQuery.matches ? labels.closeApp : labels.close);
    }

    if (mobileQuery.matches) {
      if (!desktopStarted) return;

      const activeEntry = [...windows.entries()].find(([, section]) =>
        section?.classList.contains("is-open") && section.classList.contains("has-focus")
      ) || [...windows.entries()].find(([, section]) =>
        section?.classList.contains("is-open") && section.dataset.appWindow !== "inicio"
      );

      for (const section of windows.values()) section?.classList.remove("is-mobile-active");

      if (activeEntry && activeEntry[0] !== "inicio") {
        activeEntry[1].classList.add("is-mobile-active");
        setMobileModalOpen(true);
      } else {
        setMobileModalOpen(false);
      }
      return;
    }

    setMobileModalOpen(false);
    for (const section of windows.values()) section?.classList.remove("is-mobile-active");
  };

  if (typeof mobileQuery.addEventListener === "function") {
    mobileQuery.addEventListener("change", updateViewportMode);
  } else if (typeof mobileQuery.addListener === "function") {
    mobileQuery.addListener(updateViewportMode);
  }

  const syncWindowWithLocation = () => {
    const key = appKeyForHref(location.hash);
    if (key) {
      openApp(key, { focus: false });
      return;
    }

    if (!desktopStarted || !mobileQuery.matches) return;
    const active = [...windows.entries()].find(([, section]) => section?.classList.contains("is-mobile-active"));
    if (active) closeWindow(active[0], active[1], { restoreFocus: false, updateUrl: false });
  };

  window.addEventListener("hashchange", syncWindowWithLocation);
  window.addEventListener("popstate", syncWindowWithLocation);

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

  if (location.hash) {
    const key = appKeyForHref(location.hash);
    if (key) startDesktop(key, { focus: false });
  }
}
