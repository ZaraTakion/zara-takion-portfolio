import { useEffect, useRef, useState } from "react";
import { cvPath, labels, type Locale } from "../content";
export function Header({ locale }: { locale: Locale }) {
  const t = labels[locale],
    pt = locale === "pt";
  const [open, setOpen] = useState(false),
    [theme, setTheme] = useState<"dark" | "light">("dark");
  const [manualReduced, setManualReduced] = useState(false),
    [systemReduced, setSystemReduced] = useState(false);
  const reduced = manualReduced || systemReduced;
  const toggleRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    try {
      const v = localStorage.getItem("obsidiana-theme");
      if (v === "dark" || v === "light") setTheme(v);
      setManualReduced(localStorage.getItem("obsidiana-motion") === "reduced");
    } catch {}
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setSystemReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  useEffect(() => {
    document.documentElement.dataset.motion = reduced ? "reduced" : "full";
  }, [reduced]);
  function changeTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      localStorage.setItem("obsidiana-theme", next);
    } catch {}
  }
  function changeMotion() {
    setManualReduced(!manualReduced);
    try {
      localStorage.setItem(
        "obsidiana-motion",
        !manualReduced ? "reduced" : "full",
      );
    } catch {}
  }
  return (
    <>
      <a href="#main" className="skip-link">
        {t.skip}
      </a>
      <header
        className="site-header"
        onKeyDown={(e) => {
          if (e.key === "Escape" && open) {
            setOpen(false);
            toggleRef.current?.focus();
          }
        }}
      >
        <a
          className="brand"
          href={pt ? "/" : "/en/"}
          aria-label="Rodrigo Pinheiro — Back-End Python"
        >
          <span className="brand-mark" aria-hidden="true">
            r<span>p</span>
          </span>
          <span>
            RODRIGO PINHEIRO<small>BACK-END PYTHON</small>
          </span>
        </a>
        <a
          className="language"
          href={pt ? "/en/" : "/"}
          hrefLang={pt ? "en" : "pt-BR"}
          lang={pt ? "en" : "pt-BR"}
          aria-label={pt ? "Read in English" : "Ler em português"}
        >
          {pt ? "EN" : "PT"}
        </a>
        <button
          ref={toggleRef}
          className="menu-toggle"
          aria-expanded={open}
          aria-controls="header-panel"
          onClick={() => setOpen(!open)}
        >
          {t.menu} <span aria-hidden="true">{open ? "−" : "+"}</span>
        </button>
        <div
          id="header-panel"
          className={`header-panel ${open ? "is-open" : ""}`}
        >
          <nav
            id="primary-navigation"
            className="navigation"
            aria-label={pt ? "Navegação principal" : "Main navigation"}
          >
            {[
              ["#projects", t.projects],
              ["#about", t.about],
              ["#contact", t.contact],
            ].map(([url, label]) => (
              <a key={url} href={url} onClick={() => {
                setOpen(false);
                const target = document.querySelector<HTMLElement>(url);
                if (target) {
                  target.tabIndex = -1;
                  target.focus();
                }
              }}>
                {label}
              </a>
            ))}
            <a href={cvPath(locale, "pdf")} download>
              {t.resume} ↓
            </a>
          </nav>
          <div
            className="preferences"
            role="group"
            aria-label={pt ? "Preferências de leitura" : "Reading preferences"}
          >
            <span className="preferences-caption eyebrow">
              {pt ? "Preferências" : "Preferences"}
            </span>
            <button
              className="theme-toggle"
              onClick={changeTheme}
              aria-label={theme === "dark" ? t.light : t.dark}
            >
              <span aria-hidden="true">{theme === "dark" ? "☼" : "◐"}</span>
              <span className="preference-label">
                {theme === "dark" ? t.light : t.dark}
              </span>
            </button>
            <button
              className="motion-toggle"
              disabled={systemReduced}
              onClick={changeMotion}
              aria-pressed={reduced}
              aria-label={t.motion}
              title={
                systemReduced
                  ? pt
                    ? "Redução exigida pelo sistema"
                    : "Reduced by system preference"
                  : t.motion
              }
            >
              <span aria-hidden="true">{reduced ? "Ⅱ" : "≈"}</span>
              <span className="preference-label">
                {systemReduced
                  ? pt
                    ? "Redução pelo sistema"
                    : "Reduced by system"
                  : reduced
                    ? t.motionOn
                    : t.motion}
              </span>
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
