# BEV Navigator – consegna finale (25.11.2026)

**Link per la presentazione:** https://bev-navigator.zurich-hsg.workers.dev/release/2026-11-25/

Si tratta di una copia congelata della build `d2efab0`, pubblicata con il commit `363b16b` sul branch `main` di https://github.com/lancioswag/icysnowflake. Le modifiche successive a `/` o a `/preview/` non la cambiano.

## Contenuto dello ZIP

| Cartella | Contenuto |
|---|---|
| `site/` | Il sito della release: `index.html` (app completa in un solo file), `cars.json`, `RELEASE.json` (commit e sha256), icone e manifest |
| `reports/` | `TEST_FINAL_2026-11-25.md` (test finale) e i report del 24 e 25.11 |
| `pdf/` | PDF del caso Christian (BMW 530xd – Mégane usata, 5 anni): report completo e one-page |
| `n8n/` | Export dei workflow usati dalla release, senza credenziali (riferimenti solo per nome) |
| `data/` | Inventario delle tabelle Supabase e snapshot minimo delle righe lette dal caso Christian |
| `HANDOFF.md` | Architettura, endpoint, workflow, tabelle, credenziali (solo dove configurarle), manutenzione, punti aperti |

## Scaricare il sito
- **Dallo ZIP:** cartella `site/`.
- **Da GitHub:** `git clone https://github.com/lancioswag/icysnowflake`, poi `git checkout 363b16b`. La release è in `public/release/2026-11-25/`. Le icone e il manifest sono in `public/`.
- **Dal sito pubblico:** `https://bev-navigator.zurich-hsg.workers.dev/release/2026-11-25/index.html`, `…/cars.json`, `…/RELEASE.json`.

## Servirlo in locale

```
cd site
python3 -m http.server 8080
# aprire http://localhost:8080/
```

Il sito è statico.

**Cosa resta online.** Per i calcoli, la chat e il riassunto chiama sempre la copia n8n su `hsg-consultancy-project.app.n8n.cloud` (`/webhook/navigator-claude`, `/assist-claude`, `/summary`, `/feedback`). Carica dalle CDN pdfmake, Leaflet, supabase-js e Google Fonts.

**Senza rete.** Domande e risposte salvate funzionano; i calcoli no. In quel caso l'app mostra la pagina d'errore con "Try again".

## Ripubblicare la release su Cloudflare
La release sta già nel Worker `bev-navigator` (static assets da `public/`; build automatica da `main`). Per una nuova release: `python3 ui-loop/tools/mkrelease.py <nome> <commit>`, poi commit e push su `main`.
