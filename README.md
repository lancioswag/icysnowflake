# BEV Navigator (HSG × Zurich) – web front end

**Live site:** https://bev-navigator.zurich-hsg.workers.dev/ — this is the only current version.
Frozen copy for the presentation: https://bev-navigator.zurich-hsg.workers.dev/release/2026-11-25/

Static site served by the Cloudflare Worker `bev-navigator`. Every push to `main` is deployed by Cloudflare Workers Builds (`npx wrangler deploy`, config in `wrangler.jsonc`).

- `public/index.html` – the whole app (HTML, CSS, JS inline)
- `public/cars.json` – ASTRA car list (brand → model → versions)
- `public/release/2026-11-25/` – frozen release
- `public/preview/` – development preview (n8n test copy)

Calculations, chat, AI summary and feedback run in n8n, folder `C – Demo` (webhooks `/navigator-claude`, `/assist-claude`, `/summary`, `/feedback`); this repo holds only the interface. The old GitHub Pages copy is closed and sends to the live site.
