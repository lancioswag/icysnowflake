# BEV Navigator – test finale della release (25.11.2026)

**Versione candidata:** `https://bev-navigator.zurich-hsg.workers.dev/release/2026-11-25/`
- copia congelata della build `d2efab0`, pubblicata con il commit `363b16b` sul branch `main`;
- meta `bev-release = "2026-11-25 d2efab0"`.

**Endpoint usati dalla release:**
- calcoli: `https://hsg-consultancy-project.app.n8n.cloud/webhook/navigator-claude` (copia `C – Demo`);
- chat: `/webhook/assist-claude` (`C – Assist`);
- riassunto AI: `/webhook/summary` (`LIVE – AI summary v3`);
- feedback: `/webhook/feedback` (`LIVE – Feedback`).

La release salva i dati nel browser sotto la chiave propria `bevnav.release.v1`.

**Ambiente di test:**
- Browser integrato dell'app Claude desktop, sessione pulita: nessuna chiave `bevnav.release.*` presente all'apertura.
- TLS verso `*.n8n.cloud` valido. Alle 13:05 il certificato era rifiutato, alle 14:15 era di nuovo valido.
- Viewport 390 × 844 e 1366 × 900.

## 1. Test dal browser sulla release (15:20–15:40)

| Scenario | 390 × 844 | 1366 × 900 |
|---|---|---|
| S1 caso Christian (input del Word): payload n8n, Costs, Summary, PDF | 18/18 | 18/18 |
| S2 stesse auto, ipotesi dell'app (scenario Navigator) | 5/5 | – |
| S3 cinque temi, auto a benzina | 8/8 | 8/8 |
| S4 auto usata media, budget incompatibile | 5/5 | – |
| S5 dati mancanti | 3/3 | – |
| S6 cambio di scenario in Costs (what-if locale) | 5/5 | – |
| S7 viaggio all'estero aggiunto, modificato, cancellato | 8/8 | 8/8 |
| S8 indietro mantiene le risposte | 3/3 | – |
| S9 refresh (ripresa della sessione) / S10 reset | 3/3 · 3/3 | – |
| S11 AI non disponibile: percorso guidato, verdetto e PDF | 4/4 | 4/4 |
| S12 errore del workflow con retry | 4/4 | – |
| S13 PDF senza account | 4/4 | 4/4 |
| S14 chat: conferma, domanda, correzione 15'000 → 14'000, parità con `/assist-v2` | 7/7 | – |
| S15 chat → risultato → vendita cambiata in Your answers (15'000 → 12'000) | 7/8 (\*) | – |
| S16 correzione in chat (15'000 → 14'000) fino a Costs, Summary e PDF (cash 6'000) | 5/5 | 5/5 |

(\*) L'unico controllo non superato in S15 verifica che i percorsi siano quelli della *preview* (`/navigator-test`). Sulla release i percorsi corretti sono `/navigator-claude` e `/assist-claude`: è il comportamento atteso.

**Altri controlli sulla release:**
- **Caso Christian, input del Word.** Summary: "Over 5 years … costs about CHF 11'140 less … you pay CHF 5'000 upfront". Scheda batteria: "Battery after 5 years: 93 %" (prima era 6 o 8 anni; corretto in `d2efab0`).
- **Scenario Navigator (dati dell'app).** Differenza CHF 7'534, mostrata come **CHF 7'530** con la stessa regola (arrotondamento a CHF 10) in Costs, Summary, PDF completo e one-pager.
- **Assistente su mobile (390 px).** Il bottone della chat apre l'assistente; in Home c'è anche il link "Tell us in your own words". Il bottone si sposta quando sotto c'è un comando: si apre comunque dal link.
- **Overflow orizzontale a 1366 px** in Summary e Home: nessuno.

## 2. Chiamate dirette ai workflow (MCP n8n, senza browser)

| Copia | Esecuzioni | Esito |
|---|---|---|
| `C – API Navigator` (`/navigator-claude`): B1, B2, B3, B4, B6, B7 con il profilo BMW–Mégane | 17581, 17582, 17584, 17590, 17608, 17605, 17618 | tutte `ok`; B7 BMW 8.26 l (fattore 1.18 per l'omologazione 2007, come B3) |
| `T – API Navigator` (`/navigator-test`): B3 input Word / app, B7 | 16678, 16704, 17612 | `ok`: 41'090 / 29'950; 29'978 / 22'444 |
| `C – Assist` (`/assist-claude`): messaggio BMW–Mégane | 16757, 17845, 17864 | patch con anno, km, vendita, classe, usato e prezzo EV |

## 3. Test locali sulla stessa build (Chrome headless, risposte registrate dalla copia n8n)

| Script | Esito |
|---|---|
| `e2e_medium_used.js` (`christian_mu.json`) | 12/12 |
| `e2e_chat_edit.js` | 11/11 |
| `e2e_stress_local.js`: riordino touch e tastiera, vendita vuota / 0 / propria, AutoScout, Start, launcher a 390 e 1366, workflow lento / in errore, chat giù, payback presente / assente / non calcolabile | 19/19 |
| `regress.js`, `edge.js`, `reconcile.js` (somme di Costs, nessun doppio conteggio dell'esborso nel payback) | ok |

## 4. Correzioni durante il giro finale (tutte ritestate sulla release)

| Commit | Correzione |
|---|---|
| `6a2bfb9` | Dopo un reset la chat ignorava i messaggi (controllo chat rimasto attivo); i dati della chat sono salvati anche senza una domanda aperta |
| `d2efab0` | Schede batteria e valore con l'orizzonte scelto in Costs (5 anni per Christian) |
| `474f259`, `ad3a7e7` | Start: "Better than ChatGPT?" nello stile di "See our data sources"; titolo di nuovo grande |
| n8n `5e9a8ef` | B7 Ecology: fattore NEDC per anno di omologazione, in `T –` e `C –` |

## 5. Bloccato o non eseguito
- La pubblicazione sull'URL principale (`/`) aspetta l'ok di Simone. Nel frattempo si usa la release.
- Non è stato fatto un test da un dispositivo mobile fisico: solo emulazione 390 px nel browser integrato.

## 6. Ritest dopo la pulizia (15:26, release, sessione pulita, 390 × 844)

| Scenario | Risultato |
|---|---|
| S1 caso Christian | 18/18 |
| S13 PDF senza account | 4/4 |
| S14 chat reale su `/assist-claude` | 7/7 ("Noted: home 8001 Zürich ZH · your car BMW 530XD (diesel) (2015) · selling price CHF 15'000 …") |
| S16 correzione in chat fino a Costs, Summary e PDF | 5/5 |

## 7. Stato finale di n8n e ritest (25.11 sera)

Tutto il backend della release è nella cartella `C – Demo`: 14 workflow attivi, compresi `LIVE – AI summary v3` e `LIVE – Feedback`, spostati lì con gli stessi ID, webhook e stato attivo.

Ritest dalla release, sessione pulita, 390 × 844, dati sintetici:

| Scenario | Prima della riorganizzazione | Dopo |
|---|---|---|
| S1 caso BMW–Mégane | 18/18, "CHF 11'140 less" | 18/18, "CHF 11'140 less" |
| S13 PDF | 4/4 | 4/4 |
| S16 chat con correzione fino a Costs, Summary e PDF | 5/5 | 5/5 |
| Riassunto AI (`/summary`) | testo dal modello | testo dal modello |
| Feedback (`/feedback`) | salvato | salvato |
