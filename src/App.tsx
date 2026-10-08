import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent } from "react";
import { appKeys, tracks, translate } from "./copy";
import { filterProjects, keyFromHash, projectText, slugFor } from "./model";
import type { Locale, Project, ProjectTrack, SectionKey } from "./types";

const GITHUB = "https://github.com/ZaraTakion";
const LINKEDIN = "https://www.linkedin.com/in/rodrigo-pinheiro-94aa74358/";
const EMAIL = "rm20022101@gmail.com";
const DESKTOP_QUERY = "(min-width: 1200px)";
const extraIds: Record<SectionKey, string> = {
  home: "home", projects: "projects", about: "about", archive: "archive",
  education: "education", contact: "contact", terminal: "terminal",
};

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = () => setMatches(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  useEffect(() => {
    const controller = new AbortController();
    fetch("/data/projects.json", { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error("Projects data unavailable");
        const data: unknown = await response.json();
        if (!Array.isArray(data) || !data.length || !data.every(p => p && typeof p === "object" && typeof p.title === "string" && typeof p.url === "string")) {
          throw new Error("Invalid projects data");
        }
        return data as Project[];
      })
      .then(data => { setProjects(data); setState("ready"); })
      .catch(error => { if (error instanceof Error && error.name === "AbortError") return; setState("error"); });
    return () => controller.abort();
  }, []);
  return { projects, state };
}

function useClock(locale: Locale) {
  const format = useCallback(() => new Intl.DateTimeFormat(locale === "pt" ? "pt-BR" : "en-US", {
    hour: "2-digit", minute: "2-digit", hour12: locale === "en",
  }).format(new Date()), [locale]);
  const [time, setTime] = useState(format);
  useEffect(() => {
    setTime(format());
    const timer = window.setInterval(() => setTime(format()), 60_000);
    return () => window.clearInterval(timer);
  }, [format]);
  return time;
}

function Heading({ index, path, title, description }: { index: string; path: string; title: string; description: string }) {
  return <div className="section-heading aqua-section-heading">
    <div><p className="section-kicker"><span>{index}</span> {path}</p><h2>{title}<span className="heading-period">.</span></h2></div>
    <p className="section-intro">{description}</p>
  </div>;
}

function ProjectCard({ project, locale, featured = false }: { project: Project; locale: Locale; featured?: boolean }) {
  const t = translate(locale);
  const data = projectText(project, locale);
  const caseStudy = data.caseStudy;
  return <article className={`project-card ${featured ? "featured" : "aqua-archive-card"}`} data-project-track={project.track}>
    <div className="project-visual">
      <img src={project.image} alt={data.alt} width={960} height={600} loading="lazy" decoding="async" />
      <span className="aqua-visual-note">{data.note}</span>
    </div>
    <div className="project-copy">
      <p className="project-category">{data.category}{project.period ? <span> · {locale === "pt" ? project.period : project.period_en}</span> : null}</p>
      <h3>{data.title}</h3>
      <p className="project-description">{data.description}</p>
      {caseStudy && <details className="aqua-case-details">
        <summary>{t.caseStudy} <span aria-hidden="true">↗</span></summary>
        <dl className="project-case-study">
          <div><dt>{t.problem}</dt><dd>{caseStudy.problem}</dd></div>
          <div><dt>{t.approach}</dt><dd>{caseStudy.approach}</dd></div>
          {caseStudy.details?.architecture && <div><dt>{t.architecture}</dt><dd>{caseStudy.details.architecture}</dd></div>}
          {caseStudy.details?.verification && <div><dt>{t.verification}</dt><dd>{caseStudy.details.verification}</dd></div>}
          {caseStudy.details?.boundary && <div><dt>{t.boundary}</dt><dd>{caseStudy.details.boundary}</dd></div>}
        </dl>
      </details>}
      {data.highlights.length > 0 && <ul className="aqua-highlights">{data.highlights.map(item => <li key={item}>{item}</li>)}</ul>}
      <ul className="project-tags" aria-label={t.technology}>{project.technologies.map(tech => <li key={tech}>{tech}</li>)}</ul>
      <div className="project-links">
        {project.demo_url && <a href={project.demo_url} target="_blank" rel="noopener noreferrer">{t.demo} ↗</a>}
        <a href={project.url} target="_blank" rel="noopener noreferrer">{t.repository} ↗</a>
      </div>
    </div>
  </article>;
}

function ProjectExplorer({ projects, locale }: { projects: Project[]; locale: Locale }) {
  const t = translate(locale);
  const [selected, setSelected] = useState(0);
  const safeIndex = Math.min(selected, Math.max(0, projects.length - 1));
  const selectedProject = projects[safeIndex];
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  useEffect(() => { if (selected >= projects.length) setSelected(0); }, [projects.length, selected]);
  const keyDown = (event: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
    let next: number;
    if (event.key === "ArrowDown" || event.key === "ArrowRight") next = (index + 1) % projects.length;
    else if (event.key === "ArrowUp" || event.key === "ArrowLeft") next = (index - 1 + projects.length) % projects.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = projects.length - 1;
    else return;
    event.preventDefault(); setSelected(next); tabsRef.current[next]?.focus();
  };
  if (!selectedProject) return <p>{t.noProjects}</p>;
  return <div className="project-explorer aqua-react-explorer">
    <div className="project-explorer-toolbar">
      <span className="project-explorer-path">▣ ZARA_DISK / PROJECTS /</span>
      <span className="project-explorer-active">{projectText(selectedProject, locale).title}</span>
      <span className="project-explorer-count">{projects.length} {t.folders}</span>
    </div>
    <div className="project-explorer-body">
      <div className="project-explorer-list" role="tablist" aria-orientation="vertical" aria-label={t.selectProject}>
        {projects.map((project, i) => {
          const data = projectText(project, locale);
          return <button key={project.url} ref={el => { tabsRef.current[i] = el; }} type="button"
            className="project-explorer-item" role="tab" id={`aqua-tab-${i}`}
            aria-selected={i === safeIndex} aria-controls={`aqua-panel-${i}`}
            tabIndex={i === safeIndex ? 0 : -1} onClick={() => setSelected(i)}
            onKeyDown={event => keyDown(event, i)}>
            <span className="folder-icon" aria-hidden="true" />
            <span className="project-explorer-item-copy"><strong>{data.title}</strong><small>{data.category}</small><em>{project.technologies.slice(0,3).join(" · ")}</em></span>
          </button>;
        })}
      </div>
      <div className="project-explorer-panels">
        <div className="project-explorer-panel" role="tabpanel" id={`aqua-panel-${safeIndex}`} aria-labelledby={`aqua-tab-${safeIndex}`} tabIndex={0}>
          <ProjectCard project={selectedProject} locale={locale} featured />
        </div>
      </div>
    </div>
  </div>;
}

function Projects({ locale, projects, loading, desktop }: { locale: Locale; projects: Project[]; loading: "loading"|"ready"|"error"; desktop: boolean }) {
  const t = translate(locale);
  const [filter, setFilter] = useState<ProjectTrack>("all");
  // "All" introduces the featured cases; a specific filter searches the
  // complete archive, including data projects outside the featured set.
  const featured = filter === "all"
    ? projects.filter(p => p.featured)
    : filterProjects(projects, filter);
  const counts = tracks.map(track => track === "all"
    ? projects.filter(p => p.featured).length
    : filterProjects(projects, track).length);
  return <div className="wrap">
    <Heading index="01" path="ZARA_DISK / PROJECTS" title={t.projectTitle} description={t.projectDesc} />
    <div className="project-filters aqua-filter-bar" data-project-filters>
      <p className="project-filter-label">{t.filter}</p>
      <div className="project-filter-options" role="group" aria-label={t.filter}>
        {tracks.map((track, i) => <button key={track} type="button" aria-pressed={filter === track} onClick={() => setFilter(track)}>
          {t.filters[i]} <span>{counts[i]}</span>
        </button>)}
      </div>
      <p className="project-filter-status" role="status" aria-live="polite">{featured.length} {t.filters[tracks.indexOf(filter)]}</p>
    </div>
    {loading !== "ready" ? <p role="status" className="aqua-data-state">{loading === "loading" ? t.loading : t.error}</p>
      : desktop ? <ProjectExplorer projects={featured} locale={locale} />
      : <div className="featured-project-grid">{featured.length ? featured.map(p => <ProjectCard key={p.url} project={p} locale={locale} featured />) : <p>{t.noProjects}</p>}</div>}
  </div>;
}

function Archive({ locale, projects, loading }: { locale: Locale; projects: Project[]; loading: "loading"|"ready"|"error" }) {
  const t = translate(locale);
  return <div className="wrap">
    <Heading index="03" path="ZARA_DISK / ARCHIVE" title={t.archiveTitle} description={t.archiveDesc} />
    {loading !== "ready" ? <p role="status">{loading === "loading" ? t.loading : t.error}</p>
      : <div className="project-archive-grid">{projects.filter(p => !p.featured).map(p => <ProjectCard key={p.url} project={p} locale={locale} />)}</div>}
  </div>;
}

function Home({ locale, navigate }: { locale: Locale; navigate: (key: SectionKey) => void }) {
  const t = translate(locale);
  return <>
    <div className="wrap hero-grid">
      <div className="hero-copy">
        <p className="eyebrow"><span className="eyebrow-rule" aria-hidden="true"/> {t.profileKicker}</p>
        <p className="hero-role">{t.role}</p>
        <h1 id="hero-title">{t.heroTitle}<span className="heading-period">.</span></h1>
        <p className="hero-intro">{t.heroDesc}</p>
        <ul className="hero-stack" aria-label={t.technology}>
          {["Python", "Django", "REST APIs", "React", "TypeScript", "Git"].map(tech => <li key={tech}>{tech}</li>)}
        </ul>
        <div className="hero-actions">
          <button className="button button-wine" type="button" onClick={() => navigate("projects")}>{t.projectsCTA} ↗</button>
          <button className="button button-outline" type="button" onClick={() => navigate("contact")}>{t.contactCTA} ✉</button>
        </div>
        <div className="hero-socials">
          <a href={GITHUB} target="_blank" rel="noopener noreferrer">GitHub ↗</a>
          <a href={LINKEDIN} target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
        </div>
      </div>
      <aside className="digital-profile aqua-identity" aria-label="Zara Takion — digital identity">
        <div className="digital-avatar"><img src="/assets/img/oc-portrait.jpg" alt="Zara Takion — original character" width="320" height="320" fetchPriority="high" /></div>
        <div className="digital-profile-copy">
          <p className="digital-profile-name">Zara Takion</p>
          <p className="digital-profile-status"><span className="status-led" aria-hidden="true" /> IDENTITY ONLINE</p>
          <p className="digital-profile-location">Paraíba · Brasil</p>
          <p className="digital-profile-build">AQUA / REACT 3.0</p>
        </div>
      </aside>
    </div>
    <div className="hero-index" aria-hidden="true"><span>{t.sectionIndex}</span><span>{t.heroYear}</span></div>
  </>;
}

function About({ locale }: { locale: Locale }) {
  const t = translate(locale);
  const lists = [
    "Python · Django REST Framework · FastAPI · Flask · REST · JWT",
    "React · TypeScript · JavaScript · Vite · HTML · CSS",
    "SQL · PostgreSQL · SQLite · Pandas · Scikit-learn",
    "Git · GitHub · Postman · Streamlit · Dash · Plotly",
  ];
  return <div className="wrap about-layout">
    <div className="about-heading">
      <p className="section-kicker section-kicker-light"><span>02</span> IDENTITY / PROFILE</p>
      <h2>{t.profileTitle}</h2>
      <p>{t.profile1}</p><p>{t.profile2}</p>
    </div>
    <div className="skills-panel" aria-labelledby="skills-title">
      <div className="skills-panel-heading"><span aria-hidden="true">✳</span><h3 id="skills-title">{t.stackTitle}</h3></div>
      <div className="skill-groups">{lists.map((list, i) => <div key={list}><h4>{t.stackLabels[i]}</h4><p>{list}</p></div>)}</div>
      <p className="skills-note">{t.techDisclaimer}</p>
    </div>
  </div>;
}

function Education({ locale }: { locale: Locale }) {
  const t = translate(locale);
  return <div className="wrap">
    <Heading index="04" path="SYSTEM / EDUCATION" title={t.educationTitle} description={t.educationDesc} />
    <div className="education-grid">
      <article className="education-entry"><p className="entry-label">EDUCATION · 2026</p><h3>{t.degree}</h3><p>{t.institution}</p><span className="entry-status">{t.done}</span></article>
      <article className="education-entry"><p className="entry-label">LANGUAGES</p><h3>{t.languageTitle}</h3><ul className="language-levels">
        <li><span>{locale === "pt" ? "Português" : "Portuguese"}</span><strong>{t.native}</strong></li>
        <li><span>{locale === "pt" ? "Inglês" : "English"}</span><strong>{t.englishLevel}</strong></li>
      </ul></article>
    </div>
  </div>;
}

function Contact({ locale }: { locale: Locale }) {
  const t = translate(locale);
  return <div className="wrap contact-layout">
    <div className="contact-copy">
      <p className="section-kicker section-kicker-light"><span>05</span> CONNECT / MAIL</p>
      <h2>{t.contactTitle}</h2><p>{t.contactDesc}</p>
      <a className="contact-email" href={`mailto:${EMAIL}`}>{EMAIL} ↗</a>
    </div>
    <div className="contact-direct-links" aria-label="Contact links">
      <a href={`mailto:${EMAIL}`}><span aria-hidden="true">✉</span><span><strong>{t.email}</strong><small>{EMAIL}</small></span><span aria-hidden="true">↗</span></a>
      <a href={GITHUB} target="_blank" rel="noopener noreferrer"><span aria-hidden="true">⌘</span><span><strong>GitHub</strong><small>github.com/ZaraTakion</small></span><span aria-hidden="true">↗</span></a>
      <a href={LINKEDIN} target="_blank" rel="noopener noreferrer"><span aria-hidden="true">in</span><span><strong>LinkedIn</strong><small>{t.professional}</small></span><span aria-hidden="true">↗</span></a>
    </div>
  </div>;
}

function Terminal({ locale, navigate }: { locale: Locale; navigate: (key: SectionKey) => void }) {
  const t = translate(locale);
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<string[]>([t.terminalWelcome, t.terminalHint]);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ block: "nearest" }); }, [history]);
  const execute = () => {
    const raw = value.trim().toLowerCase();
    setValue("");
    if (!raw) return;
    if (raw === "clear") { setHistory([t.terminalWelcome]); return; }
    const lookup: Record<string, SectionKey> = {
      projects: "projects", projetos: "projects",
      about: "about", sobre: "about", skills: "about",
      archive: "archive", arquivo: "archive",
      education: "education", formacao: "education",
      contact: "contact", contato: "contact",
      home: "home", inicio: "home",
    };
    if (raw === "help" || raw === "ajuda") { setHistory(prev => [...prev, `> ${raw}`, t.terminalHelp]); return; }
    if (lookup[raw]) { setHistory(prev => [...prev, `> ${raw}`, `[ OK ] ${lookup[raw]}`]); navigate(lookup[raw]); return; }
    setHistory(prev => [...prev, `> ${raw.slice(0,80)}`, t.terminalUnknown]);
  };
  return <div className="wrap aqua-terminal-wrap">
    <p className="section-kicker"><span>06</span> SYSTEM / TERMINAL</p>
    <h2>{t.terminalTitle}</h2>
    <p>{t.terminalHint}</p>
    <div className="aqua-terminal">
      <div className="aqua-terminal-output" role="log" aria-label="Terminal output" aria-live="polite">
        {history.slice(-30).map((line, i) => <p key={i}>{line}</p>)}<div ref={endRef} />
      </div>
      <form onSubmit={event => { event.preventDefault(); execute(); }} className="aqua-terminal-input">
        <label htmlFor="aqua-terminal-command">{t.terminalLabel}</label>
        <span aria-hidden="true">$</span>
        <input id="aqua-terminal-command" ref={inputRef} autoComplete="off" spellCheck={false} maxLength={80} value={value} onChange={event => setValue(event.target.value)} />
        <button type="submit">{t.terminalRun}</button>
        <button type="button" onClick={() => { setHistory([t.terminalWelcome]); inputRef.current?.focus(); }}>{t.terminalClear}</button>
      </form>
    </div>
    <p className="aqua-terminal-help">{t.terminalHelp}</p>
  </div>;
}

function WindowFrame({ title, locale, fullscreen, toggleFullscreen, minimize, close }: {
  title: string; locale: Locale; fullscreen: boolean;
  toggleFullscreen: () => void; minimize: () => void; close: () => void;
}) {
  const t = translate(locale);
  return <div className="retro-window-titlebar aqua-window-chrome">
    <span className="retro-window-identity" aria-hidden="true">ZT</span>
    <span className="retro-window-title">{title}</span>
    <span className="retro-window-controls">
      <button type="button" className="retro-window-minimize" aria-label={t.minimize} onClick={minimize}>−</button>
      <button type="button" className="aqua-window-expand" aria-label={fullscreen ? t.restore : t.fullscreen} onClick={toggleFullscreen}>{fullscreen ? "❐" : "□"}</button>
      <button type="button" className="retro-window-close" aria-label={t.close} onClick={close}>×</button>
    </span>
  </div>;
}

function CommandPalette({ locale, openApp, onClose }: {
  locale: Locale; openApp: (key: SectionKey) => void; onClose: () => void;
}) {
  const t = translate(locale);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const trapFocus = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") { onClose(); return; }
    if (event.key !== "Tab") return;
    const buttons = [...(dialogRef.current?.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled])") ?? [])];
    if (!buttons.length) return;
    const first = buttons[0], last = buttons[buttons.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    ref.current?.focus();
    return () => previous?.focus();
  }, []);
  const options = appKeys.filter((key, i) => (`${key} ${t.nav[i]} ${t.app[i]}`).toLowerCase().includes(query.toLowerCase()));
  return <div className="aqua-command-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="command-title" className="aqua-command-palette"
      onKeyDown={trapFocus}>
      <div className="aqua-command-head"><h2 id="command-title">ZARA_DISK / QUICK OPEN</h2><button type="button" onClick={onClose} aria-label={t.close}>×</button></div>
      <label htmlFor="command-search">{t.openApp}</label>
      <input id="command-search" ref={ref} value={query} placeholder={t.selectProject} autoComplete="off" onChange={event => setQuery(event.target.value)} />
      <div className="aqua-command-results">
        {options.map(key => <button key={key} type="button" onClick={() => { openApp(key); onClose(); }}>
          <span aria-hidden="true">▣</span><span>{t.nav[appKeys.indexOf(key)]}<small>{t.app[appKeys.indexOf(key)]}</small></span><span aria-hidden="true">↗</span>
        </button>)}
        {!options.length && <p>{t.noProjects}</p>}
      </div>
    </div>
  </div>;
}

export default function App({ locale }: { locale: Locale }) {
  const t = translate(locale);
  const desktop = useMediaQuery(DESKTOP_QUERY);
  const { projects, state: projectsState } = useProjects();
  const time = useClock(locale);
  const [stage, setStage] = useState<"start"|"boot"|"running">(() => keyFromHash(window.location.hash) ? "running" : "start");
  const [active, setActive] = useState<SectionKey | null>(() => keyFromHash(window.location.hash) ?? "home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [fullScreen, setFullScreen] = useState<SectionKey | null>(null);
  const bootTimer = useRef<number | null>(null);
  const launcherRef = useRef<(HTMLAnchorElement | null)[]>([]);
  const navRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);
  const headingRef = useRef<HTMLElement>(null);

  const startDesktop = useCallback((key: SectionKey = "home") => {
    if (bootTimer.current !== null) window.clearTimeout(bootTimer.current);
    bootTimer.current = null; setStage("running"); setActive(key);
  }, []);

  const openApp = useCallback((key: SectionKey) => {
    setActive(key); setMenuOpen(false);
    const hash = key === "terminal" ? "#terminal" : `#${slugFor(key, locale)}`;
    if (window.location.hash !== hash) history.pushState(null, "", hash);
    if (desktop) {
      startDesktop(key);
      window.requestAnimationFrame(() => {
        const section = document.getElementById(key === "terminal" ? "terminal" : slugFor(key, locale));
        section?.querySelector<HTMLElement>("h1, h2")?.focus({ preventScroll: true });
      });
    } else {
      window.requestAnimationFrame(() => document.getElementById(key === "terminal" ? "terminal" : slugFor(key, locale))?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  }, [desktop, locale, startDesktop]);

  const handleLink = (event: ReactMouseEvent<HTMLAnchorElement>, key: SectionKey) => {
    event.preventDefault(); openApp(key);
  };

  useEffect(() => {
    const syncHash = () => {
      const key = keyFromHash(location.hash);
      if (key) { setActive(key); if (desktop) startDesktop(key); }
      else if (desktop && stage === "running") setActive("home");
    };
    window.addEventListener("popstate", syncHash);
    window.addEventListener("hashchange", syncHash);
    return () => { window.removeEventListener("popstate", syncHash); window.removeEventListener("hashchange", syncHash); };
  }, [desktop, stage, startDesktop]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault(); setPaletteOpen(value => !value); return;
      }
      if (event.key === "Escape") {
        if (paletteOpen) { setPaletteOpen(false); return; }
        if (menuOpen) { setMenuOpen(false); menuRef.current?.focus(); return; }
        if (desktop && stage === "running" && active !== "home") { openApp("home"); return; }
      }
      if (desktop && event.altKey && /^[1-7]$/.test(event.key) && !event.ctrlKey && !event.metaKey) {
        event.preventDefault(); openApp(appKeys[Number(event.key) - 1]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, desktop, menuOpen, openApp, paletteOpen, stage]);

  useEffect(() => {
    if (!menuOpen) return;
    const outside = (event: PointerEvent) => {
      if (!navRef.current?.contains(event.target as Node) && !menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [menuOpen]);

  useEffect(() => () => { if (bootTimer.current !== null) window.clearTimeout(bootTimer.current); }, []);
  useEffect(() => {
    document.body.classList.add("aqua-portfolio", "aqua-v3");
    document.documentElement.classList.add("js");
    return () => document.body.classList.remove("aqua-portfolio", "aqua-v3");
  }, []);

  const startBoot = () => {
    setStage("boot");
    if (bootTimer.current !== null) window.clearTimeout(bootTimer.current);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    bootTimer.current = window.setTimeout(() => startDesktop("home"), reduced ? 90 : 1000);
  };

  const closeWindow = (key: SectionKey) => {
    setFullScreen(null);
    if (key === "home") setActive(null);
    else setActive("home");
    const idx = appKeys.indexOf(key);
    window.requestAnimationFrame(() => launcherRef.current[idx]?.focus());
  };

  const titleByKey = (key: SectionKey) => t.app[appKeys.indexOf(key)];
  const renderContent = (key: SectionKey) => {
    switch (key) {
      case "home": return <Home locale={locale} navigate={openApp} />;
      case "projects": return <Projects locale={locale} projects={projects} loading={projectsState} desktop={desktop} />;
      case "archive": return <Archive locale={locale} projects={projects} loading={projectsState} />;
      case "about": return <About locale={locale} />;
      case "education": return <Education locale={locale} />;
      case "contact": return <Contact locale={locale} />;
      case "terminal": return <Terminal locale={locale} navigate={openApp} />;
    }
  };
  const classByKey: Record<SectionKey, string> = {
    home: "hero", projects: "project-section section-shell", about: "about-section section-shell",
    archive: "archive-section section-shell", education: "education-section section-shell",
    contact: "contact-section", terminal: "aqua-terminal-section section-shell",
  };

  return <>
    <a className="skip-link" href="#conteudo">{t.skip}</a>
    <header className="site-header">
      <div className="header-inner wrap">
        <a className="wordmark" href={`#${slugFor("home", locale)}`} onClick={event => handleLink(event, "home")} aria-label="Zara Aqua Workstation — home">
          <span className="wordmark-mark" aria-hidden="true">ZT</span>
          <span className="wordmark-name">ZARA <span>// AQUA WORKSTATION</span></span>
        </a>
        <button ref={menuRef} type="button" className="menu-toggle" aria-controls="main-nav"
          aria-expanded={menuOpen} aria-label={menuOpen ? t.closeMenu : t.menu} onClick={() => setMenuOpen(value => !value)}>
          <span className="menu-icon" aria-hidden="true" />
        </button>
        <nav id="main-nav" className={`main-nav${menuOpen ? " is-open" : ""}`} ref={navRef} aria-label="Navigation">
          {appKeys.slice(1,6).map(key => <a key={key} href={`#${slugFor(key as Exclude<SectionKey,"terminal">, locale)}`}
            onClick={event => handleLink(event, key)}>{t.nav[appKeys.indexOf(key)]}</a>)}
          <a className="language-switch" href={locale === "pt" ? "/en/" : "/"} hrefLang={locale === "pt" ? "en" : "pt-BR"}
            lang={locale === "pt" ? "en" : "pt-BR"} aria-label={t.language}>{t.otherLanguage}</a>
          <button className="aqua-palette-trigger" type="button" onClick={() => setPaletteOpen(true)} aria-label="Quick open apps">⌕ <span>Ctrl K</span></button>
        </nav>
      </div>
    </header>

    <main id="conteudo" className={`retro-desktop-stage${desktop ? " retro-enhanced" : ""}${desktop && stage === "running" ? " desktop-running" : ""}`} ref={headingRef}>
      <div className="aqua-sky" aria-hidden="true"><span className="aqua-moon" /><span className="aqua-cloud aqua-cloud-one"/><span className="aqua-cloud aqua-cloud-two"/><span className="aqua-cloud aqua-cloud-three"/></div>

      <section className="startup-screen" aria-labelledby="startup-title" hidden={stage !== "start"}>
        <div className="startup-window aqua-startup">
          <div className="startup-titlebar"><span>ZARA // AQUA WORKSTATION</span><span aria-hidden="true">● ○ ×</span></div>
          <div className="startup-content">
            <p className="startup-kicker">AQUA / REACT OS · BUILD 3.0</p>
            <h2 id="startup-title">{t.startupTitle}</h2><p>{t.startupDesc}</p>
            <div className="startup-actions">
              <button className="button button-wine" type="button" onClick={() => startDesktop()} data-desktop-start>{t.enter} ↗</button>
              <button className="button button-outline" type="button" onClick={startBoot} data-desktop-boot>{t.boot} ▶</button>
            </div>
          </div>
        </div>
      </section>

      <section className="boot-screen" aria-labelledby="boot-title" hidden={stage !== "boot"}>
        <div className="boot-terminal"><h2 id="boot-title">AQUA_WORKSTATION.SYS</h2>
          {t.bootLines.map(line => <p key={line}>{line} <span>[ OK ]</span></p>)}
          <div className="boot-progress" aria-hidden="true"><span /></div>
          <button className="boot-skip" type="button" onClick={() => startDesktop()}>{t.skipBoot} ↗</button>
        </div>
      </section>

      <aside className="desktop-widgets" aria-label="Aqua desktop widgets">
        <section className="desktop-widget music-widget">
          <h2 className="widget-title">now_playing.exe</h2>
          <div className="music-widget-body"><span className="music-cover" aria-hidden="true">♫</span>
            <div><p className="music-track">{t.work}</p><p className="music-artist">Zara workstation</p><a href="https://open.spotify.com/" target="_blank" rel="noopener noreferrer">Spotify ↗</a></div>
          </div>
        </section>
        <section className="desktop-widget system-widget" aria-label={t.status}>
          <h2 className="widget-title">system_status.exe</h2>
          <div className="system-widget-body"><time className="system-clock" data-system-clock>{time}</time>
            <p>PARAÍBA · BR</p><p><span className="status-led" aria-hidden="true"/>{t.available}</p>
          </div>
        </section>
      </aside>

      <nav className="desktop-apps" aria-label="Desktop applications">
        {appKeys.map((key,i) => <a key={key} ref={el => { launcherRef.current[i] = el; }}
          href={key === "terminal" ? "#terminal" : `#${slugFor(key, locale)}`} data-app-open={key}
          aria-current={stage === "running" && active === key ? "page" : undefined}
          onClick={event => handleLink(event,key)}>
          <span aria-hidden="true">{["⌂","▧","◉","▣","▥","✉","▤"][i]}</span>{t.nav[i]}
        </a>)}
      </nav>

      <div className="desktop-statusbar" aria-label={t.status}>
        <span className="desktop-statusbar-brand"><span aria-hidden="true">◉</span> ZARA // AQUA WORKSTATION</span>
        <span className="desktop-statusbar-app">{t.activeApp} <strong data-active-app>{active ? titleByKey(active) : "desktop"}</strong></span>
        <span><span className="status-led" aria-hidden="true"/> {t.liveMode}</span>
        <button type="button" className="aqua-status-search" onClick={() => setPaletteOpen(true)}>⌕ <span>Ctrl K</span></button>
      </div>

      {appKeys.map(key => {
        const showWindow = desktop && stage === "running";
        const isOpen = active === key && showWindow;
        const id = key === "terminal" ? extraIds.terminal : slugFor(key, locale);
        return <section key={key} id={id} className={`${classByKey[key]} retro-app-window${isOpen ? " is-open has-focus" : ""}${isOpen && fullScreen === key ? " aqua-maximized" : ""}`}
          aria-label={titleByKey(key)} aria-hidden={showWindow && !isOpen} data-app-window={key}>
          <WindowFrame title={titleByKey(key)} locale={locale} fullscreen={fullScreen === key}
            toggleFullscreen={() => setFullScreen(current => current === key ? null : key)}
            minimize={() => { setActive(null); launcherRef.current[appKeys.indexOf(key)]?.focus(); }}
            close={() => closeWindow(key)} />
          {renderContent(key)}
        </section>;
      })}
      <div className="aqua-workspace-hint">{t.shortcuts}</div>
    </main>

    <footer className="site-footer">
      <div className="wrap footer-layout">
        <a className="wordmark footer-wordmark" href={`#${slugFor("home", locale)}`} onClick={event => handleLink(event,"home")}>
          <span className="wordmark-mark">ZT</span><span className="wordmark-name">ZARA <span>// AQUA</span></span>
        </a>
        <p>{t.copyright}</p>
        <nav aria-label="Footer"><a href={locale === "pt" ? "/privacidade.html" : "/en/privacy.html"}>{t.privacy}</a>
          <a href={GITHUB} rel="noopener noreferrer" target="_blank">GitHub ↗</a></nav>
        <p>© {new Date().getFullYear()} Rodrigo A. Maciel Pinheiro</p>
      </div>
    </footer>
    {paletteOpen && <CommandPalette locale={locale} openApp={openApp} onClose={() => setPaletteOpen(false)} />}
  </>;
}
