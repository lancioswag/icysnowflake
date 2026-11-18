# State – updated by Claude after every round

Version: **V8.5** (18 Nov 2026 night, Claude: Simone's voice notes on every screen, feedback box, A/B gallery /gallery/)
Live app: https://icy-snowflake-1754.ricordatilamail18.workers.dev
Screen map (45 screens, wires = taps): https://icy-snowflake-1754.ricordatilamail18.workers.dev/map/
Text of every screen: `ui-loop/SCREENS.md`
Last response: `outbox/response-002.md` (review 002)
Loop: the scheduled Claude run is stopped. Codex implements and deploys directly while Simone reviews the map.

## Changed in V8.5
Numbers 15’000 (Swiss apostrophe). Error page: "Something went wrong" + Try again / Back. Footer without the data line. Old pages "I'm not sure" and "Connection & data" removed. Account: no "saved" line, no delete; "Delete your answers" on Your answers (also deletes the account copy). Summary waits for its AI text on the calculating screen, no Simple/With the numbers switch, no underline, one line per topic with a figure. Key card: big figure + its own line, the sentence is not repeated. Charging: short labels in one aligned grid, Write email = own screen. Edit your inputs = own screen (Back returns, Recalculate skips it in history). Topic pages: Next steps only for real outside actions, then Continue / Check another topic ("Your answers are kept"). Climate: −62 %, "Charged with", two plain bars. Which car: "Medium (450+ km)", one table, no Must/Any. Battery: "Battery health", Warranty and Value as info pop-ups. Questions: trips as a 2-column grid without subtitle, 1–7 work days, no separate "other trips" question, no budget subtitle, "How many people are in the car?" (you included, 1–6+), type approval on its own line, battery question "Which battery do you want to check?". "Was this helpful?" + comment at the end of the Summary → n8n workflow "Feedback – Navigator UI and A/B gallery" (sDwbPpWFwpI2GmXO) → data table ui_feedback. A/B gallery for the team: /gallery/ (colour, buttons, animation, speed, amount of text, wording, logo), votes to the same table.

## Changed in V8.4
Start actions are separated from five topic keys; pressed keys are softer. The top badge counts selected topics; Start and Your answers link to Start fresh. Summary loses its three counters; the car-fit range loses its underline. Assistant is available in the top bar with shorter copy and a send icon. Full-width action icons align on the left. Range and Charging expose the trip editor from their results; changing kilometres on a distance-only trip keeps its country. The map has a clickable overview and the five topic results in one row. Start, Assistant, reset, Summary, answers, Range, Charging and Car fit screenshots are current; other screenshots still show V8.3.

## How to see a screen yourself
Open the live app on a phone-size window. Answers stay in the browser (localStorage `bevnav.v1`). Results come from n8n live, 5–40 s per topic.

## Changed in V8.4
See `RESEARCH.md`. Single-answer questions go on with one tap; key card starts with one big figure (Range, Costs, Climate, Which car); accent themes `?theme=pine|ink|petrol|blue` (default still blue until Simone picks), background glow and logo follow the theme.

## Changed in V8.3 (review 002)
Continue with next picked topic (also when done); no topic strip; What can you do next = flat rows; Summary topics one line each (status / figure); Climate bars in Full analysis; Your answers flat rows; no price bars; fields 16 px (no iPhone zoom), no horizontal overflow at 360–390 px; one button system; one motion speed 220 ms; waiting screen with progress bar and changing sentence.

## Changed in V8.2 (review 001)
No floating assistant button (Start link only); Costs: one visible "Cost at a glance" block with the year selector, Value later and options in Full analysis; Which car: "Your car option" rows, board in Full analysis; Climate: no "– km" range buttons; Charging: "per 100 km if installed", "No price data" arrow only with an operator link; trips: a picked preset shows once; Your answers: resolved car name or "Car details unavailable"; q2 hint hides when valid; Summary Takeaway names the extra cost when the EV costs more.

## Changed in V8.1
Back = previous page; picked topics kept on Start, "Recalculate" when done; one question round for all picked topics, then Summary; one result template (question + pencil, key card, one block, Full analysis with sources at the end, Edit your inputs, What can you do next with save/share); Charging rebuilt (Possible + Write email, subsidy box, grouped sites, one-circle map, No price data → operator, short charging times); Range/Costs/Battery cards; Summary header Summary · Topics n/6 · Takeaway · counters; Your answers pencil only + Done/Not checked yet; Account minimal; numbers 30.000 – 45.000; one button design; sticky top bar.

## Open points (not UI, for Simone / n8n)
- n8n (later, decided): move the Takeaway cost rule into the summary prompt; add a separate yearly running cost and the rental assumptions to B3 for one-off vs. running (Christian).
- n8n B6: value of the car 0 % after 7 years at 37.000 km/year (test profile commutes 270 km a day). Check the mileage adjustment.
- Not linked anywhere: `orient` ("I'm not sure"), `settings`. Keep, link or delete? (Simone)
- Operator links for "No price data" are a small table in the page (unknown operators now get no link); better one URL per operator from n8n.
- Screen map uses saved n8n answers (fake street in St. Gallen); the Climate size/range buttons show "– km" there because the fixture keeps one car class only.
