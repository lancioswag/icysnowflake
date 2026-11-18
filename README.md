# BEV Navigator (HSG × Zurich) – web front end

Static site served by the Cloudflare Worker `icy-snowflake-1754` (https://icy-snowflake-1754.ricordatilamail18.workers.dev).
Every push to `main` is deployed by Cloudflare Workers Builds (`npx wrangler deploy`, config in `wrangler.jsonc`).

- `public/index.html` – the whole app (HTML, CSS, JS inline)
- `public/cars.json` – ASTRA car list (brand → model → versions)

Calculations run in n8n (`https://hsg-consultancy-project.app.n8n.cloud/webhook/navigator`); this repo holds only the interface.
