"""Regression tests for Aqua Workstation V2, without replacing browser QA."""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
CSS = ROOT / "site" / "styles" / "aqua-workstation.css"

class AquaWorkstationVisualTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.css = CSS.read_text(encoding="utf-8")

    def test_pixel_sky_only_applies_to_desktop_enhancement(self):
        self.assertIn("AQUA WORKSTATION V2", self.css)
        self.assertIn("@media (min-width: 1200px)", self.css)
        self.assertIn(".retro-desktop-stage.retro-enhanced", self.css)
        self.assertIn("aqua-cloud-drift", self.css)

    def test_motion_respects_accessibility_preference(self):
        self.assertIn("@media (prefers-reduced-motion: reduce)", self.css)
        self.assertIn("animation: none !important", self.css)
        self.assertIn("@media (forced-colors: active)", self.css)

    def test_no_external_asset_or_font_dependency_in_v2(self):
        v2 = self.css.split("AQUA WORKSTATION V2", 1)[1]
        self.assertNotIn("@import", v2)
        self.assertNotIn("url(", v2)
        self.assertNotIn("filter: blur(", v2)
        self.assertIn(".project-card:hover .project-visual img", v2)

if __name__ == "__main__":
    unittest.main()
