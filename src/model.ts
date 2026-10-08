import type { Locale, Project, ProjectTrack, SectionKey } from "./types";

export const sections: SectionKey[] = ["home", "projects", "about", "archive", "education", "contact", "terminal"];
export const slugMap: Record<Exclude<SectionKey, "terminal">, { pt: string; en: string }> = {
  home: { pt: "inicio", en: "home" },
  projects: { pt: "projetos", en: "projects" },
  about: { pt: "sobre", en: "about" },
  archive: { pt: "arquivo", en: "archive" },
  education: { pt: "formacao", en: "education" },
  contact: { pt: "contato", en: "contact" },
};
export const slugFor = (key: Exclude<SectionKey, "terminal">, locale: Locale) => slugMap[key][locale];
export function keyFromHash(hash: string): SectionKey | null {
  const id = hash.replace(/^#/, "");
  for (const [key, locales] of Object.entries(slugMap)) {
    if (id === locales.pt || id === locales.en) return key as SectionKey;
  }
  return null;
}
export function filterProjects(projects: Project[], track: ProjectTrack): Project[] {
  return track === "all" ? projects : projects.filter(project => project.track === track);
}
export function projectText(project: Project, locale: Locale) {
  return {
    title: locale === "pt" ? project.title : project.title_en,
    category: locale === "pt" ? project.category : project.category_en,
    description: locale === "pt" ? project.description : project.description_en,
    alt: locale === "pt" ? project.alt : project.alt_en,
    note: locale === "pt" ? project.visual_note : project.visual_note_en,
    caseStudy: locale === "pt" ? project.case_study : project.case_study_en,
    highlights: locale === "pt" ? project.highlights ?? [] : project.highlights_en ?? [],
  };
}
