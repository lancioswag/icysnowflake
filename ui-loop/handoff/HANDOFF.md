# BEV Navigator – handoff (25.11.2026)

## 1. Siti

| URL | Cosa è | Backend | Stato |
|---|---|---|---|
| https://bev-navigator.zurich-hsg.workers.dev/release/2026-11-25/ | **Release congelata** per la presentazione (`d2efab0`) | `C – Demo` | testata il 25.11 (`reports/TEST_FINAL_2026-11-25.md`) |
| https://bev-navigator.zurich-hsg.workers.dev/ | Demo pubblica principale | `C – Demo` | frontend del 25.11 mattina; il frontend nuovo (uguale alla release) è pronto ma la promozione aspetta l'ok di Simone |
| https://bev-navigator.zurich-hsg.workers.dev/preview/ | Preview di lavoro (cambia a ogni push) | `T – Test` (`/navigator-test`) | testata |
| https://bev-navigator.zurich-hsg.workers.dev/map | Mappa delle schermate | – | statica |
| https://lancioswag.github.io/icysnowflake/ | Copia su GitHub Pages del 23.11 (branch `gh-pages`, deploy `886a1c4`) | `T – Test` e `/assist-v2` | **dismissione da decidere** (vedi §7) |
| https://bev-navigator.ricordatilamail18.workers.dev | URL citato nel README del repo (altro account Cloudflare) | – | non raggiungibile il 25.11 (DNS); nessun accesso |

**Hosting.** Cloudflare Worker `bev-navigator` (account collegato a Claude). Static assets da `public/` (`wrangler.jsonc`); build automatica da `main`.

## 2. Percorso delle richieste (release)

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
   - Train fares `IeOOzJ2UV3qCEeFy`
4. **Chat:** `POST /webhook/assist-claude`, servito da **`C – Assist`** (`yoyAddSECLWtfgyu`). Il nodo "Build prompt" contiene prompt, campi estraibili e selettore del modello (`DEFAULT_MODEL` openai). Il nodo "Check reply" fa la validazione. Il frontend applica il patch campo per campo (`ChatNav.patch`), conferma con "Noted: …" e accetta le correzioni.
5. **Riassunto AI:** `POST /webhook/summary`, servito da **`LIVE – AI summary v3`** (`t6SOK4APZkBlW1H0`, cartella "Test Claude").
6. **Feedback:** `POST /webhook/feedback`, servito da **`LIVE – Feedback`** (`sDwbPpWFwpI2GmXO`), che scrive nella tabella interna di n8n `ui_feedback`.

**Cartelle n8n.** Progetto "Project Zurich Insurance" (`j9P8mCpnPYcLeixy`), cartella "BEV Navigator – Claude (versione isolata)":
- `C – Demo (navigator-claude, assist-claude)`: 13 workflow;
- `T – Test (navigator-test, preview)`: 12 workflow;
- `Tools (deploy and table copies)`.

**Copie a confronto:**
- `T –` è identica a `C –` per codice (verificato nodo per nodo il 25.11). Differiscono solo lo schema Supabase (`bevtest`) e il webhook (`/navigator-test`).
- `/assist-v2` (`LIVE – Assist v2`, `OGgnBIfA6tjZWZSk`) è la chat precedente. Resta attiva per la copia su GitHub Pages. Rispetto a `/assist-claude` estrae meno campi: niente anno né vendita.

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

**Snapshot minimo del caso Christian:** `data/supabase_snapshot_christian.json`. Restore di prova in uno schema temporaneo: esecuzione 18284 del tool "Tools – Supabase inventory, snapshot and restore test", con lo stesso numero di righe e lo stesso diesel 2.02.

**Login (opzionale).** Il frontend usa Supabase Auth del progetto `ccftsgtvyvjtmonfbwyt.supabase.co`, con una chiave publishable pensata per il browser.

**Tabelle interne di n8n:** `ui_feedback` (feedback degli utenti; non esportata).

## 4. Credenziali (solo nomi e dove configurarle; nessun valore nel pacchetto)

Configurate in n8n → Credentials:
- `Supabase N00 (dev)` (Postgres)
- `ORS` (openrouteservice)
- `OJP Fare key` (opentransportdata.swiss)
- `API OPENAI`, `Groq`, `gamini api`, `Antropic API` (modelli della chat e del riassunto)
- `n8n account` (API n8n, usata dai tool di deploy ed export)

Hosting e codice:
- **Cloudflare:** account del Worker `bev-navigator`.
- **GitHub:** repo pubblico `lancioswag/icysnowflake`.

Le chiavi non vanno mai nel repo, nei report o nel frontend.

## 5. Manutenzione

| Cosa | Come |
|---|---|
| Codice dei nodi n8n | File in `n8n/test/*.js` del repo, copiati nel nodo con "Tools – set node code in a Claude workflow (T – or C –) from the repo" (URL raw fissato a un commit), poi pubblicati. Prima su `T –` e preview, poi su `C –` |
| Export dei workflow senza credenziali | "Tools – export workflows without credentials (handoff backup)" |
| Test | `ui-loop/tools`: test live nel browser con `public/preview/stress.js` (S1–S16); test locali `e2e_*.js`, `regress.js`, `edge.js`, `reconcile.js` |

## 6. Dipendenze esterne
- **Dati e API pubbliche:** swisstopo, openrouteservice, sharedmobility.ch, transport.opendata.ch, opentransportdata.swiss (OJP), ASTRA TAS (open data), LINDAS/ElCom (ora da tabelle R12).
- **CDN:** jsDelivr (pdfmake, supabase-js), cdnjs (Leaflet), Google Fonts.
- **Modelli AI:** OpenAI (predefinito), con alternative Groq, Gemini e Anthropic.

## 7. Punti aperti
1. **Promozione della release su `/`:** pronta, serve l'ok di Simone.
2. **Decisioni di modello:** perdite di ricarica, mix casa/pubblico, tassa cantonale inserita dall'utente.
3. **AutoScout24:** serve l'accesso partner per la stima del valore di vendita.
4. **Refresh mensile dei dati:** da costruire. Piano: workflow n8n mensile → tabelle R12 in Supabase con `as_of` e `checked_at`; nel frattempo "Updated by hand".
5. **HSG/Zurich sulla Start:** confermare con Christian la decisione di Simone (solo riga HSG).
6. **Copie da dismettere** (decisione di Simone, accesso necessario):
   - GitHub Pages `lancioswag.github.io/icysnowflake` (dipende da `T –` e `/assist-v2`);
   - URL `ricordatilamail18.workers.dev` citato nel README.
