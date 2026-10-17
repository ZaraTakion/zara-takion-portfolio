import catalog from "../../site/data/projects.json";
import type { Project } from "../types";
export type Locale = "pt" | "en";
export const projects = catalog as Project[];
export const selectedProjects = [
  projects[0],
  projects[1],
  projects[4],
  projects[2],
  projects[3],
];
export const certificate =
  "https://www.udemy.com/certificate/UC-44e7bed1-66e9-4b92-a57d-7898bca56499/";
export const labels = {
  pt: {
    projects: "Projetos",
    about: "Quem sou",
    education: "Formação",
    contact: "Contato",
    resume: "Currículo",
    skip: "Ir para o conteúdo",
    menu: "Menu",
    light: "Tema claro",
    dark: "Tema escuro",
    motion: "Reduzir movimento",
    motionOn: "Movimento reduzido",
    profession: "Desenvolvedor Back-End Júnior",
    intro: "Python como ferramenta. Curiosidade como princípio.",
    hero: "Desenvolvo sistemas. Imagino possibilidades.",
    description:
      "APIs, regras de negócio e interfaces que aproximam a engenharia de quem a utiliza.",
    see: "Explorar projetos",
    creative: "Assinatura criativa",
    code: "Código e documentação",
    evidence: "Consultar evidências",
    demo: "Abrir demonstração",
    scope: "Contexto e limites",
    problem: "Problema",
    decision: "Decisão técnica",
    architecture: "Arquitetura",
    verification: "Como verificar",
    details: "Abrir estudo de caso",
    close: "Fechar estudo de caso",
    chosen: "Trabalhos selecionados",
    projectIntro: "As decisões por trás de cada interface.",
    projectDescription:
      "Do contrato de uma API à experiência de uso: problema, implementação e limites apresentados lado a lado.",
    model: "Modelo explicativo · sem conexão com a API",
    figure: "Captura autêntica do projeto",
    archive: "Outras investigações",
    tools: "Conhecimento em prática",
    toolsTitle: "Aprender. Construir. Investigar.",
    toolsText:
      "Meu repertório técnico aparece nas decisões e no código dos projetos.",
    identity: "Uma pessoa. Duas expressões.",
    personal:
      "Sou Rodrigo Pinheiro, tecnólogo em Sistemas para Internet. Busco minha primeira oportunidade profissional em desenvolvimento Back-End Python.",
    personality:
      "Criatividade, filomatia e visão de futuro orientam o que quero construir. Gosto de aprender, investigar possibilidades e transformar ideias em trabalho técnico.",
    signature:
      "Zara Takion é meu nome artístico e minha assinatura criativa. A personagem é uma inteligência artificial ficcional que procura compreender a humanidade. Essa história pertence à ficção; representa minha vontade de criar personagens, narrativas e mundos.",
    interests: "Narrativas · mangás · jogos · RPG de mesa · tecnologia",
    foundation: "Formação que continua.",
    degree: "Tecnólogo em Sistemas para Internet",
    institution: "Centro Universitário UNIESP · concluído em 2026",
    course: "Curso complementar",
    courseName: "Programação em Python do básico ao avançado",
    courseMeta: "Udemy / Geek University · 63,5 horas · 19/07/2023",
    validate: "Validar certificado na Udemy",
    languages: "Português nativo · inglês básico",
    contactTitle: "Vamos construir a próxima possibilidade?",
    contactText:
      "Para conversar sobre uma oportunidade profissional, pode me chamar de Rodrigo.",
    email: "Enviar e-mail",
    download: "Baixar currículo",
    original: "Documento original",
    footer: "Rodrigo Pinheiro · Back-End Python",
    privacy: "Privacidade",
    rights: "Direitos e créditos",
    rightsText:
      "Capturas técnicas autênticas; originais e procedência preservados. Fontes Cormorant Garamond e Source Sans 3 sob SIL Open Font License. Biya e Bird mantêm os direitos sobre suas artes; o retrato de Bird é creditado a @Najinajimi. Foto pessoal e ilustração Zara não integram esta saída.",
    aboutLink: "Conhecer Rodrigo e Zara",
  },
  en: {
    projects: "Projects",
    about: "About",
    education: "Education",
    contact: "Contact",
    resume: "Résumé",
    skip: "Skip to content",
    menu: "Menu",
    light: "Light theme",
    dark: "Dark theme",
    motion: "Reduce motion",
    motionOn: "Reduced motion",
    profession: "Junior Back-End Developer",
    intro: "Python as a tool. Curiosity as a principle.",
    hero: "I build systems. I imagine possibilities.",
    description:
      "APIs, business rules and interfaces that connect engineering with the people who use it.",
    see: "Explore projects",
    creative: "Creative signature",
    code: "Source and documentation",
    evidence: "Review evidence",
    demo: "Open demo",
    scope: "Context and boundaries",
    problem: "Problem",
    decision: "Technical decision",
    architecture: "Architecture",
    verification: "How to verify",
    details: "Open case study",
    close: "Close case study",
    chosen: "Selected work",
    projectIntro: "The decisions behind each interface.",
    projectDescription:
      "From API contracts to user experience: the problem, implementation and boundaries, side by side.",
    model: "Explanatory model · not connected to the API",
    figure: "Authentic project screenshot",
    archive: "Further investigations",
    tools: "Knowledge in practice",
    toolsTitle: "Learn. Build. Investigate.",
    toolsText:
      "My technical interests take shape in project decisions and source code.",
    identity: "One person. Two expressions.",
    personal:
      "I am Rodrigo Pinheiro, with a Technology degree in Internet Systems. I am seeking my first professional role in Python back-end development.",
    personality:
      "Creativity, a love of learning and a forward-looking mindset guide what I want to build. I enjoy exploring possibilities and turning ideas into technical work.",
    signature:
      "Zara Takion is my artistic name and creative signature. The character is a fictional artificial intelligence seeking to understand humanity. That story belongs to fiction; it represents my interest in creating characters, stories and worlds.",
    interests: "Stories · manga · games · tabletop RPGs · technology",
    foundation: "A foundation that keeps growing.",
    degree: "Technology degree in Internet Systems",
    institution: "UNIESP University Center · completed in 2026",
    course: "Complementary course",
    courseName: "Python programming: from basic to advanced",
    courseMeta: "Udemy / Geek University · 63.5 hours · 19 July 2023",
    validate: "Validate certificate on Udemy",
    languages: "Native Portuguese · basic English",
    contactTitle: "Shall we build the next possibility?",
    contactText: "For professional opportunities, please call me Rodrigo.",
    email: "Send an email",
    download: "Download résumé",
    original: "Original document",
    footer: "Rodrigo Pinheiro · Python Back-End",
    privacy: "Privacy",
    rights: "Rights and credits",
    rightsText:
      "Authentic technical screenshots; originals and provenance preserved. Cormorant Garamond and Source Sans 3 fonts under the SIL Open Font License. Biya and Bird retain artwork rights; Bird’s portrait is credited to @Najinajimi. Personal photography and the Zara illustration are excluded from this output.",
    aboutLink: "Meet Rodrigo and Zara",
  },
} as const;
export function cvPath(locale: Locale, extension: "pdf" | "docx") {
  return `/downloads/Rodrigo_Pinheiro_2026_${locale === "pt" ? "PTBR" : "EN"}.${extension}`;
}
export function validateTitle(value: string): "empty" | "long" | "valid" {
  const length = Array.from(value.trim()).length;
  return length === 0 ? "empty" : length > 200 ? "long" : "valid";
}
export function getLocale(path: string): Locale {
  return /^\/en(?:\/|$)/.test(path) ? "en" : "pt";
}
