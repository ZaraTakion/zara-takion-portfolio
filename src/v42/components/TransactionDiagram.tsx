import { useState } from "react";
import type { Locale } from "../content";
export function TransactionDiagram({ locale }: { locale: Locale }) {
  const [node, setNode] = useState(0);
  const pt = locale === "pt";
  const names = pt
    ? ["Chamado", "Evento na outbox", "Processador"]
    : ["Ticket", "Outbox event", "Processor"];
  const copy = pt
    ? [
        "O registro do chamado representa o estado da solicitação. O projeto também mantém histórico de alterações.",
        "O evento guarda o trabalho de notificação a ser processado. É persistido junto da alteração do chamado, na mesma transação.",
        "Depois da transação, o processador cuida das notificações. O projeto oferece execução local ou Celery/Redis.",
      ]
    : [
        "The ticket record represents the request state. The project also keeps change history.",
        "The event records notification work to process. It is persisted with the ticket change, in the same transaction.",
        "After the transaction, a processor handles notifications. The project supports local execution or Celery/Redis.",
      ];
  return (
    <section
      className="transaction-exhibit"
      aria-label={
        pt ? "Diagrama da outbox transacional" : "Transactional outbox diagram"
      }
    >
      <div className="transaction-group">
        <p className="eyebrow">
          {pt
            ? "01 / MESMA TRANSAÇÃO NO BANCO"
            : "01 / SAME DATABASE TRANSACTION"}
        </p>
        <div className="transaction-nodes">
          {names.slice(0, 2).map((name, i) => (
            <button
              key={name}
              aria-pressed={node === i}
              onClick={() => setNode(i)}
              aria-controls="transaction-note"
            >
              <span className="node-number">0{i + 1}</span>
              {name}
            </button>
          ))}
        </div>
      </div>
      <div className="transaction-bridge">
        <span aria-hidden="true">↓</span>
        <span>{pt ? "Depois do registro" : "After recording"}</span>
      </div>
      <button
        className="processor-node"
        aria-pressed={node === 2}
        onClick={() => setNode(2)}
        aria-controls="transaction-note"
      >
        <span>03</span>
        {names[2]}
        <small>
          {pt ? "Local / Celery + Redis" : "Local / Celery + Redis"}
        </small>
      </button>
      <p className="transaction-note" id="transaction-note" aria-live="polite">
        {copy[node]}
      </p>
      <p className="small">
        {pt
          ? "Esquema simplificado da arquitetura documentada. Selecione os blocos; nenhum dado é enviado."
          : "Simplified view of the documented architecture. Select the blocks; no data is sent."}
      </p>
    </section>
  );
}
