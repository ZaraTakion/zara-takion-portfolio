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
            self.assertRegex(content, rf'<html\b[^>]*\blang="{language}"')
            self.assertIn('id="root"', content)
            self.assertRegex(content, r'<script[^>]+type="module"')
            self.assertNotIn('src="/scripts/main.js"', content)

    def test_asset_integrity_and_provenance(self):
        projects = json.loads((OUTPUT / "data" / "projects.json").read_text(encoding="utf-8"))
        self.assertEqual(len(projects), 9)
        self.assertEqual(
            {p["title"] for p in projects if p["featured"]},
            {"Takion Campus", "Biya — Parallel Worlds", "Chamados API"},
        )
        self.assertEqual(sum(p["featured"] for p in projects), 3)
        for project in projects:
            self.assertIn(project["track"], ("web", "api", "data"))
            if project.get("image"):
                self.assertTrue((OUTPUT / project["image"].lstrip("/")).is_file())
            self.assertTrue(project["title_en"] and project["description_en"])
        import hashlib
        self.assertFalse((OUTPUT / "assets/img/oc-portrait.jpg").exists(), "Character publication requires separate authorization")
        self.assertEqual(hashlib.sha256((SOURCE / "assets/img/oc-portrait.jpg").read_bytes()).hexdigest(),
                         "ac4617a87786abd75d5ef62aa0a7575cea22f1a91a573b6525d0b0d3207ad8f8")
        captures = json.loads((SOURCE / "data/image-provenance.json").read_text())
        self.assertEqual({p.name for p in (OUTPUT / "assets/img").iterdir()},
                         {Path(p["file"]).name for p in captures})

    def test_css_and_modules_are_bundled(self):
        html = (OUTPUT / "index.html").read_text(encoding="utf-8")
        css_files = list((OUTPUT / "assets").glob("*.css"))
        js_files = list((OUTPUT / "assets").glob("*.js"))
        self.assertTrue(css_files, "Vite stylesheet not emitted")
        self.assertTrue(js_files, "React bundle not emitted")
        css = "\n".join(path.read_text(encoding="utf-8") for path in css_files)
        self.assertIn("journey-nodes", css)
        self.assertIn("transaction-exhibit", css)
        self.assertIn("author-signature", css)
        self.assertIn("prefers-reduced-motion", css)
        self.assertIn("forced-colors", css)
        js = "\n".join(path.read_text(encoding="utf-8") for path in js_files)
        self.assertNotIn("oc-portrait.jpg", js)

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
        manifest = json.loads((OUTPUT / "version.json").read_text())
        if manifest["stage"] == "production-candidate":
            self.assertIn("portfolio.zaratakion.workers.dev/en/", (OUTPUT / "sitemap.xml").read_text())
        else:
            self.assertIn("Disallow: /", (OUTPUT / "robots.txt").read_text())
            self.assertIn("X-Robots-Tag: noindex, nofollow", headers)
            self.assertNotIn('<loc>', (OUTPUT / "sitemap.xml").read_text())
            self.assertIn('content="noindex, nofollow"', (OUTPUT / "index.html").read_text())
            self.assertNotIn('rel="canonical"', (OUTPUT / "index.html").read_text())
        self.assertTrue((OUTPUT / "assets" / "css" / "site.css").is_file())
        self.assertIn(".site-header", (OUTPUT / "assets" / "css" / "site.css").read_text(encoding="utf-8"))
        for name in ("privacidade.html", "en/privacy.html"):
            html = (OUTPUT / name).read_text(encoding="utf-8")
            self.assertIn('href="/assets/css/site.css"', html)
            self.assertNotIn('/scripts/main.js', html)

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
        if manifest["revisionSource"] == "unavailable":
            self.assertIsNone(manifest["revision"])
            self.assertIsNone(manifest["shortRevision"])
            self.assertEqual(manifest["stage"], "private-preview")
        else:
            self.assertRegex(manifest["revision"], r"^[a-f0-9]{40}$")
            self.assertEqual(manifest["shortRevision"], manifest["revision"][:7])

    def test_current_project_schema_validation_still_runs(self):
        build_site.validate_projects()

    def test_frontend_sources_are_real_react_and_typescript(self):
        # Pre-rendered React output must be useful before JavaScript runs.
        for path, words in (("index.html", ("Desenvolvedor Back-End Júnior", "CADERNO DE DECISÕES", "Como a mesma plataforma")),
                            ("en/index.html", ("Junior Back-End Developer", "DECISION NOTES", "How can one platform"))):
            html = (OUTPUT / path).read_text()
            for word in words:
                self.assertIn(word, html)
            self.assertEqual(len(re.findall(r'class="project-case ', html)), 5)
            self.assertIn("aria-live", html)
            self.assertIn("Certificado_Udemy_Python_Geek_University.pdf", html)
            self.assertNotIn("oc-portrait.jpg", html)

    def test_authentic_captures_and_resume_downloads_are_published(self):
        import hashlib
        captures = json.loads((OUTPUT / "data/image-provenance.json").read_text())
        self.assertEqual(len(captures), 4)
        for capture in captures:
            asset = OUTPUT / capture["file"].lstrip("/")
            self.assertEqual(hashlib.sha256(asset.read_bytes()).hexdigest(), capture["sha256"])
            self.assertEqual(asset.read_bytes(), (ROOT / "public" / capture["file"].lstrip("/")).read_bytes())
            self.assertTrue(capture["source_url"].startswith("https://"))
            self.assertTrue(capture["credit"])
        self.assertFalse(list((OUTPUT / "assets/img").glob("*-cover.svg")))
        for language in ("PTBR", "EN"):
            for extension in ("pdf", "docx"):
                path = OUTPUT / f"downloads/Rodrigo_Pinheiro_2026_{language}.{extension}"
                self.assertGreater(path.stat().st_size, 1000)
                self.assertEqual(path.read_bytes(), (SOURCE / path.relative_to(OUTPUT)).read_bytes())
                self.assertEqual(path.read_bytes(), (ROOT / "public" / path.relative_to(OUTPUT)).read_bytes())

    def test_original_certificate_and_font_licenses_are_preserved(self):
        import hashlib
        certificate = OUTPUT / "documents/Certificado_Udemy_Python_Geek_University.pdf"
        self.assertEqual(hashlib.sha256(certificate.read_bytes()).hexdigest(),
                         "7d3b23fa19f97508cc96e4387accbc13de77be780b43d57c8be9fc6fbe6037cd")
        for name in ("cormorantgaramond-OFL.txt", "sourcesans3-OFL.txt"):
            self.assertIn("SIL OPEN FONT LICENSE", (OUTPUT / "assets/fonts" / name).read_text())

    def test_provenance_rejects_an_altered_capture(self):
        from tempfile import TemporaryDirectory
        from unittest.mock import patch
        import shutil
        with TemporaryDirectory() as temp:
            site = Path(temp) / "site"
            shutil.copytree(SOURCE / "data", site / "data")
            shutil.copytree(SOURCE / "assets/img", site / "assets/img")
            image = site / "assets/img/chamados-api-real.png"
            image.write_bytes(image.read_bytes() + b"tampered")
            with patch.object(build_site, "SOURCE", site):
                with self.assertRaisesRegex(ValueError, "Bytes da captura divergentes"):
                    build_site.validate_projects()


if __name__ == "__main__":
    unittest.main()
