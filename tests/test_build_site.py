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
        self.assertEqual(built_html.count('class="project-card"'), 4)
        self.assertIn("<!-- PROJECTS:END -->", built_html)
        self.assertIn('data-netlify="true"', built_html)
        self.assertIn('name="form-name" value="contact"', built_html)
        self.assertIn('mailto:rm20022101@gmail.com', built_html)
        self.assertNotIn("rodzmaciel21@gmail.com", built_html)

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
