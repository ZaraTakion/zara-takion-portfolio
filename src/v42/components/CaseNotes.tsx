import type { Locale } from "../content";

// Only claims backed by the supplied catalog or the pinned primary sources.
// These are implementation notes, not new execution reports for other projects.
const notes = {
  "Takion Campus": {
    pt: ["Como a mesma plataforma atende responsabilidades diferentes?", "O roteamento React organiza aluno, professor e administração. O cliente envia JWT; o servidor Django REST continua responsável por autorizar cada operação.", "Compare as rotas por perfil, os testes de autenticação e os testes de arquivos citados no estudo original. A tela de acesso não demonstra uma sessão acadêmica; o módulo financeiro não processa pagamentos."],
    en: ["How can one platform serve different responsibilities?", "React routes organize student, teacher and administration views. The client sends a JWT; the Django REST server remains responsible for authorizing each operation.", "Compare the role routes, authentication tests and file tests linked in the original case. The sign-in screenshot does not demonstrate an academic session; the finance module does not process payments."],
    url: "https://github.com/ZaraTakion/takion-campus/blob/777884a364cb7e9291acb88dbbbf94b0c7062614/docs/CASE_STUDY.md",
  },
  "Task Manager API": {
    pt: ["Que dados podem entrar e continuar disponíveis?", "O contrato remove espaços e aceita títulos de 1 a 200 caracteres; Pydantic valida a entrada antes da persistência SQLite. A chave X-API-Key é exigida somente quando configurada no servidor.", "O README referencia testes de CRUD, reinicialização, integridade transacional e backup. O formulário abaixo ilustra somente a regra do título: não chama a API, não comprova persistência e não recebe credenciais."],
    en: ["Which data can enter and remain available?", "The contract trims whitespace and accepts titles of 1–200 characters; Pydantic validates input before SQLite persistence. X-API-Key is required only when configured on the server.", "The README links CRUD, restart, transactional integrity and backup tests. The form below illustrates only the title rule: it does not call the API, prove persistence or accept credentials."],
    url: "https://github.com/ZaraTakion/task-manager-backend/blob/e7e8666060b2c6c2ab491b7fcdc77022899a3726/README.md",
  },
  "Biya — Parallel Worlds": {
    pt: ["Como dois universos compartilham uma navegação compreensível?", "Crystal e Ghost são estados visuais completos. Componentes React mantêm a navegação PT/EN; as animações respeitam a preferência de movimento reduzido.", "O README registra os estados, a política de uso das artes e a bateria de verificação. Esses testes não foram reexecutados nesta integração. A autorização de exibição no site original não transfere direitos sobre as artes."],
    en: ["How can two worlds share understandable navigation?", "Crystal and Ghost are complete visual states. React components retain PT/EN navigation; animations respect reduced-motion preferences.", "The README documents the states, artwork policy and verification suite. Those tests were not rerun for this integration. Permission to display art on its original site does not transfer artwork rights."],
    url: "https://github.com/ZaraTakion/biya-landing/blob/6ed584e396d97af38b87fd8f91ab133dce44a0ea/README.md",
  },
  "Bird — Sky Atelier": {
    pt: ["Como apresentar uma galeria sem prometer acesso ao código privado?", "O catálogo fornecido descreve galeria, lightbox, teclado e idiomas PT/EN/JA. O estudo aponta para a demonstração pública; não oferece um repositório inacessível ao visitante.", "A evidência disponível aqui é o catálogo revisado e a captura pública preexistente. O código privado e todos os estados da galeria não foram auditados nesta tarefa. Direitos: Passarinho122 e titulares; retrato original creditado a @Najinajimi."],
    en: ["How can a gallery be presented without promising access to private source?", "The supplied catalog describes a gallery, lightbox, keyboard navigation and PT/EN/JA. This case links the public demo and does not offer visitors an inaccessible repository.", "Evidence available here is the reviewed catalog and the existing public screenshot. Private source and every gallery state were not audited in this task. Rights: Passarinho122 and rights holders; the original portrait is credited to @Najinajimi."],
    url: "https://bird122-sky.zaratakion.workers.dev/",
  },
} as const;

export function CaseNotes({ title, locale }: { title: string; locale: Locale }) {
  if (!(title in notes)) return null;
  const note = notes[title as keyof typeof notes];
  const [question, decision, evidence] = note[locale];
  return <section className="case-notes" aria-label={locale === "pt" ? `Caderno de decisões: ${title}` : `Decision notes: ${title}`}>
    <p className="eyebrow">{locale === "pt" ? "CADERNO DE DECISÕES" : "DECISION NOTES"}</p>
    <h4>{question}</h4>
    <p>{decision}</p>
    <p>{evidence}</p>
    <div className="evidence-links"><a className="text-link" href={note.url}>
      {locale === "pt" ? "Conferir fonte e limites" : "Review source and boundaries"} ↗
    </a></div>
  </section>;
}
