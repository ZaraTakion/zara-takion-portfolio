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
        css = (build_site.SOURCE / "assets" / "css" / "site.css").read_text(encoding="utf-8")
        self.assertNotIn("overflow-x: clip", css)
        self.assertIn("@media (forced-colors: active)", css)

    def test_build_renders_complete_english_portfolio(self):
        build_site.build()
        english = (build_site.OUTPUT / "en" / "index.html").read_text(encoding="utf-8")
        self.assertIn('<html lang="en">', english)
        self.assertIn("Junior Web Developer", english)
        self.assertIn("Technology degree in Internet Systems", english)
        self.assertIn("intermediate, with B2 reading proficiency", english)
        self.assertIn("UPA — Academic Portal", english)
        self.assertIn("View repository", english)
        self.assertIn("Technical notes", english)
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

    def test_every_project_cover_exists_locally(self):
        build_site.validate_projects()
        projects = json.loads((build_site.SOURCE / "data" / "projects.json").read_text(encoding="utf-8"))
        for project in projects:
            with self.subTest(project=project["title"]):
                self.assertTrue((build_site.SOURCE / project["image"].lstrip("/")).is_file())

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


if __name__ == "__main__":
    unittest.main()
