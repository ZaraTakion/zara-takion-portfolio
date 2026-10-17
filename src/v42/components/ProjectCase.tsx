import { TransactionDiagram } from "./TransactionDiagram";
import type { Project } from "../../types";
import { labels, type Locale } from "../content";
import { CampusExplorer, ContractExplorer } from "./ArchitectureExplorer";
import { CaseNotes } from "./CaseNotes";
export function ProjectCase({
  project: p,
  locale,
  index,
}: {
  project: Project;
  locale: Locale;
  index: number;
}) {
  const t = labels[locale],
    pt = locale === "pt",
    c = pt ? p.case_study : p.case_study_en;
  const technicalImage = index < 2 ? p.image : undefined;
  return (
    <article
      className={`project-case project-${index}`}
      aria-labelledby={`project-title-${index}`}
    >
      <div className="project-topline">
        <span className="eyebrow">
          0{index + 1} / {pt ? p.category : p.category_en}
        </span>
        <span className="small">{index < 3 ? "PYTHON" : "REACT"}</span>
      </div>
      <div className="project-intro">
      <h3 id={`project-title-${index}`}>{p.title}</h3>
      <p>{pt ? p.description : p.description_en}</p>
      <ul className="tags" aria-label={pt ? "Tecnologias" : "Technologies"}>
        {p.technologies.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
      </div>
      {technicalImage && (
        <figure>
          <img
            src={technicalImage}
            width={p.image_width}
            height={p.image_height}
            alt={(pt ? p.alt : p.alt_en) || p.title}
            loading="lazy"
            decoding="async"
          />
          <figcaption>{pt ? p.visual_note : p.visual_note_en}</figcaption>
        </figure>
      )}
      {index === 0 && (
        <div className="decision-exhibit">
          <div className="decision-narrative">
            <p className="eyebrow">
              {pt ? "CADERNO DE DECISÕES / 01" : "DECISION NOTES / 01"}
            </p>
            <h4>
              {pt
                ? "Como guardar uma mudança e preparar seu aviso?"
                : "How do you save a change and prepare its notification?"}
            </h4>
            <p>
              {pt
                ? "A resposta começa no banco de dados: a alteração do chamado e o evento de notificação são registrados na mesma transação. O envio acontece em outra etapa."
                : "The answer starts in the database: the ticket change and notification event are saved in the same transaction. Delivery happens in a separate step."}
            </p>
            <a href={p.evidence_url} className="text-link">
              {pt
                ? "Conferir implementação e evidências"
                : "Review implementation and evidence"}{" "}
              ↗
            </a>
          </div>
          <TransactionDiagram locale={locale} />
        </div>
      )}
      <CaseNotes title={p.title} locale={locale} />
      {index === 1 && <CampusExplorer locale={locale} />}
      {index === 2 && <ContractExplorer locale={locale} />}
      {index > 2 && (
        <div className="case-highlight front-end">
          <span className="eyebrow">
            {index === 3 ? "PT / EN" : "PT / EN / JA"}
          </span>
          <p>
            {pt
              ? index === 3
                ? "Dois universos, uma experiência navegável."
                : "Uma galeria feita para explorar."
              : index === 3
                ? "Two worlds, one navigable experience."
                : "A gallery made to explore."}
          </p>
          <span className="small">
            {pt
              ? "Componentes React · responsividade · navegação por teclado"
              : "React components · responsive layout · keyboard navigation"}
          </span>
        </div>
      )}
      {c && (
        <details className="case-details">
          <summary>
            {t.details}
            <span aria-hidden="true">+</span>
          </summary>
          <div className="case-body">
            <h4>{t.problem}</h4>
            <p>{c.problem}</p>
            <h4>{t.decision}</h4>
            <p>{c.approach}</p>
            {c.details && (
              <>
                <h4>{t.architecture}</h4>
                <p>{c.details.architecture}</p>
                <h4>{t.verification}</h4>
                <p>{c.details.verification}</p>
                <h4>{t.scope}</h4>
                <p>{c.details.boundary}</p>
              </>
            )}
          </div>
        </details>
      )}
      <div className="project-links">
        {!p.source_private && <a href={p.url}>{t.code} ↗</a>}
        {p.evidence_url && <a href={p.evidence_url}>{t.evidence} ↗</a>}
        {p.demo_url && <a href={p.demo_url}>{t.demo} ↗</a>}
      </div>
    </article>
  );
}
