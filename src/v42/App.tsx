import { Header } from "./components/Header";
import { RequestJourney } from "./components/RequestJourney";
import { Signature } from "./components/Signature";
import { ProjectCase } from "./components/ProjectCase";
import {
  certificate,
  cvPath,
  labels,
  projects,
  selectedProjects,
  type Locale,
} from "./content";
import "./styles/tokens.css";
import "./styles/layout.css";
import "./styles/proposal.css";
function SectionHeading({
  number,
  kicker,
  title,
  description,
}: {
  number: string;
  kicker: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="section-heading">
      <span className="section-number" aria-hidden="true">
        {number}
      </span>
      <div>
        <p className="eyebrow">{kicker}</p>
        <h2>{title}</h2>
        {description && <p className="section-description">{description}</p>}
      </div>
    </div>
  );
}
function Hero({ locale }: { locale: Locale }) {
  const t = labels[locale];
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-copy">
        <p className="eyebrow">
          <span className="identity-dot" aria-hidden="true" /> PYTHON · DJANGO ·
          FASTAPI
        </p>
        <p className="profession">{t.profession}</p>
        <h1 id="hero-title">
          Rodrigo
          <br />
          <em>Pinheiro.</em>
        </h1>
        <p className="hero-statement">{t.hero}</p>
        <p className="hero-description">{t.description}</p>
        <div className="hero-actions">
          <a className="button primary" href="#projects">
            {t.see}
            <span aria-hidden="true">↘</span>
          </a>
          <a className="text-link" href={cvPath(locale, "pdf")} download>
            {t.resume} ↓
          </a>
        </div>
        <Signature locale={locale} />
      </div>
      <div className="hero-technical">
        <div className="technical-title">
          <span className="eyebrow">
            01 /{" "}
            {locale === "pt"
              ? "ENGENHARIA EM PERSPECTIVA"
              : "ENGINEERING IN PERSPECTIVE"}
          </span>
          <h2>
            {locale === "pt" ? (
              <>
                Por trás de um chamado.
                <br />
                <em>Decisões que importam.</em>
              </>
            ) : (
              <>
                Behind a support ticket.
                <br />
                <em>Decisions that matter.</em>
              </>
            )}
          </h2>
        </div>
        <RequestJourney locale={locale} />
        <a className="text-link" href="#project-title-0">
          {locale === "pt"
            ? "Conhecer o estudo completo"
            : "Read the complete case"}{" "}
          ↘
        </a>
      </div>
      <div className="hero-baseline">
        <span>{t.intro}</span>
        <span aria-hidden="true">01 — 05</span>
      </div>
    </section>
  );
}
function Skills({ locale }: { locale: Locale }) {
  const t = labels[locale];
  const groups =
    locale === "pt"
      ? [
          [
            "Back-End",
            "Python · Django REST · FastAPI",
            "Contratos, validação, autenticação e regras de negócio.",
          ],
          [
            "Persistência",
            "PostgreSQL · SQLite",
            "Dados relacionais, transações e persistência.",
          ],
          [
            "Interfaces",
            "React · TypeScript · Vite",
            "Componentes, conteúdo bilíngue e comportamento responsivo.",
          ],
          [
            "Verificação",
            "Git · testes · Playwright",
            "Código versionado, execução reproduzível e evidências.",
          ],
        ]
      : [
          [
            "Back-End",
            "Python · Django REST · FastAPI",
            "Contracts, validation, authentication and business rules.",
          ],
          [
            "Persistence",
            "PostgreSQL · SQLite",
            "Relational data, transactions and persistence.",
          ],
          [
            "Interfaces",
            "React · TypeScript · Vite",
            "Components, bilingual content and responsive behavior.",
          ],
          [
            "Verification",
            "Git · tests · Playwright",
            "Versioned code, reproducible execution and evidence.",
          ],
        ];
  return (
    <section className="section skills" id="skills">
      <SectionHeading
        number="02"
        kicker={t.tools}
        title={t.toolsTitle}
        description={t.toolsText}
      />
      <div className="skill-grid">
        {groups.map(([title, tech, desc], i) => (
          <article key={title}>
            <span className="eyebrow">0{i + 1}</span>
            <h3>{title}</h3>
            <p className="skill-tech">{tech}</p>
            <p>{desc}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
function Identity({ locale }: { locale: Locale }) {
  const t = labels[locale];
  return (
    <section className="section identity" id="about">
      <SectionHeading number="03" kicker={t.about} title={t.identity} />
      <div className="identity-grid">
        <div>
          <p className="eyebrow">
            RODRIGO PINHEIRO /{" "}
            {locale === "pt"
              ? "PESSOA E PROFISSIONAL"
              : "PERSON AND PROFESSIONAL"}
          </p>
          <h3>
            {locale === "pt"
              ? "Curiosidade que se transforma em trabalho."
              : "Curiosity that becomes work."}
          </h3>
          <p>{t.personal}</p>
          <p>{t.personality}</p>
          <p className="small">{t.interests}</p>
        </div>
        <aside className="zara-note">
          <p className="eyebrow">{t.creative}</p>
          <h3>
            Zara
            <br />
            <em>Takion</em>
          </h3>
          <p>{t.signature}</p>
        </aside>
      </div>
    </section>
  );
}
function Education({ locale }: { locale: Locale }) {
  const t = labels[locale];
  return (
    <section className="section" id="education">
      <SectionHeading number="04" kicker={t.education} title={t.foundation} />
      <div className="education-grid">
        <article>
          <p className="eyebrow">
            2026 / {locale === "pt" ? "FORMAÇÃO SUPERIOR" : "HIGHER EDUCATION"}
          </p>
          <h3>{t.degree}</h3>
          <p>{t.institution}</p>
          <p className="small">{t.languages}</p>
        </article>
        <article>
          <p className="eyebrow">2023 / {t.course}</p>
          <h3>{t.courseName}</h3>
          <p>{t.courseMeta}</p>
          <a href={certificate} className="text-link">
            {t.validate} ↗
          </a>
          <p>
            <a
              className="text-link"
              href="/documents/Certificado_Udemy_Python_Geek_University.pdf"
            >
              {locale === "pt"
                ? "Abrir documento original · PDF"
                : "Open original document · PDF in Portuguese"}{" "}
              ↗
            </a>
          </p>
        </article>
      </div>
    </section>
  );
}
function Contact({ locale }: { locale: Locale }) {
  const t = labels[locale];
  return (
    <section className="section contact" id="contact">
      <p className="eyebrow">05 / {t.contact}</p>
      <h2>{t.contactTitle}</h2>
      <p>{t.contactText}</p>
      <a className="contact-email" href="mailto:rm20022101@gmail.com">
        rm20022101@gmail.com ↗
      </a>
      <div className="contact-links">
        <a href="https://github.com/ZaraTakion">GitHub ↗</a>
        <a href="https://www.linkedin.com/in/rodrigo-pinheiro-94aa74358/">
          LinkedIn ↗
        </a>
        <a href={cvPath(locale, "pdf")} download>
          {t.download} · PDF ↓
        </a>
        <a href={cvPath(locale, "docx")} download>
          {t.download} · DOCX ↓
        </a>
      </div>
    </section>
  );
}
export function App({ locale }: { locale: Locale }) {
  const t = labels[locale];
  return (
    <>
      <Header locale={locale} />
      <main id="main" tabIndex={-1}>
        <Hero locale={locale} />
        <section className="section" id="projects">
          <SectionHeading
            number="01"
            kicker={t.chosen}
            title={t.projectIntro}
            description={t.projectDescription}
          />
          <div className="project-grid">
            {selectedProjects.map((p, i) => (
              <ProjectCase
                key={p.title}
                project={p}
                locale={locale}
                index={i}
              />
            ))}
          </div>
          <details className="archive">
            <summary>
              {t.archive} <span aria-hidden="true">＋</span>
            </summary>
            <div className="archive-grid">
              {projects
                .filter((p) => p.track === "data")
                .map((p) => (
                  <article key={p.title}>
                    <h3>
                      <a href={p.url}>{p.title} ↗</a>
                    </h3>
                    <p>{locale === "pt" ? p.description : p.description_en}</p>
                  </article>
                ))}
            </div>
          </details>
        </section>
        <Skills locale={locale} />
        <Identity locale={locale} />
        <Education locale={locale} />
        <Contact locale={locale} />
      </main>
      <footer className="site-footer">
        <div>
          <span>{t.footer}</span>
          <span className="signature-name">Zara Takion</span>
        </div>
        <details>
          <summary>
            {t.privacy} · {t.rights}
          </summary>
          <p>
            {locale === "pt"
              ? "Este portfólio não contém formulário, analytics ou rastreamento. A preferência de tema pode ser guardada neste navegador. Links externos e o serviço de hospedagem possuem suas próprias políticas."
              : "This portfolio has no form, analytics or tracking. Your theme preference may be stored in this browser. External links and the hosting provider have their own policies."}
          </p>
          <p>{t.rightsText}</p>
          <a href="/assets/fonts/cormorantgaramond-OFL.txt">
            Cormorant Garamond · OFL
          </a>{" "}
          · <a href="/assets/fonts/sourcesans3-OFL.txt">Source Sans 3 · OFL</a>
          <p><a href="/data/image-provenance.json">{locale === "pt" ? "Procedência e créditos das capturas" : "Screenshot provenance and credits"}</a></p>
        </details>
      </footer>
    </>
  );
}
