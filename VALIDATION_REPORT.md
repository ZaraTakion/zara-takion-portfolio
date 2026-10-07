# Validation report

## Passed in this revision

- Static build: `python scripts/build_site.py`
- Static/unit tests: 12/12 passed
- JavaScript unit tests: 1/1 passed
- JavaScript syntax: every file in `site/scripts/*.js`
- Python bytecode compilation: `api`, `scripts`, and `tests`
- Independent CSS parse: no syntax parse errors
- Independent HTML parse: no duplicate IDs; one primary `h1` per generated HTML page
- Build-time integrity audit: ARIA references, local files, internal anchors, image `alt`, and safe `_blank` links

## API test environment note

The API source compiles successfully and its pinned Flask, Flask-Limiter, and Gunicorn versions were verified as published releases. The sandbox used for this revision could not download Python packages, so the Flask runtime test suite could not be executed locally here. The GitHub Actions workflow remains configured to install `api/requirements.txt` and run `api/tests` on every validation run.
