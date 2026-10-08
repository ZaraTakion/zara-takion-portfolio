export type Locale = "pt" | "en";
export type SectionKey = "home" | "projects" | "about" | "archive" | "education" | "contact" | "terminal";
export type ProjectTrack = "all" | "web" | "api" | "data";
export type CaseDetails = {
  problem: string;
  approach: string;
  details?: { architecture?: string; verification?: string; boundary?: string };
};
export type Project = {
  title: string; title_en: string; category: string; category_en: string;
  description: string; description_en: string;
  track: Exclude<ProjectTrack, "all">;
  technologies: string[]; featured: boolean; url: string; demo_url?: string;
  image: string; alt: string; alt_en: string;
  visual_note: string; visual_note_en: string;
  period?: string; period_en?: string;
  case_study?: CaseDetails; case_study_en?: CaseDetails;
  highlights?: string[]; highlights_en?: string[];
};
