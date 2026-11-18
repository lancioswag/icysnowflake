# State – updated by Claude after every round

Version: **V8.1** (18 Nov 2026, commits 298240b, 50d1feb)
Live app: https://icy-snowflake-1754.ricordatilamail18.workers.dev
Screen map (45 screens, wires = taps): https://icy-snowflake-1754.ricordatilamail18.workers.dev/map/
Text of every screen: `ui-loop/SCREENS.md`
Last response: — (no review yet)

## How to see a screen yourself
Open the live app on a phone-size window. Answers stay in the browser (localStorage `bevnav.v1`). Results come from n8n live, 5–40 s per topic.

## Changed in V8.1
Back = previous page; picked topics kept on Start, "Recalculate" when done; one question round for all picked topics, then Summary; one result template (question + pencil, key card, one block, Full analysis with sources at the end, Edit your inputs, What can you do next with save/share); Charging rebuilt (Possible + Write email, subsidy box, grouped sites, one-circle map, No price data → operator, short charging times); Range/Costs/Battery cards; Summary header Summary · Topics n/6 · Takeaway · counters; Your answers pencil only + Done/Not checked yet; Account minimal; numbers 30.000 – 45.000; one button design; sticky top bar.

## Open points (not UI, for Simone / n8n)
- n8n B6: value of the car 0 % after 7 years at 37.000 km/year (test profile commutes 270 km a day). Check the mileage adjustment.
- Not linked anywhere: `orient` ("I'm not sure"), `settings`, `reset`. Keep, link or delete? (Simone)
- Operator links for "No price data" are a placeholder table in the page; better one URL per operator from n8n.
- Screen map uses saved n8n answers (fake street in St. Gallen); the Climate size/range buttons show "– km" there because the fixture keeps one car class only.
