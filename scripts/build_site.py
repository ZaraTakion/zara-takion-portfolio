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
    "number",
    "title",
    "category",
    "description",
    "technologies",
    "url",
    "image",
    "alt",
}


def validate_projects() -> None:
    path = SOURCE / "data" / "projects.json"
    projects = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(projects, list) or not projects:
        raise ValueError("A lista de projetos precisa conter ao menos um item.")

    numbers: set[str] = set()
    for index, project in enumerate(projects, start=1):
        if not isinstance(project, dict):
            raise ValueError(f"Projeto {index} precisa ser um objeto.")
        missing = REQUIRED_PROJECT_FIELDS - project.keys()
        if missing:
            raise ValueError(f"Projeto {index} sem os campos: {', '.join(sorted(missing))}.")
        text_fields = REQUIRED_PROJECT_FIELDS - {"technologies"}
        if not all(isinstance(project[key], str) and project[key].strip() for key in text_fields):
            raise ValueError(f"Projeto {index} contém um campo de texto vazio.")
        if project["number"] in numbers:
            raise ValueError(f"Número de projeto duplicado: {project['number']}.")
        numbers.add(project["number"])
        if not isinstance(project["technologies"], list) or not project["technologies"]:
            raise ValueError(f"Projeto {index} precisa listar tecnologias.")
        parsed_url = urlparse(project["url"])
        if parsed_url.scheme != "https" or parsed_url.hostname != "github.com":
            raise ValueError(f"Link de projeto inválido: {project['url']}.")
        if not re.fullmatch(r"/assets/img/[A-Za-z0-9._-]+", project["image"]):
            raise ValueError(f"Caminho de imagem inválido: {project['image']}.")
        if project["image"].endswith(".svg") and not (SOURCE / project["image"].lstrip("/")).is_file():
            raise ValueError(f"Imagem local não encontrada: {project['image']}.")
        if project.get("fallback"):
            fallback_url = urlparse(project["fallback"])
            if fallback_url.scheme != "https" or fallback_url.hostname != "raw.githubusercontent.com":
                raise ValueError(f"Fallback de imagem inválido: {project['fallback']}.")


def render_project_card(project: dict[str, object]) -> str:
    text = lambda value: html.escape(str(value), quote=True)
    tags = "".join(f"<li>{text(tag)}</li>" for tag in project["technologies"])
    fallback = (
        f' data-fallback="{text(project["fallback"])}"'
        if project.get("fallback")
        else ""
    )
    return f"""<article class="project-card">
  <div class="project-visual">
    <img src="{text(project["image"])}" alt="{text(project["alt"])}" width="640" height="480" loading="lazy"{fallback}>
    <span class="project-number">{text(project["number"])}</span>
  </div>
  <div class="project-copy">
    <p class="project-category">{text(project["category"])}</p>
    <h3>{text(project["title"])}</h3>
    <p class="project-description">{text(project["description"])}</p>
    <ul class="project-tags" aria-label="Tecnologias utilizadas">{tags}</ul>
    <a class="project-link" href="{text(project["url"])}" target="_blank" rel="noopener noreferrer">Ver projeto <span aria-hidden="true">↗</span></a>
  </div>
</article>"""


def render_projects() -> str:
    projects = json.loads((SOURCE / "data" / "projects.json").read_text(encoding="utf-8"))
    return "\n".join(render_project_card(project) for project in projects)


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
        SOURCE / "404.html",
        SOURCE / "assets" / "css" / "site.css",
        SOURCE / "assets" / "js" / "main.js",
    ):
        if not required_path.is_file():
            raise FileNotFoundError(f"Arquivo obrigatório ausente: {required_path.relative_to(ROOT)}")

    validate_projects()
    source_html = (SOURCE / "index.html").read_text(encoding="utf-8")
    if source_html.count("<!-- PROJECTS:START -->") != 1 or source_html.count("<!-- PROJECTS:END -->") != 1:
        raise ValueError("A página precisa conter exatamente um marcador de projetos.")
    if OUTPUT.exists():
        shutil.rmtree(OUTPUT)
    shutil.copytree(SOURCE, OUTPUT)
    built_html = source_html.replace(
        "<!-- PROJECTS:START -->\n          <!-- PROJECTS:END -->",
        "<!-- PROJECTS:START -->\n" + render_projects() + "\n          <!-- PROJECTS:END -->",
    )
    if built_html == source_html:
        raise ValueError("Não foi possível inserir os cartões de projetos na página.")
    (OUTPUT / "index.html").write_text(built_html, encoding="utf-8")
    (OUTPUT / "config.js").write_text(api_config_script(), encoding="utf-8")
    print(f"Site preparado em {OUTPUT.relative_to(ROOT)}.")


if __name__ == "__main__":
    build()