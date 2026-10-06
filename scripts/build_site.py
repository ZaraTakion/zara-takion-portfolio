#!/usr/bin/env python3
"""Validate the site content and assemble the static Netlify publish folder."""

from __future__ import annotations

import json
import html
import os
import re
import shutil
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "site"
OUTPUT = ROOT / "dist"
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
    "featured",
}


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
    return f"""<article class="{card_class}">
  <div class="project-visual">
    <img src="{text(project["image"])}" alt="{text(alt)}" width="640" height="360" loading="lazy">
  </div>
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


def api_config_script() -> str:
    api_base_url = os.environ.get("PORTFOLIO_API_BASE_URL", "").strip().rstrip("/")
    if api_base_url:
        parsed_url = urlparse(api_base_url)
        is_local_http = parsed_url.scheme == "http" and parsed_url.hostname in {"127.0.0.1", "localhost"}
        if parsed_url.scheme != "https" and not is_local_http:
            raise ValueError("PORTFOLIO_API_BASE_URL precisa usar HTTPS (HTTP só é permitido em localhost).")
    return "window.PORTFOLIO_CONFIG = Object.freeze(" + json.dumps(
        {
            "apiBaseUrl": api_base_url,
            "netlifyFormsEnabled": os.environ.get("NETLIFY", "").lower() == "true",
        },
        ensure_ascii=False,
    ) + ");\n"


def build() -> None:
    for required_path in (
        SOURCE / "index.html",
        SOURCE / "en" / "index.html",
        SOURCE / "404.html",
        SOURCE / "privacidade.html",
        SOURCE / "en" / "privacy.html",
        SOURCE / "robots.txt",
        SOURCE / "sitemap.xml",
        SOURCE / "assets" / "css" / "site.css",
        SOURCE / "assets" / "js" / "main.js",
    ):
        if not required_path.is_file():
            raise FileNotFoundError(f"Arquivo obrigatório ausente: {required_path.relative_to(ROOT)}")

    validate_projects()
    if OUTPUT.exists():
        shutil.rmtree(OUTPUT)
    shutil.copytree(SOURCE, OUTPUT)
    render_page(SOURCE / "index.html", OUTPUT / "index.html", "pt")
    render_page(SOURCE / "en" / "index.html", OUTPUT / "en" / "index.html", "en")
    (OUTPUT / "config.js").write_text(api_config_script(), encoding="utf-8")
    print(f"Site preparado em {OUTPUT.relative_to(ROOT)}.")


if __name__ == "__main__":
    build()
