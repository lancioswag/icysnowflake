# BEV Navigator – UI brief (source of truth for the loop)

## Product
Neutral web check for private people in Switzerland who hesitate to switch to an electric car (HSG consultancy project for Zurich Insurance). Six topics ("barriers"): Range & battery life, Charging access, Costs & resale value, Battery (shown inside Range and Costs), Climate impact, Which car fits me. Results are calculated by n8n from Swiss data (BFE, ASTRA, ElCom, swisstopo). The UI never invents numbers.

Live: https://bev-navigator.ricordatilamail18.workers.dev · Code: `public/index.html` (single file, vanilla JS) · Language of the app: English.

## Whose feedback weighs most
1. Simone (owner, `DECISIONS.md`) 2. Christian (Zurich, weighs most among stakeholders) 3. Philipp, team (Martin, Daniel, …).

## Hard rules (from Simone and Christian)
- **Mobile first, 390 px.** Desktop is a wider version of mobile, never the reverse.
- **Much less text.** If Simone deleted a text, it must not come back. No marketing tone ("2 minutes, no account"): we do not need to convince anyone.
- **Early summary, deep dive on demand** (Christian): one sentence and one number first, details behind "Full analysis".
- **One template, reused.** Every topic page: question + pencil (right) · key card · one block · Full analysis (sources & assumptions compact at its end) · Edit your inputs · What can you do next (save/share inside) · Continue with next topic. No new layouts for single topics.
- **No box inside a box inside a box.** Use spacing and thin rules.
- **No duplicated navigation.** Top bar has back, Your answers, account, home. No "Back to start", "All results", "Other topics", "Start over" at page bottoms.
- **Back = the page seen before.** Never jump home, never recalculate.
- **Each question asked once** across all picked topics; then all picked topics are calculated and the Summary opens.
- **Selection = pressed key** (filled, sunk 1 px), no ticks or badges. Next button and pressed keys share colour, radius and depth.
- **Drag handle stays** on the picked topics (Christian).
- **One motion style**, same speed everywhere (220 ms, soft ease), off with reduced motion.
- **Numbers:** dot as thousands separator, ranges with spaced en dash: `CHF 30.000 – 45.000`.
- **Status colours:** done = green tick, not done = red dot; works / limitation / open as on the Summary.
- **Keep the current blue** (#2564df) and Inter.

## Page notes already decided
- Start: title "What's holding you back?", topic keys, blue button "Continue", "Recalculate" when all picked topics have results, "Your results" when any exist.
- Charging: "Possible" + one line; "Write email" with the template under it (no numbered steps); subsidy in its own small box; public charging = points within 500 m + nearest fast charger + map with one circle, tap a point for details; sites grouped and named once; "No price data" with arrow to the operator; charging times one line each.
- Range: "A real range of N km covers all your trips." + grey info line; battery card after 5 / 8 years; chart only in Full analysis; warranty in one line.
- Summary: "Summary" · "Topics n/6" · Takeaway (one sentence) · "x work for you · y with a limitation · z still open" · Simple / With the numbers · Your topics (schematic lines) · next steps in rows · save/share grid.
- Your answers: pencil only, no subtitle, topics Done / Not checked yet.
- Account: "Save your answers", Create account | Log in, email + password only.

## Out of scope for the loop
n8n workflows and calculations, Supabase, assistant prompts. Report problems in `STATE.md` → Open points.
