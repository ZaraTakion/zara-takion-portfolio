import { useState } from "react";
import { labels, validateTitle, type Locale } from "../content";
export function CampusExplorer({ locale }: { locale: Locale }) {
  const [role, setRole] = useState(0);
  const pt = locale === "pt";
  const roles = pt
    ? ["Aluno", "Professor", "Administração"]
    : ["Student", "Teacher", "Administration"];
  const explanations = pt
    ? [
        "Consulta notas, calendário e materiais; envia atividades.",
        "Gerencia turmas, avaliações, frequência e feedback.",
        "Administra cadastros e operações acadêmicas. O módulo financeiro registra informações; não processa pagamentos.",
      ]
    : [
        "Views grades, calendars and materials; submits assignments.",
        "Manages classes, assessments, attendance and feedback.",
        "Manages records and academic operations. The finance module records information; it does not process payments.",
      ];
  return (
    <section
      className="mini-explorer"
      aria-label={pt ? "Perfis do Takion Campus" : "Takion Campus roles"}
    >
      <p className="eyebrow">REACT → DJANGO REST → SQL</p>
      <div className="choice-row">
        {roles.map((r, i) => (
          <button
            key={r}
            aria-pressed={role === i}
            aria-controls="campus-role-detail"
            onClick={() => setRole(i)}
          >
            {r}
          </button>
        ))}
      </div>
      <p id="campus-role-detail" aria-live="polite">
        {explanations[role]}
      </p>
      <p className="small">
        {pt
          ? "JWT integra cliente e API. As permissões são verificadas no backend. SQLite no desenvolvimento; PostgreSQL configurável."
          : "JWT connects the client and API. Permissions are checked on the back end. SQLite in development; PostgreSQL is configurable."}
      </p>
      <p className="model-note">{labels[locale].model}</p>
    </section>
  );
}
export function ContractExplorer({ locale }: { locale: Locale }) {
  const [title, setTitle] = useState("");
  const [checked, setChecked] = useState(false);
  const pt = locale === "pt";
  const result = validateTitle(title);
  const message = pt
    ? {
        empty:
          "Título vazio após remover espaços. O contrato exige de 1 a 200 caracteres.",
        long: "Título acima do limite de 200 caracteres após remover espaços.",
        valid:
          "O título atende à regra de comprimento. O modelo não envia nem persiste dados.",
      }
    : {
        empty:
          "Empty title after trimming spaces. The contract requires 1–200 characters.",
        long: "Title exceeds 200 characters after trimming spaces.",
        valid:
          "The title meets the length rule. This model does not send or persist data.",
      };
  return (
    <section
      className="mini-explorer"
      aria-label={
        pt
          ? "Explorar validação do Task Manager"
          : "Explore Task Manager validation"
      }
    >
      <p className="eyebrow">POST /tasks · PYDANTIC</p>
      <label htmlFor="task-title">
        {pt ? "Experimente um título de tarefa" : "Try a task title"}
      </label>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setChecked(true);
        }}
      >
        <div className="input-row">
          <input
            id="task-title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setChecked(false);
            }}
            aria-describedby="task-rule task-result"
            placeholder={pt ? "Ex.: documentar a API" : "e.g. document the API"}
          />
          <button type="submit">{pt ? "Validar" : "Validate"}</button>
        </div>
      </form>
      <p id="task-rule" className="small">
        {pt
          ? "Regra documentada: trim + 1–200 caracteres. Esta experiência cobre somente o campo title."
          : "Documented rule: trim + 1–200 characters. This experience covers only the title field."}
      </p>
      <p id="task-result" role="status" className="contract-result">
        {checked
          ? message[result]
          : pt
            ? "Nenhum dado enviado. Teste também um título vazio."
            : "No data sent. Try an empty title too."}
      </p>
      <p className="small">
        {pt
          ? "CRUD em FastAPI → SQLite. A chave X-API-Key é exigida somente quando configurada no servidor."
          : "FastAPI CRUD → SQLite. X-API-Key is required only when configured on the server."}
      </p>
    </section>
  );
}
