from __future__ import annotations

import json
import os
import unittest
from unittest.mock import patch

from scripts import build_site


class StaticBuildTests(unittest.TestCase):
    def test_build_renders_project_content_into_accessible_html(self):
        build_site.build()
        built_html = (build_site.OUTPUT / "index.html").read_text(encoding="utf-8")
        self.assertIn("<h3>Air Quality Analysis</h3>", built_html)
        self.assertIn('alt="Gráfico original com a média de PM2.5 por cidade, calculado a partir dos dados do projeto"', built_html)
        projects = json.loads((build_site.SOURCE / "data" / "projects.json").read_text(encoding="utf-8"))
        self.assertEqual(built_html.count('<article class="project-card'), len(projects))
        self.assertEqual(built_html.count('<article class="project-card featured"'), 3)
        self.assertIn('class="project-visual"', built_html)
        self.assertIn('data-project-track="web"', built_html)
        self.assertIn('data-project-track="api"', built_html)
        self.assertIn('data-project-track="data"', built_html)
        self.assertIn('data-project-filter="all"', built_html)
        self.assertIn('data-project-filter="api"', built_html)
        self.assertIn('class="project-windowbar"', built_html)
        self.assertIn("Ilustração conceitual — não é captura de tela", built_html)
        self.assertIn("Diagrama das rotas e da persistência SQLite", built_html)
        self.assertLess(built_html.index('<h3>UPA — Portal Acadêmico</h3>'), built_html.index('<h3>Task Manager API</h3>'))
        self.assertLess(built_html.index('<h3>Task Manager API</h3>'), built_html.index('<h3>Chamados API</h3>'))
        self.assertLess(built_html.index('class="project-archive-grid"'), built_html.index('<h3>Air Quality Analysis</h3>'))
        self.assertNotIn('class="project-number"', built_html)
        self.assertLess(built_html.index('id="projetos"'), built_html.index('id="sobre"'))
        for repository in (
            "nba-dashboard",
            "air-quality-analysis",
            "brazil-traffic-insight",
            "steam-price-predictor",
            "task-manager-backend",
            "chamados-api",
        ):
            with self.subTest(repository=repository):
                self.assertIn(f"https://github.com/ZaraTakion/{repository}", built_html)
        self.assertIn("<!-- PROJECTS:ARCHIVE:END -->", built_html)
        self.assertIn('data-netlify="true"', built_html)
        self.assertIn('name="form-name" value="contact"', built_html)
        self.assertIn('mailto:rm20022101@gmail.com', built_html)
        self.assertIn('href="/privacidade.html"', built_html)
        self.assertIn("Ver repositório", built_html)
        self.assertNotIn("tel:+55", built_html)
        self.assertIn("Django REST Framework", built_html)
        self.assertIn("Os testes unittest cobrem o CRUD", built_html)
        self.assertIn("não demonstram desempenho preditivo superior ao baseline da média", built_html)
        self.assertNotIn("rodzmaciel21@gmail.com", built_html)
        self.assertIn('minlength="10"', built_html)
        css = (build_site.OUTPUT / "assets" / "css" / "site.css").read_text(encoding="utf-8")
        self.assertNotIn("overflow-x: clip", css)
        self.assertIn("@media (forced-colors: active)", css)

    def test_build_renders_complete_english_portfolio(self):
        build_site.build()
        english = (build_site.OUTPUT / "en" / "index.html").read_text(encoding="utf-8")
        self.assertIn('<html lang="en">', english)
        self.assertIn("Junior Web Developer", english)
        self.assertIn("Technology degree in Internet Systems", english)
        self.assertIn("Intermediate · B2 reading proficiency", english)
        self.assertIn("UPA — Academic Portal", english)
        self.assertIn("View repository", english)
        self.assertIn("Technical notes", english)
        self.assertIn("Concept illustration — not a product screenshot", english)
        self.assertIn('minlength="10"', english)
        self.assertIn('href="/" hreflang="pt-BR"', english)
        self.assertIn('data-netlify="true"', english)
        self.assertNotIn("tel:+55", english)

    def test_build_includes_404_and_privacy_pages(self):
        build_site.build()
        self.assertTrue((build_site.OUTPUT / "404.html").is_file())
        not_found = (build_site.OUTPUT / "404.html").read_text(encoding="utf-8")
        self.assertIn('lang="en" aria-label="English error message"', not_found)
        self.assertIn("This file is not in this volume.", not_found)
        privacy = (build_site.OUTPUT / "privacidade.html").read_text(encoding="utf-8")
        self.assertIn("Política de privacidade", privacy)
        self.assertIn("rm20022101@gmail.com", privacy)
        english_privacy = (build_site.OUTPUT / "en" / "privacy.html").read_text(encoding="utf-8")
        self.assertIn('<html lang="en">', english_privacy)
        self.assertIn("Privacy policy", english_privacy)

    def test_build_includes_search_crawl_files(self):
        build_site.build()
        self.assertTrue((build_site.OUTPUT / "robots.txt").is_file())
        sitemap = (build_site.OUTPUT / "sitemap.xml").read_text(encoding="utf-8")
        self.assertIn("https://zara-takion-atelier.netlify.app/en/", sitemap)
        self.assertIn("hreflang=\"pt-BR\"", sitemap)

    def test_rebuilt_story_orders_work_before_profile_and_contact(self):
        build_site.build()
        html = (build_site.OUTPUT / "index.html").read_text(encoding="utf-8")
        sections = [
            'id="inicio"',
            'id="projetos"',
            'id="sobre"',
            'id="arquivo"',
            'id="formacao"',
            'id="contato"',
        ]
        positions = [html.index(section) for section in sections]
        self.assertEqual(positions, sorted(positions))
        self.assertIn("Desenvolvedor Web Júnior", html)
        self.assertIn("Back-end Python", html)
        self.assertIn("Django", html)

    def test_every_project_cover_exists_locally(self):
        build_site.validate_projects()
        projects = json.loads((build_site.SOURCE / "data" / "projects.json").read_text(encoding="utf-8"))
        for project in projects:
            with self.subTest(project=project["title"]):
                self.assertTrue((build_site.SOURCE / project["image"].lstrip("/")).is_file())

    def test_redesigned_interface_keeps_navigation_and_responsive_breakpoint_aligned(self):
        build_site.build()
        portuguese = (build_site.SOURCE / "index.html").read_text(encoding="utf-8")
        english = (build_site.SOURCE / "en" / "index.html").read_text(encoding="utf-8")
        css = (build_site.OUTPUT / "assets" / "css" / "site.css").read_text(encoding="utf-8")
        javascript = (build_site.SOURCE / "scripts" / "main.js").read_text(encoding="utf-8")
        navigation = (build_site.SOURCE / "scripts" / "navigation.js").read_text(encoding="utf-8")
        contact = (build_site.SOURCE / "scripts" / "contact.js").read_text(encoding="utf-8")
        filters = (build_site.SOURCE / "scripts" / "project-filters.js").read_text(encoding="utf-8")
        for html in (portuguese, english):
            is_portuguese = '<html lang="pt-BR">' in html
            with self.subTest(language="pt-BR" if is_portuguese else "en"):
                self.assertIn('class="hero-portrait"', html)
                self.assertIn('id="projetos"' if is_portuguese else 'id="projects"', html)
                self.assertIn('id="contato"' if is_portuguese else 'id="contact"', html)
                self.assertIn('data-netlify="true"', html)
                self.assertIn('aria-controls="main-nav"', html)
                self.assertIn('type="module" src="/scripts/main.js"', html)
        self.assertIn("@media (max-width: 800px)", css)
        self.assertIn('matchMedia("(min-width: 801px)")', navigation)
        self.assertIn('fetch(`${apiBaseUrl}/api/contact`', contact)
        self.assertIn('data-project-filters', portuguese)
        self.assertIn('data-project-filters', english)
        self.assertIn('aria-pressed', filters)
        self.assertIn('project-filters.css', css)
        self.assertIn('retro-desktop.css', css)
        self.assertIn("prefers-reduced-motion: reduce", css)
        self.assertNotIn("overflow-x: hidden", css)
        self.assertNotIn("overflow-x: clip", css)

    def test_build_bundles_modular_styles_without_serving_source_modules(self):
        build_site.build()
        bundled_css = (build_site.OUTPUT / "assets" / "css" / "site.css").read_text(encoding="utf-8")
        self.assertIn("/* --- tokens.css --- */", bundled_css)
        self.assertIn("/* --- responsive.css --- */", bundled_css)
        self.assertFalse((build_site.OUTPUT / "styles").exists())

    def test_build_writes_empty_api_config_by_default(self):
        with patch.dict(os.environ, {}, clear=True):
            build_site.build()
        config = (build_site.OUTPUT / "config.js").read_text(encoding="utf-8")
        self.assertIn('"apiBaseUrl": ""', config)
        self.assertIn('"netlifyFormsEnabled": false', config)

    def test_netlify_build_enables_native_form_submission(self):
        with patch.dict(os.environ, {"NETLIFY": "true"}, clear=True):
            config = build_site.api_config_script()
        self.assertIn('"netlifyFormsEnabled": true', config)

    def test_public_http_api_url_is_rejected(self):
        with patch.dict(os.environ, {"PORTFOLIO_API_BASE_URL": "http://api.example.com"}, clear=False):
            with self.assertRaises(ValueError):
                build_site.api_config_script()

    def test_local_http_api_url_is_allowed(self):
        with patch.dict(os.environ, {"PORTFOLIO_API_BASE_URL": "http://127.0.0.1:5000/"}, clear=False):
            config = build_site.api_config_script()
        self.assertIn("http://127.0.0.1:5000", config)

    def test_project_tracks_are_validated(self):
        projects_path = build_site.SOURCE / "data" / "projects.json"
        original = projects_path.read_text(encoding="utf-8")
        projects = json.loads(original)
        projects[0]["track"] = "misc"
        try:
            projects_path.write_text(json.dumps(projects), encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "categoria de navegação inválida"):
                build_site.validate_projects()
        finally:
            projects_path.write_text(original, encoding="utf-8")


if __name__ == "__main__":
    unittest.main()
