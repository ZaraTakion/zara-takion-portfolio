#!/usr/bin/env python3
"""Validate portfolio content and assemble static Cloudflare Worker assets."""

from __future__ import annotations

import json
import html
import re
import shutil
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "site"
OUTPUT = ROOT / "dist"
STYLESHEETS = (
    "aqua-workstation.css",
    "aqua-v2.css",
)
REQUIRED_PROJECT_FIELDS = {
    "title",
    "title_en",
    "category",
    "category_en",
    "description",
    "description_en",
    "technologies",
    "url",
    "image",
    "alt",
    "alt_en",
    "visual_note",
    "visual_note_en",
    "featured",
    "track",
}


class _DocumentAuditParser(HTMLParser):
    """Collect structural facts used by the build-time HTML audit."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.ids: list[str] = []
        self.references: list[tuple[str, str]] = []
        self.local_urls: list[tuple[str, str]] = []
        self.h1_count = 0
        self.errors: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = {name: value for name, value in attrs if value is not None}
        element_id = values.get("id")
        if element_id:
            self.ids.append(element_id)

        if tag == "h1":
            self.h1_count += 1

        for attribute in ("aria-labelledby", "aria-describedby", "aria-controls"):
            value = values.get(attribute)
            if value:
                for target in value.split():
                    self.references.append((attribute, target))

        if tag == "img" and "alt" not in values:
            self.errors.append("imagem sem atributo alt")

        if values.get("target") == "_blank":
            rel = set((values.get("rel") or "").split())
            if not {"noopener", "noreferrer"}.issubset(rel):
                self.errors.append(f'link target="_blank" sem rel="noopener noreferrer": {values.get("href", "") or tag}')

        for attribute in ("href", "src"):
            value = values.get(attribute)
            if value:
                self.local_urls.append((attribute, value))


def _parse_document(path: Path) -> _DocumentAuditParser:
    parser = _DocumentAuditParser()
    parser.feed(path.read_text(encoding="utf-8"))
    parser.close()
    return parser


def validate_html_document(path: Path, *, check_local_files: bool = False) -> None:
    """Fail the build on broken IDs, ARIA references, local links, or unsafe new-tab links."""
    parser = _parse_document(path)
    errors = list(parser.errors)

    duplicates = sorted({item for item in parser.ids if parser.ids.count(item) > 1})
    if duplicates:
        errors.append(f"IDs duplicados: {', '.join(duplicates)}")

    known_ids = set(parser.ids)
    for attribute, target in parser.references:
        if target not in known_ids:
            errors.append(f'{attribute} aponta para ID inexistente: {target}')

    if parser.h1_count != 1:
        errors.append(f"a página precisa conter exatamente um h1; encontrado(s): {parser.h1_count}")

    if check_local_files:
        document_root = OUTPUT
        for attribute, raw_url in parser.local_urls:
            parsed = urlparse(raw_url)
            if parsed.scheme or parsed.netloc or raw_url.startswith(("mailto:", "tel:", "data:")):
                continue

            if raw_url.startswith("#"):
                target = raw_url[1:]
                if target and target not in known_ids:
                    errors.append(f"âncora interna aponta para ID inexistente: {raw_url}")
                continue

            local_path = parsed.path
            if not local_path:
                continue

            if local_path.startswith("/"):
                candidate = document_root / local_path.lstrip("/")
            else:
                candidate = path.parent / local_path

            if local_path.endswith("/"):
                candidate = candidate / "index.html"
            elif candidate.is_dir():
                candidate = candidate / "index.html"

            if not candidate.exists():
                errors.append(f"{attribute} local inexistente: {raw_url}")

    if errors:
        relative = path.relative_to(ROOT)
        formatted = "\n - ".join(errors)
        raise ValueError(f"Falha na auditoria HTML de {relative}:\n - {formatted}")


def validate_generated_site() -> None:
    for path in sorted(OUTPUT.rglob("*.html")):
        validate_html_document(path, check_local_files=True)



def validate_projects() -> None:
    path = SOURCE / "data" / "projects.json"
    projects = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(projects, list) or not projects:
        raise ValueError("A lista de projetos precisa conter ao menos um item.")

    featured_count = 0
    for index, project in enumerate(projects, start=1):
        if not isinstance(project, dict):
            raise ValueError(f"Projeto {index} precisa ser um objeto.")
        missing = REQUIRED_PROJECT_FIELDS - project.keys()
        if missing:
            raise ValueError(f"Projeto {index} sem os campos: {', '.join(sorted(missing))}.")
        text_fields = REQUIRED_PROJECT_FIELDS - {"technologies", "featured"}
        if not all(isinstance(project[key], str) and project[key].strip() for key in text_fields):
            raise ValueError(f"Projeto {index} contém um campo de texto vazio.")
        if not isinstance(project["featured"], bool):
            raise ValueError(f"Projeto {index} precisa informar se está em destaque.")
        if project["track"] not in {"web", "api", "data"}:
            raise ValueError(f"Projeto {index} contém uma categoria de navegação inválida.")
        if project["featured"]:
            featured_count += 1
            for locale in ("case_study", "case_study_en"):
                details = project.get(locale)
                if not isinstance(details, dict) or not all(
                    isinstance(details.get(key), str) and details[key].strip()
                    for key in ("problem", "approach")
                ):
                    raise ValueError(f"Projeto em destaque {index} precisa de problema e implementação em {locale}.")
                extra_details = details.get("details", {})
                if not isinstance(extra_details, dict) or any(
                    key not in {"architecture", "verification", "boundary"}
                    or not isinstance(value, str)
                    or not value.strip()
                    for key, value in extra_details.items()
                ):
                    raise ValueError(f"Projeto em destaque {index} contém notas técnicas inválidas em {locale}.")
        if not isinstance(project["technologies"], list) or not project["technologies"]:
            raise ValueError(f"Projeto {index} precisa listar tecnologias.")
        parsed_url = urlparse(project["url"])
        if parsed_url.scheme != "https" or parsed_url.hostname != "github.com":
            raise ValueError(f"Link de projeto inválido: {project['url']}.")
        if project.get("demo_url"):
            parsed_demo_url = urlparse(project["demo_url"])
            if parsed_demo_url.scheme != "https" or not parsed_demo_url.hostname:
                raise ValueError(f"Link de demonstração inválido: {project['demo_url']}.")
        for field in ("highlights", "highlights_en"):
            if field in project and (
                not isinstance(project[field], list)
                or not all(isinstance(item, str) and item.strip() for item in project[field])
            ):
                raise ValueError(f"Projeto {index} contém destaques inválidos em {field}.")
        if not re.fullmatch(r"/assets/img/[A-Za-z0-9._-]+", project["image"]):
            raise ValueError(f"Caminho de imagem inválido: {project['image']}.")
        if not (SOURCE / project["image"].lstrip("/")).is_file():
            raise ValueError(f"Imagem local não encontrada: {project['image']}.")
    if featured_count != 3:
        raise ValueError("A seleção precisa conter exatamente três projetos em destaque.")


def render_project_card(project: dict[str, object], language: str) -> str:
    text = lambda value: html.escape(str(value), quote=True)
    is_english = language == "en"
    title = project["title_en"] if is_english else project["title"]
    category = project["category_en"] if is_english else project["category"]
    description = project["description_en"] if is_english else project["description"]
    alt = project["alt_en"] if is_english else project["alt"]
    visual_note = project["visual_note_en"] if is_english else project["visual_note"]
    period = project.get("period_en" if is_english else "period")
    tags = "".join(f"<li>{text(tag)}</li>" for tag in project["technologies"])
    highlights = project.get("highlights_en" if is_english else "highlights", [])
    highlight_label = "Project highlights" if is_english else "Destaques do projeto"
    highlight_html = ""
    if highlights:
        items = "".join(f"<li>{text(item)}</li>" for item in highlights)
        highlight_html = f'<ul class="project-highlights" aria-label="{highlight_label}">{items}</ul>'
    period_html = f'<p class="project-period">{text(period)}</p>' if period else ""
    repository_label = "View repository" if is_english else "Ver repositório"
    demo_label = "Live demo" if is_english else "Abrir demonstração"
    tech_label = "Technologies used" if is_english else "Tecnologias utilizadas"
    project_window_label = "PROJECT FILE" if is_english else "ARQUIVO DO PROJETO"
    card_class = "project-card featured" if project.get("featured") else "project-card"
    case_study = project.get("case_study_en" if is_english else "case_study") if project.get("featured") else None
    case_html = ""
    if case_study:
        problem_label = "Problem" if is_english else "Problema"
        approach_label = "Implementation" if is_english else "Implementação"
        details = case_study.get("details", {})
        detail_labels = {
            "architecture": "Architecture" if is_english else "Arquitetura",
            "verification": "Verification" if is_english else "Verificação",
            "boundary": "Operational note" if is_english else "Limite operacional",
        }
        extra_rows = "".join(
            f'<div><dt>{detail_labels[key]}</dt><dd>{text(details[key])}</dd></div>'
            for key in detail_labels
            if isinstance(details, dict) and details.get(key)
        )
        more_label = "Technical notes" if is_english else "Notas técnicas"
        more_html = (
            f'<details class="project-case-more"><summary>{more_label}</summary>'
            f'<dl class="project-case-study">{extra_rows}</dl></details>'
            if extra_rows else ""
        )
        case_html = (
            '<dl class="project-case-study">'
            f'<div><dt>{problem_label}</dt><dd>{text(case_study["problem"])}</dd></div>'
            f'<div><dt>{approach_label}</dt><dd>{text(case_study["approach"])}</dd></div>'
            '</dl>'
            f'{more_html}'
        )
    actions = []
    if project.get("demo_url"):
        actions.append(f'<a class="project-link" href="{text(project["demo_url"])}" target="_blank" rel="noopener noreferrer">{demo_label} <span aria-hidden="true">↗</span></a>')
    actions.append(f'<a class="project-link" href="{text(project["url"])}" target="_blank" rel="noopener noreferrer">{repository_label} <span aria-hidden="true">↗</span></a>')
    return f"""<article class="{card_class}" data-project-track="{text(project["track"])}">
  <div class="project-windowbar" aria-hidden="true"><span class="window-controls"><i></i><i></i></span><span>{project_window_label} · {text(title)}</span><span class="window-close">×</span></div>
  <figure class="project-visual">
    <img src="{text(project["image"])}" alt="{text(alt)}" width="640" height="360" loading="lazy">
    <figcaption>{text(visual_note)}</figcaption>
  </figure>
  <div class="project-copy">
    <p class="project-category">{text(category)}</p>
    {period_html}
    <h3>{text(title)}</h3>
    <p class="project-description">{text(description)}</p>
    {case_html}
    {highlight_html}
    <ul class="project-tags" aria-label="{tech_label}">{tags}</ul>
    <div class="project-actions">{"".join(actions)}</div>
  </div>
</article>"""


def render_projects(language: str = "pt") -> tuple[str, str]:
    projects = json.loads((SOURCE / "data" / "projects.json").read_text(encoding="utf-8"))
    featured = [project for project in projects if project["featured"]]
    archive = [project for project in projects if not project["featured"]]
    return (
        "\n".join(render_project_card(project, language) for project in featured),
        "\n".join(render_project_card(project, language) for project in archive),
    )


def render_page(source_path: Path, output_path: Path, language: str) -> None:
    source_html = source_path.read_text(encoding="utf-8")
    markers = (
        ("<!-- PROJECTS:FEATURED:START -->", "<!-- PROJECTS:FEATURED:END -->"),
        ("<!-- PROJECTS:ARCHIVE:START -->", "<!-- PROJECTS:ARCHIVE:END -->"),
    )
    rendered_groups = render_projects(language)
    built_html = source_html
    for (start_marker, end_marker), rendered in zip(markers, rendered_groups):
        if built_html.count(start_marker) != 1 or built_html.count(end_marker) != 1:
            raise ValueError(f"{source_path.relative_to(ROOT)} precisa conter exatamente os marcadores {start_marker} e {end_marker}.")
        start = built_html.index(start_marker) + len(start_marker)
        end = built_html.index(end_marker)
        if end <= start:
            raise ValueError(f"Marcadores de projetos fora de ordem em {source_path.relative_to(ROOT)}.")
        built_html = built_html[:start] + "\n" + rendered + "\n          " + built_html[end:]
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(built_html, encoding="utf-8")


def build_stylesheet() -> str:
    """Combine source CSS modules in a stable order for one production request."""
    chunks = []
    for filename in STYLESHEETS:
        path = SOURCE / "styles" / filename
        if not path.is_file():
            raise FileNotFoundError(f"Folha de estilo obrigatória ausente: {path.relative_to(ROOT)}")
        chunks.append(f"/* --- {filename} --- */\n" + path.read_text(encoding="utf-8").strip())
    return "\n\n".join(chunks) + "\n"


def build() -> None:
    for required_path in (
        SOURCE / "index.html",
        SOURCE / "en" / "index.html",
        SOURCE / "404.html",
        SOURCE / "privacidade.html",
        SOURCE / "en" / "privacy.html",
        SOURCE / "robots.txt",
        SOURCE / "sitemap.xml",
        SOURCE / "scripts" / "main.js",
        SOURCE / "scripts" / "project-filters.js",
        SOURCE / "scripts" / "navigation.js",
        SOURCE / "scripts" / "project-explorer.js",
        SOURCE / "scripts" / "retro-desktop.js",
    ):
        if not required_path.is_file():
            raise FileNotFoundError(f"Arquivo obrigatório ausente: {required_path.relative_to(ROOT)}")

    validate_html_document(SOURCE / "index.html")
    validate_html_document(SOURCE / "en" / "index.html")
    validate_projects()
    if OUTPUT.exists():
        shutil.rmtree(OUTPUT)
    shutil.copytree(SOURCE, OUTPUT, ignore=shutil.ignore_patterns("styles"))
    render_page(SOURCE / "index.html", OUTPUT / "index.html", "pt")
    render_page(SOURCE / "en" / "index.html", OUTPUT / "en" / "index.html", "en")
    css_output = OUTPUT / "assets" / "css" / "site.css"
    css_output.parent.mkdir(parents=True, exist_ok=True)
    css_output.write_text(build_stylesheet(), encoding="utf-8")
    validate_generated_site()
    print(f"Site preparado em {OUTPUT.relative_to(ROOT)}.")


if __name__ == "__main__":
    build()
