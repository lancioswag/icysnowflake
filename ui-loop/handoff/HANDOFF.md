# BEV Navigator – handoff (25.11.2026)

## 1. Siti

| URL | Cosa è | Backend | Stato |
|---|---|---|---|
| https://bev-navigator.zurich-hsg.workers.dev/release/2026-11-25/ | **Release congelata** per la presentazione (`d2efab0`) | `C – Demo` | testata il 25.11 (`reports/TEST_FINAL_2026-11-25.md`) |
| https://bev-navigator.zurich-hsg.workers.dev/ | **Sito pubblico principale**, stessa versione della release (commit `8216399`) | `C – Demo` | testato il 25.11 sera |
| https://bev-navigator.zurich-hsg.workers.dev/preview/ | Preview di lavoro (cambia a ogni push) | `T – Test` (`/navigator-test`) | testata |
| https://bev-navigator.zurich-hsg.workers.dev/map | Mappa delle schermate | – | statica |
| https://lancioswag.github.io/icysnowflake/ | Vecchia copia su GitHub Pages | – | **chiusa** il 25.11: ogni pagina rimanda al sito principale |
| `icy-snowflake-1754.ricordatilamail18.workers.dev` | Vecchia copia su un altro account Cloudflare | – | non raggiungibile il 25.11 e senza accesso da qui; i workflow che chiamava sono archiviati |

**Hosting.** Cloudflare Worker `bev-navigator` (account collegato a Claude). Static assets da `public/` (`wrangler.jsonc`); build automatica da `main`.

## 2. Backend in n8n: cartella operativa `C – Demo`

**Tutto il backend della release è in una sola cartella:** https://hsg-consultancy-project.app.n8n.cloud/projects/j9P8mCpnPYcLeixy/folders/XChIhGiVw3yzNRSJ/workflows
- Percorso: Project Zurich Insurance › BEV Navigator – Claude (versione isolata) › `C – Demo (navigator-claude, assist-claude)`.
- Contiene **14 workflow, tutti attivi**: API Navigator, Assist, le 6 pagine dei temi, i 4 moduli, `LIVE – AI summary v3` e `LIVE – Feedback`.
- I quattro webhook della release: `/navigator-claude`, `/assist-claude`, `/summary`, `/feedback`.

### Percorso delle richieste

1. Il frontend (`site/index.html`) chiama `POST https://hsg-consultancy-project.app.n8n.cloud/webhook/navigator-claude` con `{profile, session:{barrier}}`.
2. Il webhook è servito da **`C – API Navigator`** (`5GFUF6ZhA9iDVWvM`). Geocodifica (swisstopo) e itinerari (openrouteservice), poi chiama la pagina del tema:
   - B1 `jfvi4YxWhKe6g6eJ`
   - B2 `8QgEpnXTg9YCC43A`
   - B3 `Tm5eLdA1liLBJaw6`
   - B4 `TgKLLRQgJvFvAOJk`
   - B6 `l0tzM2w8H0deniDJ`
   - B7 `bWCrETJeQ5HK5IQI`
3. Le pagine chiamano i moduli:
   - Trips `8QofbtBhkTKYxJb4`
   - Vehicle choice `3B32H3Nkf4VZHEro`
   - Charging `nxPxoFRjkj9W8bP9`
   - Alternatives `oKW5Z1vvHXYijrxh`
4. **Chat:** `POST /webhook/assist-claude`, servito da **`C – Assist`** (`yoyAddSECLWtfgyu`). Il nodo "Build prompt" contiene prompt, campi estraibili e selettore del modello (`DEFAULT_MODEL` openai). Il nodo "Check reply" fa la validazione. Il frontend applica il patch campo per campo (`ChatNav.patch`), conferma con "Noted: …" e accetta le correzioni.
5. **Riassunto AI:** `POST /webhook/summary`, servito da **`LIVE – AI summary v3`** (`t6SOK4APZkBlW1H0`).
6. **Feedback:** `POST /webhook/feedback`, servito da **`LIVE – Feedback`** (`sDwbPpWFwpI2GmXO`), che scrive nella tabella interna di n8n `ui_feedback`.

### Altre cartelle del progetto

| Cartella | Contenuto |
|---|---|
| `T – Test (navigator-test, preview)`, accanto a `C – Demo` | Copia di sviluppo per la preview (`/preview/`, `/navigator-test`). Stesso codice di `C –`, ma schema Supabase `bevtest`. Non serve alla demo |
| `zz Archive – not used by the demo (25.11.2026)` | Solo materiale archiviato (prototipi, vecchie chat, copie di sviluppo, tool), coperto dal backup locale |

## 3. Database

**Supabase "Claude"** (credenziale n8n `Supabase N00 (dev)`):
- schema `public`: letto da `C –` (release e demo);
- schema `bevtest`: letto da `T –`;
- schema `r12_core`: database di ricerca R12 (sorgente delle tabelle `r12_*`, non letto direttamente dall'app);
- schema `app`: `dataset_releases`.

**Tabelle lette dalla release:**
- `b2_charging_abroad`, `b2_city_programmes`, `b2_stations`, `b2_subsidies`, `b2_tariffs`;
- `b3_constants`, `b3_insurance`, `b3_vehicle_tax`;
- `b4_alternative_prices`, `b4_train_fares`;
- `b7_ice_reference`;
- `r12_el_tariff_h4`, `r12_postcode_municipality`;
- `vehicle_classes`.

Righe per tabella: `data/supabase_inventory.json`.

**Snapshot minimo del caso Christian:** `data/supabase_snapshot_christian.json`. Restore di prova in uno schema temporaneo (25.11, esecuzione 18284): stesso numero di righe e stesso diesel 2.02.

**Login (opzionale).** Il frontend usa Supabase Auth del progetto `ccftsgtvyvjtmonfbwyt.supabase.co`, con una chiave publishable pensata per il browser.

**Tabelle interne di n8n:** `ui_feedback` (feedback degli utenti, scritta da `LIVE – Feedback`; non esportata). È l'unica tabella interna rimasta: le 12 copie delle tabelle Supabase usate dai prototipi sono state cancellate il 25.11 (gli stessi dati sono in Supabase).

## 4. Account e credenziali (solo nomi; nessun valore nel pacchetto)

| Account / servizio | A cosa serve per la demo |
|---|---|
| n8n cloud `hsg-consultancy-project.app.n8n.cloud`, Project Zurich Insurance | Backend: cartella operativa `C – Demo` (14 workflow) |
| Supabase "Claude" (credenziale n8n `Supabase N00 (dev)`) | Tabelle lette dai calcoli |
| Supabase Auth `ccftsgtvyvjtmonfbwyt` | Login facoltativo nel frontend |
| Cloudflare, Worker `bev-navigator` | Hosting del sito e della release |

Credenziali n8n usate dai 14 workflow di `C – Demo` (n8n → Credentials):
- `Supabase N00 (dev)` (Postgres): tabelle;
- `ORS` (openrouteservice): geocodifica e percorsi;
- `API OPENAI`: chat e riassunto (modello predefinito);
- `Groq`, `gamini api`, `Antropic API`: modelli alternativi della chat, scelti con `DEFAULT_MODEL` in `C – Assist`.

Le altre credenziali del progetto servono al team o a workflow archiviati, non alla demo.

Codice:
- **Cloudflare:** account del Worker `bev-navigator`.
- **GitHub:** repo pubblico `lancioswag/icysnowflake`.

Le chiavi non vanno mai nel repo, nei report o nel frontend.

## 5. Manutenzione

| Cosa | Come |
|---|---|
| Codice dei nodi n8n | Sorgenti dei nodi Code in `n8n/test/*.js` del repo. Si prova la modifica su `T –` con la preview, poi la stessa modifica va nel workflow di `C – Demo`, che va pubblicato (Publish) |
| Export dei workflow | `n8n/n8n_demo_workflows.json` in questo pacchetto (14 workflow, senza credenziali) |
| Test | `ui-loop/tools`: test live nel browser con `public/preview/stress.js` (S1–S16); test locali `e2e_*.js`, `regress.js`, `edge.js`, `reconcile.js` |

## 6. Dipendenze esterne
- **Dati e API pubbliche chiamate durante un calcolo:** swisstopo, openrouteservice, ASTRA TAS (open data), sharedmobility.ch, transport.opendata.ch. Le tariffe ElCom vengono dalle tabelle R12 in Supabase.
- **CDN:** jsDelivr (pdfmake, supabase-js), cdnjs (Leaflet), Google Fonts.
- **Modelli AI:** OpenAI (predefinito), con alternative Groq, Gemini e Anthropic.

## 7. Punti aperti
1. **Decisioni di modello:** perdite di ricarica, mix casa/pubblico, tassa cantonale inserita dall'utente.
2. **AutoScout24:** serve l'accesso partner per la stima del valore di vendita.
3. **Refresh mensile dei dati:** da costruire. Piano: workflow n8n mensile → tabelle R12 in Supabase con `as_of` e `checked_at`; nel frattempo "Updated by hand".
4. **HSG/Zurich sulla Start:** confermare con Christian la decisione di Simone (solo riga HSG).
5. **Vecchia copia su `ricordatilamail18.workers.dev`:** su un altro account Cloudflare, da chiudere da chi ha l'accesso.
