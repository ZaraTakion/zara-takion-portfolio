from __future__ import annotations

import json
import unittest

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
        self.assertIn('class="contact-direct-links"', built_html)
        self.assertIn('data-desktop-start', built_html)
        self.assertIn('data-desktop-boot', built_html)
        self.assertIn('data-app-open="projetos"', built_html)
        self.assertIn('<title>Zara Takion.exe — Desenvolvedor Web</title>', built_html)
        self.assertIn('property="og:site_name" content="Zara Takion.exe"', built_html)
        self.assertIn('mailto:rm20022101@gmail.com', built_html)
        self.assertIn('href="/privacidade.html"', built_html)
        self.assertIn("Ver repositório", built_html)
        self.assertNotIn("tel:+55", built_html)
        self.assertIn("Django REST Framework", built_html)
        self.assertIn("Os testes unittest cobrem o CRUD", built_html)
        self.assertIn("não demonstram desempenho preditivo superior ao baseline da média", built_html)
        self.assertNotIn("rodzmaciel21@gmail.com", built_html)
        self.assertNotIn('id="contact-form"', built_html)
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
        self.assertIn('class="contact-direct-links"', english)
        self.assertIn('href="/" hreflang="pt-BR"', english)
        self.assertIn('data-app-open="projects"', english)
        self.assertIn('<title>Zara Takion.exe — Web Developer</title>', english)
        self.assertIn('property="og:site_name" content="Zara Takion.exe"', english)
        self.assertNotIn('id="contact-form"', english)
        self.assertNotIn("tel:+55", english)

    def test_build_includes_404_and_privacy_pages(self):
        build_site.build()
        self.assertTrue((build_site.OUTPUT / "404.html").is_file())
        not_found = (build_site.OUTPUT / "404.html").read_text(encoding="utf-8")
        self.assertIn('lang="en" aria-label="English error message"', not_found)
        self.assertIn("This file is not in this volume.", not_found)
        self.assertIn("Página não encontrada — Zara Takion.exe", not_found)
        privacy = (build_site.OUTPUT / "privacidade.html").read_text(encoding="utf-8")
        self.assertIn("Política de privacidade", privacy)
        self.assertIn("rm20022101@gmail.com", privacy)
        english_privacy = (build_site.OUTPUT / "en" / "privacy.html").read_text(encoding="utf-8")
        self.assertIn('<html lang="en">', english_privacy)
        self.assertIn("Privacy policy", english_privacy)
        self.assertIn("Privacy Policy — Zara Takion.exe", english_privacy)
        portuguese_privacy = (build_site.OUTPUT / "privacidade.html").read_text(encoding="utf-8")
        self.assertIn("Privacidade — Zara Takion.exe", portuguese_privacy)

    def test_build_includes_search_crawl_files(self):
        build_site.build()
        self.assertTrue((build_site.OUTPUT / "robots.txt").is_file())
        sitemap = (build_site.OUTPUT / "sitemap.xml").read_text(encoding="utf-8")
        self.assertIn("https://zara-takion-portfolio.rodzmaciel21.workers.dev/en/", sitemap)
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
        filters = (build_site.SOURCE / "scripts" / "project-filters.js").read_text(encoding="utf-8")
        for html in (portuguese, english):
            is_portuguese = '<html lang="pt-BR">' in html
            with self.subTest(language="pt-BR" if is_portuguese else "en"):
                self.assertIn('class="digital-profile"', html)
                self.assertIn('id="projetos"' if is_portuguese else 'id="projects"', html)
                self.assertIn('id="contato"' if is_portuguese else 'id="contact"', html)
                self.assertIn('class="contact-direct-links"', html)
                self.assertIn('data-desktop-start', html)
                self.assertIn('data-desktop-boot', html)
                self.assertIn('aria-controls="main-nav"', html)
                self.assertIn('type="module" src="/scripts/main.js"', html)
        self.assertIn("@media (max-width: 800px)", css)
        self.assertIn('matchMedia("(min-width: 801px)")', navigation)
        self.assertIn('data-project-filters', portuguese)
        self.assertIn('data-project-filters', english)
        self.assertIn('aria-pressed', filters)
        self.assertIn('project-filters.css', css)
        self.assertIn('retro-desktop.css', css)
        self.assertIn('.retro-desktop-stage.retro-enhanced > .boot-screen:not([hidden])', css)
        self.assertIn('mobile-app-open > #projects.retro-app-window.is-mobile-active', css)
        self.assertGreater(css.rfind('@media (max-width: 390px)'), css.rfind('@media (max-width: 800px)'))
        narrow_phone_rules = css.rsplit('@media (max-width: 390px)', 1)[-1]
        self.assertIn('.project-archive-grid .project-card { grid-template-columns: minmax(0, 1fr); }', narrow_phone_rules)
        self.assertIn('@media (min-width: 1800px) and (min-height: 1000px)', css)
        self.assertIn('width: min(48vw, 1400px)', css)
        self.assertIn("prefers-reduced-motion: reduce", css)
        self.assertNotIn("overflow-x: hidden", css)
        self.assertNotIn("overflow-x: clip", css)

    def test_build_bundles_modular_styles_without_serving_source_modules(self):
        build_site.build()
        bundled_css = (build_site.OUTPUT / "assets" / "css" / "site.css").read_text(encoding="utf-8")
        self.assertIn("/* --- tokens.css --- */", bundled_css)
        self.assertIn("/* --- responsive.css --- */", bundled_css)
        self.assertFalse((build_site.OUTPUT / "styles").exists())

    def test_cloudflare_worker_configuration_and_headers_are_in_build_output(self):
        build_site.build()
        config = (build_site.ROOT / "wrangler.jsonc").read_text(encoding="utf-8")
        headers = (build_site.OUTPUT / "_headers").read_text(encoding="utf-8")
        self.assertIn('"name": "zara-takion-portfolio"', config)
        self.assertIn('"directory": "./dist"', config)
        self.assertIn("Content-Security-Policy:", headers)
        self.assertTrue((build_site.OUTPUT / "404.html").is_file())

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
