"""Regression tests for React/TypeScript/Vite portfolio output and content provenance."""
from __future__ import annotations

import json
from pathlib import Path
import re
import unittest
from scripts import build_site

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "dist"
SOURCE = ROOT / "site"


class ReactPortfolioTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if not (OUTPUT / "index.html").is_file():
            build_site.build()

    def test_localized_react_entries_exist(self):
        for path, language in (("index.html", "pt-BR"), ("en/index.html", "en")):
            content = (OUTPUT / path).read_text(encoding="utf-8")
            self.assertIn(f'<html lang="{language}">', content)
            self.assertIn('id="root"', content)
            self.assertRegex(content, r'<script[^>]+type="module"')
            self.assertNotIn('src="/scripts/main.js"', content)

    def test_asset_integrity_and_provenance(self):
        projects = json.loads((OUTPUT / "data" / "projects.json").read_text(encoding="utf-8"))
        self.assertEqual(len(projects), 7)
        self.assertEqual(sum(p["featured"] for p in projects), 3)
        for project in projects:
            self.assertIn(project["track"], ("web", "api", "data"))
            self.assertTrue((OUTPUT / project["image"].lstrip("/")).is_file())
            self.assertTrue(project["title_en"] and project["description_en"])
        portrait = OUTPUT / "assets" / "img" / "oc-portrait.jpg"
        self.assertTrue(portrait.is_file())
        self.assertEqual(
            portrait.read_bytes(),
            (SOURCE / "assets" / "img" / "oc-portrait.jpg").read_bytes(),
            "Original character asset must remain byte-for-byte unchanged",
        )

    def test_css_and_modules_are_bundled(self):
        html = (OUTPUT / "index.html").read_text(encoding="utf-8")
        css_files = list((OUTPUT / "assets").glob("*.css"))
        js_files = list((OUTPUT / "assets").glob("*.js"))
        self.assertTrue(css_files, "Vite stylesheet not emitted")
        self.assertTrue(js_files, "React bundle not emitted")
        css = "\n".join(path.read_text(encoding="utf-8") for path in css_files)
        self.assertIn("aqua-cloud-drift", css)
        self.assertIn("aqua-command-palette", css)
        self.assertIn("aqua-react-explorer", css)
        self.assertIn("prefers-reduced-motion", css)
        self.assertIn("retro-app-window", css)

    def test_privacy_security_and_bilingual_public_paths_remain(self):
        for path in (
            "404.html", "robots.txt", "sitemap.xml", "_headers",
            "privacidade.html", "en/privacy.html",
        ):
            self.assertTrue((OUTPUT / path).is_file(), path)
        headers = (OUTPUT / "_headers").read_text(encoding="utf-8")
        self.assertIn("Content-Security-Policy:", headers)
        self.assertIn("script-src 'self'", headers)
        self.assertNotIn("'unsafe-inline'", headers)
        self.assertNotIn("'unsafe-eval'", headers)
        self.assertIn("portfolio.zaratakion.workers.dev/en/", (OUTPUT / "sitemap.xml").read_text(encoding="utf-8"))

    def test_existing_python_api_remains_independent(self):
        self.assertTrue((ROOT / "api" / "app.py").is_file())
        self.assertTrue((ROOT / "api" / "requirements.txt").is_file())
        self.assertTrue((ROOT / "api" / "tests").is_dir())
        config = (ROOT / "wrangler.jsonc").read_text(encoding="utf-8")
        self.assertIn('"directory": "./dist"', config)

    def test_build_entrypoint_handles_vite(self):
        source = (ROOT / "scripts" / "build_site.py").read_text(encoding="utf-8")
        self.assertIn("validate_projects()", source)
        self.assertIn('["npm", "run", "build"]', source)

    def test_release_revision_manifest_is_valid_and_traceable(self):
        manifest = json.loads((OUTPUT / "version.json").read_text(encoding="utf-8"))
        self.assertEqual(manifest["site"], "zara-aqua-workstation")
        self.assertEqual(manifest["framework"], "React / TypeScript / Vite")
        self.assertRegex(manifest["revision"], r"^[a-f0-9]{40}$")
        self.assertEqual(manifest["shortRevision"], manifest["revision"][:7])

    def test_current_project_schema_validation_still_runs(self):
        build_site.validate_projects()

    def test_frontend_sources_are_real_react_and_typescript(self):
        app = (ROOT / "src" / "App.tsx").read_text(encoding="utf-8")
        self.assertIn("function ProjectExplorer", app)
        self.assertIn("function Terminal", app)
        self.assertIn("function CommandPalette", app)
        self.assertIn("function ProjectCard", app)
        self.assertIn('aria-expanded={menuOpen}', app)
        self.assertIn('role="tabpanel"', app)
        self.assertIn('useProjects()', app)
        self.assertTrue((ROOT / "src" / "model.test.ts").is_file())
        self.assertTrue((ROOT / "src" / "copy.ts").is_file())


if __name__ == "__main__":
    unittest.main()
