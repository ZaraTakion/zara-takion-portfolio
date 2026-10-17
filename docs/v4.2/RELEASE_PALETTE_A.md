# V4.2 Final — Zara Original Palette A

Release authorised by the owner on 2026-10-17; the exact original comparison palette was selected, with no additional previews requested.

## Approved design
- Dark: background `#0D0D12`, text `#F7F7FA`, accent `#FF6773`.
- Light: background `#F9F9FA`, text `#17171F`, accent `#B61C34`.
- Only CSS token overrides and theme-color metadata; React UX, layout, PT/EN, CVs, certificate and original images remain unchanged.
- Private photograph and character illustration remain excluded; no AI-generated/edited images.

## Controlled automatic production release
- Existing Cloudflare Builds runs `python3 scripts/build_site.py` and `npx wrangler deploy` on `main` only; feature branches may use `npx wrangler preview`.
- For Cloudflare `WORKERS_CI_BRANCH=main`, build automatically produces indexable production metadata, canonical PT/EN, existing sitemap and robots and the actual clean Git checkout SHA.
- All other local/PR builds remain noindex. No script initiates deploy directly.
- GitHub Actions verifies all original quality gates and additionally validates the production candidate build before merge.
- The merge into main triggers Cloudflare production automatically. Verify public `/version.json` and PT/EN; check documents and authentic image assets.
- If deployment fails, the previous published deployment remains; do not bypass tests. Roll back a broken publication using Cloudflare deployments as needed.
