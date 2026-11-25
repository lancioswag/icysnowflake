# BEV Navigator – verifica 25.11.2026 (seguito del brief Amos)

**Preview:** https://bev-navigator.zurich-hsg.workers.dev/preview/ (build `987d71b`, chiamate a `/navigator-test` e `/assist-claude`, storage `bevnav.preview.v1`).
**Copia n8n (cartella isolata `WGJFWRskcLq16ABV`):**
- `T – B3` (`umM471dUQzsxMykt`), nodo "7 Costs" = `n8n/test/b3_7_costs.js` @ `987d71b`. Deploy con l'esecuzione 17355, poi pubblicato.
- `T – API Navigator` (`lvJB8kXYa28GLUuc`).
- `C – Assist` (`yoyAddSECLWtfgyu`, `/assist-claude`) @ `f92cbae`.

**Frontend:** resta su Cloudflare, come deciso il 25.11. La demo pubblica `/` non è stata toccata in questo giro.
**Produzione:** solo lettura. Workflow del team (Prototype 1/2, LIVE Assist v2) non modificati.

Legenda: ✅ verificato · 🔧 corretto e riverificato · 🟡 parziale · ⛔ non eseguibile (con motivo) · 📝 decisione aperta

## 0. Come è stato provato

| Livello | Cosa | Stato |
|---|---|---|
| n8n, copia T – | Richieste reali al webhook `/navigator-test` e `/assist-claude` tramite l'API di n8n, con un profilo sintetico. Esecuzioni: 16677 → B3 16678 (input Word), 16703 → B3 16704 (dati app), 16757 (chat) | ✅ |
| Frontend preview, in locale | Stessa build della preview (`public/preview/index.html`) in Chrome headless, 390 × 844 e 1366 × 900. B3 calcolato con lo stesso codice di `T – B3`, sugli input catturati. Le risposte salvate di n8n sono in `ui-loop/tools/fixtures/b3_live_*` e corrispondono alla copia n8n (0 differenze riga per riga) | ✅ |
| Frontend preview, live nel browser | Suite `live_stress.js` (S1–S14) contro preview e copia n8n | ⛔ Il browser integrato e Claude in Chrome sono scollegati dalle 09:47. Ultimo passaggio live verificato: 09:20–09:30 sulla build `fb2bea2` (S1 18/18, S11 4/4, S13 4/4); suite completa alle 09:05 sulla build `1f732be`, tutti verdi a 390 e 1366. Le correzioni di questo giro non sono ancora state ripetute live |

### Profili usati (sintetici)

| Profilo | Contenuto |
|---|---|
| **Christian / Word** | 8001 Zürich, casa di proprietà, ricarica a casa; BMW 530xd (1BB439), 2015-01, 150'000 km, vendita CHF 15'000, 8.6 l/100 km. Mégane = Medium usata CHF 20'000; 5 anni; tragitto quotidiano 19.23 km × 5/settimana (9'999.6 km/anno). Tutti gli input del Word (residui 5'000 / 8'000, tasse 600 / 300, assicurazione 900 / 1'000, manutenzione 2'400 / 1'200, interesse 3 %, diesel 2.30, EV 18 kWh, 0.35 CHF/kWh) |
| **Navigator / app** | Stesso profilo senza gli input del Word: consumo, prezzi e tariffe dell'app |
| **Chat** | "I drive a 2015 BMW 530xd diesel with 150000 km and live in 8001 Zurich. I could sell it for 15000. I am looking at a used medium electric car for about 20000 and drive about 10000 km a year." |
| **Varianti** | Vendita vuota / 0 / 15'000; EV in perdita (residuo EV 1'000, manutenzione 4'000, assicurazione 3'000); serie senza dati dal 3° anno |

## 1. Lavoro già consegnato

| Verifica | Atteso | Osservato | Esito |
|---|---|---|---|
| `e2e_medium_used.js` + `christian_mu.json` sulla build della preview | Medium + Used coerente in Lifestyle, Costs, Summary e PDF; 20'000 / 15'000 / 5'000 | 12/12: Lifestyle "Mid-size car"; Costs usato, prezzo 20'000, vendita −15'000, cash 5'000; Summary "Mid-size car, used, about CHF 20'000"; PDF con cash 5'000 e payback; riordino da tastiera | ✅ |
| Senza installazione | "Other upfront costs: none, 0" | 0 con ricarica a casa (test chat) | ✅ |
| Chat: estrazione (`/assist-claude`, esecuzione 16757) | anno, km, vendita, classe, usato, prezzo EV | patch: `car_first_registration_year 2015, car_mileage_km 150000, car_sale_price_chf 15000, ev_size medium, ev_purchase used, ev_price_chf 20000` (+ CAP, marca, modello, carburante) | ✅ |
| Chat: conferma, salvataggio, uso nel risultato (`e2e_chat_edit.js`) | "Noted: … selling price CHF 15'000 · electric car: Mid-size car, used, about CHF 20'000"; profilo e localStorage aggiornati; Costs usa i valori | 11/11 | ✅ |
| Modifica della vendita in **Your answers** (15'000 → 12'000) | Costs, Summary e PDF aggiornati | Costs vendita −12'000, cash 8'000; Summary "you pay CHF 8'000 upfront"; PDF completo e one-pager con 12'000 e 8'000 | ✅ |
| La preview usa le copie | `/navigator-test` (T – API → T – B3) e `/assist-claude`; mai `/assist-v2` | `CONFIG.paths` e richieste registrate nel test | ✅ |

Osservazione sul percorso chat: la chat non chiede ancora i km annui come campo (li ricava dai viaggi, chiesti dopo). Finché la ricarica a casa non ha risposta, l'app assume un'installazione (CHF 2'750, mostrata come riga "home charging installation"); con "casa di proprietà, ricarica a casa" torna a 0.

## 2. Confronto BMW–Mégane

### 2.1 Scenario Christian (input del Word): copia n8n, esecuzione 16678

| CHF all'anno (5 anni) | BMW 530xd | Mégane usata |
|---|---|---|
| Perdita di valore | 2'000 (15'000 → 5'000) | 2'400 (20'000 → 8'000) |
| Interessi (3 % sul valore medio) | 300 | 420 |
| Energia | 1'978 | 630 |
| Tassa | 600 | 300 |
| Assicurazione | 900 | 1'000 |
| Manutenzione | 2'400 | 1'200 |
| Vignetta | 40 | 40 |
| **Per anno** | **8'218** | **5'990** |
| **5 anni** | **41'090** ✅ | **29'950** ✅ |

Differenza 11'140; cash oggi 5'000; payback anno 1. Il foglio di Christian è riprodotto esattamente.

**Valori non modificabili nella UI:**
- vignetta: CHF 40, prezzo federale, uguale per le due auto;
- km annui: derivano dai viaggi (19.23 km × 2 × 260 giorni = 9'999.6 km invece di 10'000). L'energia della BMW non cambia per questo (1'978 in entrambi i casi).

Tutti gli altri input del Word si cambiano in **Sources & our assumptions**: residui, anni di riferimento, tasse, assicurazione, manutenzione, interesse, prezzo diesel, consumo e prezzo dell'elettricità. Il campo "anni di riferimento del residuo" compare solo dopo aver inserito un residuo.

### 2.2 Scenario Navigator (ipotesi dell'app): copia n8n, esecuzione 16704

| CHF all'anno | BMW Word | BMW app | Mégane Word | Mégane app | Da dove viene la differenza |
|---|---|---|---|---|---|
| Perdita di valore | 2'000 | 1'888 | 2'400 | 2'181 | App: BMW −18 %/anno (15'000 → 5'561 dopo 5 anni); EV curva Eurotax BFE/EBP 2023 (20'000 → 9'095). Word: residui 5'000 / 8'000 |
| Interessi | 300 | 129 | 420 | 182 | App 1.25 % (tasso minimo LPP/BVG), Word 3 %; stessa formula (tasso × (valore iniziale + finale) / 2) |
| Energia | 1'978 | 1'668 | 630 | 538 | Vedi 2.3 |
| Tassa | 600 | 288 | 300 | 0 | App: tabella TCS 2026, canton ZH; elettriche esenti a ZH |
| Assicurazione | 900 | 618 | 1'000 | 727 | Comparis 2025, punto medio. BMW: solo RC (auto con più di 5 anni). EV: casco completa nei primi anni (1'074 nella lista ipotesi), poi solo RC. 727 è la media sui 5 anni |
| Manutenzione e gomme | 2'400 | 1'365 | 1'200 | 821 | BFE/EBP 2023 per taglia; auto vecchie +5 %/anno oltre i 5 anni; EV ×0.6, usato +10 % |
| Vignetta | 40 | 40 | 40 | 40 | – |
| **5 anni** | 41'090 | **29'978** | 29'950 | **22'444** | Differenza app **7'534** (Word 11'140); cash 5'000 in entrambi |

### 2.3 Energia della Mégane: perché 538 e non 545

Valori non arrotondati usati dalla copia n8n (esecuzione 16704):
- **Consumo:** 2'184 kWh all'anno su 10'000 km = **21.84 kWh/100 km**. È il valore WLTP della classe M1, corretto per velocità e riscaldamento invernale (tragitto quotidiano, 65 giorni inverno + 195 estate), senza perdite di ricarica.
- **Prezzo:** **CHF 0.2463/kWh**, tariffa ElCom 2027 Zürich, profilo H4, prodotto standard. Il 100 % della ricarica è a casa.
- **Risultato:** 2'184 × 0.2463 = **537.92 → CHF 538**.

Il report e l'app mostravano 21.8 kWh e CHF 0.25: 10'000 × 0.218 × 0.25 = 545. L'errore era solo di arrotondamento nella formula esposta.

🔧 **Correzione:**
- n8n restituisce consumo con 2 decimali, prezzo con 4 decimali, più kWh e litri all'anno;
- Costs, la lista ipotesi e il PDF mostrano gli stessi valori.

Formule ora visibili, entrambe ricostruibili:
- "10'000 km a year at 21.84 kWh per 100 km and CHF 0.2463 per kWh: CHF 538 a year"
- BMW: "9'999.6 km a year at 8.26 l per 100 km and CHF 2.02 per litre: CHF 1'668 a year". Qui 8.26 = 7.0 l NEDC × 1.18 (ICCT, omologazione 2007) e 2.02 è la media BFS nov 2025–ott 2026.

### 2.4 Esborso, esercizio, svalutazione: controllo numerico (`reconcile.js`, sulle due esecuzioni n8n)

| Controllo | Word | App |
|---|---|---|
| Cash oggi = prezzo + installazione − vendita | 20'000 + 0 − 15'000 = 5'000 ✅ | 5'000 ✅ |
| TCO BMW = svalutazione (15'000 − valore finale) + interessi + esercizio × 5 | 10'000 + 1'500 + 29'590 = 41'090 ✅ | 9'439 + 645 + 19'895 = 29'979 ✅ |
| TCO EV = (prezzo − valore finale) + interessi + esercizio × 5 + installazione | 12'000 + 2'100 + 15'850 = 29'950 ✅ | 10'905 + 910 + 10'630 = 22'445 ✅ |
| Riepilogo: −cash + differenza valori finali + esercizio + interessi = differenza TCO | −5'000 + 3'000 + 13'740 − 600 = 11'140 ✅ | −5'000 + 3'534 + 9'265 − 265 = 7'534 ✅ |
| Payback = primo anno da cui il TCO EV resta ≤ TCO BMW | anno 1 ✅ | anno 1 ✅ |

- La vendita riduce solo la cassa di oggi. Nel TCO il valore attuale della BMW (15'000) è la base della sua svalutazione. Nel riepilogo la vendita compare una volta sola: −5'000 + 3'000 è la differenza di svalutazione (12'000 − 10'000).
- Il payback non somma l'esborso iniziale al TCO. Se lo facesse, cadrebbe nell'anno 3 (Word) o 4 (app); il test lo verifica.

🔧 **Bug trovato e corretto.** "Running costs per year" non includeva la vignetta, anche se la tabella la mostrava come riga:
- totale BMW 5'878 invece della somma delle righe, 5'918;
- "Running costs over 5 years" 29'390, per cui le righe non portavano a 41'090.

Ora 5'918 / 3'170 l'anno e 29'590 / 15'850 su 5 anni. Il totale e la differenza erano già giusti (la vignetta è uguale per le due auto).

### 2.5 Decisioni aperte 📝
1. **Perdite di ricarica.** Il consumo della classe le esclude; il valore dell'utente "alla presa" le include. Opzione: aggiungere +10–15 % al valore di classe (con fonte), oppure lasciarle fuori e dirlo, come oggi.
2. **Mix casa/pubblico.** Oggi tutta la ricarica quotidiana avviene nel luogo scelto (casa = ElCom). La quota DC vale solo sui viaggi lunghi (tratte oltre la prima carica). Da decidere un mix tipico (per esempio 80/20) per chi ricarica a casa.
3. **Tassa cantonale inserita dall'utente.** Il valore vale per tutti gli anni e sostituisce la tabella TCS, senza le riduzioni per età o per le EV. Da decidere se trattarlo come "primo anno" e applicare comunque la regola cantonale.

## 3. Punti ancora aperti

| Punto | Verifica | Esito |
|---|---|---|
| Vendita: vuoto / zero / stima | Vuoto → "our estimate" (stima etichettata); 0 → "your value", cash = 20'000; 15'000 → "your value", cash 5'000 (`e2e_stress_local.js`) | ✅ |
| AutoScout24 | Sotto il campo: "AutoScout24 estimate: not available"; nessuna stima interna attribuita ad AutoScout; la stima è etichettata "our estimate" | ✅; la stima vera resta subordinata all'accesso partner 🟡 |
| "Recurring monthly update" | Non presente nel codice di app e preview. Resta solo in una vecchia cattura (`ui-loop/SCREENS.md`, mappa del 23.11) e nella nota del report 24.11. La Start mostra "Tables last checked: 23 Nov 2026. Updated by hand for now. Queried live when you calculate: your car's type approval (ASTRA) and your routes." Le ipotesi mostrano la data effettiva del dato: ElCom 2027, BFS nov 2025–ott 2026, TCS 2026, Comparis 2025, BFE/EBP 2023 | ✅ |
| Start a 390 px | Screenshot `Start_390px_preview.png`: "Why not just use a chatbot?" è un pulsante; il confronto si apre solo da lì | ✅ |
| HSG e Zurich sulla Start | La mail di Christian chiede di toglierli. Decisione di Simone in questa sessione: il 24.11 "Christian intendeva la versione vecchia, l'abbiamo già fatto"; il 25.11 "Keep HSG line". Oggi sulla Start non c'è Zurich; c'è una riga HSG come crediti. Zurich compare solo nel piè di pagina del PDF ("HSG and Zurich") | 📝 risolto per decisione di Simone; da confermare con Christian, perché la decisione non è ancora in un documento del team oltre ai report |

**Refresh dei dati (per il seguito, non implementato).**
- Un workflow n8n mensile (Schedule, 1° giorno lavorativo) nella cartella isolata scarica:
  - ElCom (LINDAS SPARQL) per le tariffe;
  - BFS LIK (prezzi carburante);
  - le tariffe di ricarica.
- Valida i valori e li carica (upsert) nelle tabelle R12 di Supabase, con `source`, `as_of` e `checked_at`.
- Il frontend mostra `max(checked_at)` al posto della data fissa.
- Finché il job non gira ed è verificato, la Start resta "Updated by hand for now".

## 4. Stress test di fine giro

### 4.1 Eseguito in locale sulla build della preview (`e2e_stress_local.js`, `e2e_chat_edit.js`, `e2e_medium_used.js`, `regress.js`, `edge.js`, `reconcile.js`)

| Caso | Atteso | Osservato | Esito |
|---|---|---|---|
| Riordino prima della selezione, touch | Trascinando il 3° tema in cima diventa la prima scelta | Ordine e selezione corretti (eventi touch reali via CDP) | ✅ |
| Riordino da tastiera | Alt + ↑ sposta il tema | ok | ✅ |
| Input vuoti, zero, mancanti | Stima etichettata / 0 rispettato / richiesta del dato mancante | ok | ✅ |
| Medium usata, budget stretto | Spiegazione del limite (live S4 alle 09:05) | regress.js blocco 9 ok | ✅ |
| Modifica risposte dopo il risultato | Costs, Summary e PDF aggiornati | vendita 15'000 → 12'000, cash 5'000 → 8'000 | ✅ |
| Payback presente / assente / non calcolabile | "in year 1" / "not within N years" / nessun anno + anni senza dati | ok | ✅ |
| PDF | Report completo e one-pager con le stesse cifre | 41'090 / 29'950 / 11'140 / 5'000 | ✅ |
| Workflow lento (12 s) | Schermata di caricamento, poi risultato | ok | ✅ |
| Workflow in errore (502) | Pagina d'errore con retry, risposte conservate | ok | ✅ |
| Chat non raggiungibile | Messaggio chiaro, domande guidate disponibili | ok | ✅ |
| Launcher della chat, 1366 px | Nessun comando coperto | ok | ✅ |
| Launcher della chat, 390 px | Nessun comando coperto | Prima: copriva "+30 %" in Costs a pagina ferma. 🔧 Ora si sposta quando sotto c'è un comando | ✅ (visibile in 9 posizioni su 22; resta il link "Tell us in your own words" in Home) |
| Regressioni (regress, edge, unit_payback) | Nessun errore JS né overflow | ok | ✅ |

### 4.2 Live su preview + copia n8n
| Caso | Esito |
|---|---|
| Cinque temi, viaggio all'estero modificato e cancellato, reset e ripresa (refresh), back, AI spenta, errore con retry, chat + parità | ⛔ **Da ripetere dopo le correzioni.** Motivo: browser scollegato dalle 09:47. Ultimo passaggio verificato: tutta la suite verde alle 09:05 sulla build `1f732be` (390 e 1366); S1, S11 e S13 verdi alle 09:25 sulla build `fb2bea2` |
| Calcolo B3 sulla copia n8n con il profilo sintetico | ✅ esecuzioni 16678 e 16704 (vedi §2) |
| Chat sulla copia `/assist-claude` | ✅ esecuzione 16757 |

## 5. Correzioni di questo giro (file e nodi)

| Correzione | File / nodo | Riprova |
|---|---|---|
| Vignetta inclusa nei costi d'esercizio | `public/index.html` (b3Model) | reconcile.js, PDF |
| Energia con la precisione usata (kWh e litri all'anno) | `n8n/test/b3_7_costs.js` → T – B3 "7 Costs"; `public/index.html` (energyFormula, energyParts, valori delle ipotesi) | esecuzione 16704, reconcile.js |
| Consumo della tua auto a 0.01 l nella lista ipotesi (8.26, non 8.3) | `b3_7_costs.js` | locale |
| Launcher della chat che si sposta sopra i comandi | `public/index.html` (bubbleGuard) | e2e_stress_local.js |
| Nuovi test | `ui-loop/tools/e2e_chat_edit.js`, `e2e_stress_local.js`, `reconcile.js`; risposte n8n salvate in `fixtures/` | – |

PDF sintetico del caso Christian rigenerato sulla build `987d71b` con la risposta della copia n8n (esecuzione 16678): `BEV_Navigator_Christian_BMW_Megane.pdf` (8 pagine) + one-pager.

## 6. Problemi aperti

1. **Stress test live** da ripetere sulla build `987d71b` appena il browser è ricollegato. Script pronto: `/preview/stress.js`, S1–S14 + S9a/S9b.
2. **Demo pubblica:**
   - il frontend non è promosso (serve l'ok di Simone);
   - `C – B3` è a `ecb5f8a`: non ha ancora la precisione dell'energia né la vignetta nei costi d'esercizio, che sono correzioni del frontend.
3. **Launcher su telefono:** ora non copre più i comandi, ma è nascosto in molte posizioni. In alternativa si può mettere un'icona chat nella barra in alto.
4. **Chat:** non legge i km annui come campo. L'installazione è assunta finché la ricarica a casa non ha risposta; conviene dirlo nella conferma.
5. **Decisioni aperte (§2.5):** perdite di ricarica, mix casa/pubblico, tassa inserita dall'utente.
6. **Altri punti:**
   - AutoScout24: serve l'accesso partner;
   - refresh mensile dei dati: da costruire (§3);
   - HSG/Zurich: da confermare con Christian.
7. **Assicurazione EV:** la lista ipotesi mostra 1'074 (primi anni, casco completa) mentre la tabella usa la media su 5 anni (727). È corretto ma può confondere: aggiungere "average over the years kept".
