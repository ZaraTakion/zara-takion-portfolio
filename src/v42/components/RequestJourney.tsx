import { useState } from "react";
import { labels, type Locale } from "../content";
const content = {
  pt: [
    {
      name: "Reconhecer",
      tech: "JWT",
      title: "Quem está fazendo o pedido?",
      plain:
        "Antes de consultar um chamado, o sistema identifica a pessoa que está acessando. Isso permite decidir quais informações ela pode ver.",
      technical:
        "O token JWT identifica o usuário autenticado. A autorização continua sendo uma decisão da API; possuir um token não libera acesso a todos os chamados.",
    },
    {
      name: "Proteger",
      tech: "Permissões",
      title: "Cada pessoa vê o que lhe pertence.",
      plain:
        "Uma pessoa acompanha seus próprios chamados. A equipe de atendimento tem responsabilidades adicionais, e anotações internas ficam restritas a ela.",
      technical:
        "A API distingue proprietário e equipe. Usuários acessam seus chamados; a equipe pode atribuir responsáveis e alterar status. Comentários internos são restritos à equipe.",
    },
    {
      name: "Registrar",
      tech: "Transação SQL",
      title: "A mudança precisa deixar um rastro.",
      plain:
        "Ao atualizar um chamado, o sistema guarda a mudança e prepara um registro para o aviso. Assim, o envio da notificação pode acontecer depois.",
      technical:
        "O chamado e o evento da outbox são persistidos na mesma transação. O histórico registra mudanças de status, prioridade e atribuição. A entrega da notificação é uma etapa posterior.",
    },
    {
      name: "Avisar",
      tech: "Outbox → worker",
      title: "Preparar um aviso não é entregá-lo.",
      plain:
        "Um processador lê os avisos preparados e cuida da notificação. O registro guardado e a etapa de envio têm funções diferentes.",
      technical:
        "A outbox desacopla o registro transacional do processamento. O projeto documenta processador local e execução com Celery/Redis. Este diagrama não demonstra um serviço público em execução.",
    },
  ],
  en: [
    {
      name: "Recognize",
      tech: "JWT",
      title: "Who is making the request?",
      plain:
        "Before showing a ticket, the system identifies the person accessing it. This helps decide which information they may see.",
      technical:
        "The JWT identifies the authenticated user. Authorization remains an API decision; having a token does not grant access to all tickets.",
    },
    {
      name: "Protect",
      tech: "Permissions",
      title: "People see the tickets they own.",
      plain:
        "People follow their own tickets. Support staff have additional responsibilities, and internal notes are restricted to them.",
      technical:
        "The API distinguishes owners and staff. Users access their own tickets; staff can assign owners and update status. Internal comments are staff-only.",
    },
    {
      name: "Record",
      tech: "SQL transaction",
      title: "A change needs a record.",
      plain:
        "When updating a ticket, the system saves the change and prepares a notification record. Sending the notification can happen later.",
      technical:
        "The ticket and outbox event are persisted in the same transaction. History records status, priority and assignment changes. Notification delivery happens later.",
    },
    {
      name: "Notify",
      tech: "Outbox → worker",
      title: "Preparing a notification is not delivering it.",
      plain:
        "A processor reads the prepared records and handles notification delivery. Saving the record and sending the notification are separate responsibilities.",
      technical:
        "The outbox separates transactional recording from processing. The project documents a local processor and Celery/Redis execution. This diagram is not a live public service.",
    },
  ],
};
export function RequestJourney({ locale }: { locale: Locale }) {
  const [selected, setSelected] = useState(0),
    [technical, setTechnical] = useState(false);
  const pt = locale === "pt",
    items = content[locale],
    item = items[selected];
  return (
    <section
      className="request-journey"
      aria-label={
        pt
          ? "Entenda a arquitetura do Chamados"
          : "Understand the Chamados architecture"
      }
    >
      <div
        className="reading-modes"
        role="group"
        aria-label={pt ? "Nível de detalhe" : "Level of detail"}
      >
        <button aria-pressed={!technical} onClick={() => setTechnical(false)}>
          {pt ? "Em poucas palavras" : "In plain words"}
        </button>
        <button aria-pressed={technical} onClick={() => setTechnical(true)}>
          {pt ? "Visão técnica" : "Technical view"}
        </button>
      </div>
      <p className="journey-instruction">
        {pt
          ? "Escolha uma etapa para entender sua função."
          : "Choose a step to understand its purpose."}
      </p>
      <ol className="journey-nodes">
        {items.map((node, i) => (
          <li key={node.name}>
            <button
              aria-pressed={i === selected}
              aria-controls="journey-explanation"
              onClick={() => setSelected(i)}
            >
              <span className="node-number">0{i + 1}</span>
              <span>
                <strong>{technical ? node.tech : node.name}</strong>
                <small>{technical ? node.name : node.tech}</small>
              </span>
            </button>
          </li>
        ))}
      </ol>
      <div
        className="journey-explanation"
        id="journey-explanation"
        aria-live="polite"
        aria-atomic="true"
      >
        <span className="eyebrow">0{selected + 1} / 04</span>
        <h3>{item.title}</h3>
        <p>{technical ? item.technical : item.plain}</p>
      </div>
      <div className="journey-source">
        <span>{labels[locale].model}</span>
        <a href="https://github.com/ZaraTakion/chamados-api/blob/e6ea48d5235d46f8e8da87e52b88f6954775c384/docs/EVIDENCE.md">
          {pt ? "Ver evidência" : "View evidence"} ↗
        </a>
      </div>
    </section>
  );
}
