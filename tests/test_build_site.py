from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from scripts import build_site


class StaticBuildTests(unittest.TestCase):
    def test_build_renders_projects_and_aqua_workstation_shell(self):
        build_site.build()
        html = (build_site.OUTPUT / "index.html").read_text(encoding="utf-8")
        projects = json.loads((build_site.SOURCE / "data" / "projects.json").read_text(encoding="utf-8"))

        self.assertEqual(html.count('<article class="project-card'), len(projects))
        self.assertEqual(html.count('<article class="project-card featured"'), 3)
        self.assertIn("<h3>Air Quality Analysis</h3>", html)
        self.assertIn('class="project-windowbar"', html)
        self.assertIn('data-project-track="web"', html)
        self.assertIn('data-project-track="api"', html)
        self.assertIn('data-project-track="data"', html)
        self.assertIn('class="desktop-statusbar"', html)
        self.assertIn("ZARA // AQUA WORKSTATION", html)
        self.assertIn('class="digital-avatar"', html)
        self.assertIn('/assets/img/oc-portrait.jpg', html)
        self.assertIn('data-app-open="inicio"', html)
        self.assertIn('data-app-open="projetos"', html)
        self.assertIn('data-desktop-start', html)
        self.assertIn('data-desktop-boot', html)
        self.assertIn('mailto:rm20022101@gmail.com', html)
        self.assertNotIn("tel:+55", html)

    def test_build_renders_complete_english_aqua_workstation(self):
        build_site.build()
        html = (build_site.OUTPUT / "en" / "index.html").read_text(encoding="utf-8")

        self.assertIn('<html lang="en">', html)
        self.assertIn("Zara // Aqua Workstation — Web Developer", html)
        self.assertIn("I build web systems that make sense", html)
        self.assertIn("Technology degree in Internet Systems", html)
        self.assertIn("Intermediate · B2 reading proficiency", html)
        self.assertIn('data-app-open="home"', html)
        self.assertIn('data-app-open="projects"', html)
        self.assertIn('href="/" hreflang="pt-BR"', html)
        self.assertIn("View repository", html)

    def test_build_uses_only_the_new_aqua_design_system(self):
        build_site.build()
        css = (build_site.OUTPUT / "assets" / "css" / "site.css").read_text(encoding="utf-8")

        self.assertIn("/* --- aqua-workstation.css --- */", css)
        self.assertNotIn("/* --- tokens.css --- */", css)
        self.assertNotIn("/* --- retro-desktop.css --- */", css)
        self.assertIn("ZARA // AQUA WORKSTATION", css)
        self.assertIn("@media (min-width: 1200px)", css)
        self.assertIn("@media (max-width: 800px)", css)
        self.assertIn("@media (max-width: 390px)", css)
        self.assertIn("@media (min-width: 1800px) and (min-height: 1000px)", css)
        self.assertIn(".retro-app-window", css)
        self.assertIn(".project-explorer-toolbar", css)
        self.assertIn(".desktop-statusbar", css)
        self.assertNotIn("width: 100vw;", css)
        self.assertFalse((build_site.OUTPUT / "styles").exists())

    def test_story_order_is_stable_in_both_languages(self):
        pages = (
            ("index.html", ("inicio", "projetos", "sobre", "arquivo", "formacao", "contato")),
            ("en/index.html", ("home", "projects", "about", "archive", "education", "contact")),
        )
        for relative, ids in pages:
            with self.subTest(page=relative):
                html = (build_site.SOURCE / relative).read_text(encoding="utf-8")
                positions = [html.index(f'id="{section_id}"') for section_id in ids]
                self.assertEqual(positions, sorted(positions))

    def test_desktop_scripts_share_the_same_breakpoint_and_single_window_model(self):
        desktop = (build_site.SOURCE / "scripts" / "retro-desktop.js").read_text(encoding="utf-8")
        explorer = (build_site.SOURCE / "scripts" / "project-explorer.js").read_text(encoding="utf-8")

        self.assertIn('const DESKTOP_QUERY = "(min-width: 1200px)"', desktop)
        self.assertIn('const DESKTOP_QUERY = "(min-width: 1200px)"', explorer)
        self.assertIn("function setActiveWindow", desktop)
        self.assertIn("aria-current", desktop)
        self.assertNotIn('windows.get("projetos")?.classList.add("is-open")', desktop)
        self.assertIn("project-explorer-toolbar", explorer)

    def test_browser_smoke_covers_mobile_tablet_laptop_and_desktop(self):
        smoke = (build_site.ROOT / "scripts" / "ui-smoke.mjs").read_text(encoding="utf-8")

        for marker in (
            "mobile-360",
            "mobile-390",
            "tablet-768",
            "laptop-1024",
            "desktop-1366",
            "desktop-1920",
        ):
            self.assertIn(marker, smoke)
        self.assertIn("assertNormalDocument", smoke)
        self.assertIn("assertSingleActiveWindow", smoke)
        self.assertIn("assertNoHorizontalOverflow", smoke)

    def test_every_project_cover_exists_locally(self):
        build_site.validate_projects()
        projects = json.loads((build_site.SOURCE / "data" / "projects.json").read_text(encoding="utf-8"))
        for project in projects:
            with self.subTest(project=project["title"]):
                self.assertTrue((build_site.SOURCE / project["image"].lstrip("/")).is_file())

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

    def test_build_includes_404_privacy_and_crawl_files(self):
        build_site.build()

        self.assertTrue((build_site.OUTPUT / "404.html").is_file())
        self.assertTrue((build_site.OUTPUT / "privacidade.html").is_file())
        self.assertTrue((build_site.OUTPUT / "en" / "privacy.html").is_file())
        self.assertTrue((build_site.OUTPUT / "robots.txt").is_file())

        sitemap = (build_site.OUTPUT / "sitemap.xml").read_text(encoding="utf-8")
        self.assertIn("https://portfolio.zaratakion.workers.dev/en/", sitemap)
        self.assertIn('hreflang="pt-BR"', sitemap)

    def test_cloudflare_configuration_and_headers_remain_valid(self):
        build_site.build()
        config = (build_site.ROOT / "wrangler.jsonc").read_text(encoding="utf-8")
        headers = (build_site.OUTPUT / "_headers").read_text(encoding="utf-8")

        self.assertIn('"name": "portfolio"', config)
        self.assertIn('"directory": "./dist"', config)
        self.assertIn("Content-Security-Policy:", headers)

    def test_main_pages_have_one_h1_and_valid_aria_references(self):
        for relative in ("index.html", "en/index.html"):
            with self.subTest(page=relative):
                build_site.validate_html_document(build_site.SOURCE / relative)
                html = (build_site.SOURCE / relative).read_text(encoding="utf-8")
                self.assertEqual(html.count("<h1"), 1)

    def test_html_audit_rejects_broken_aria_reference(self):
        with tempfile.NamedTemporaryFile(
            mode="w",
            suffix=".html",
            dir=build_site.ROOT,
            encoding="utf-8",
            delete=False,
        ) as handle:
            handle.write('<!doctype html><html><body><main><h1>Test</h1><section aria-labelledby="missing"></section></main></body></html>')
            temporary_path = build_site.ROOT / Path(handle.name).name

        try:
            with self.assertRaisesRegex(ValueError, "aria-labelledby"):
                build_site.validate_html_document(temporary_path)
        finally:
            temporary_path.unlink(missing_ok=True)


if __name__ == "__main__":
    unittest.main()
