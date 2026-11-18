# Other EV navigators – what to take (Claude, 18 Nov 2026, tested at 375 px)

| Tool | Best idea | Look |
|---|---|---|
| GreenCars Matchmaker (Simone's favourite) | 7 questions, one per screen, **tap = next** (no Next button), "Question 1 of 7" + thin bar, answers in plain speech ("I haul things. Tools, toys, trailers."), results with score + price range + "Not quite right? Try again" | deep green #005E47 on warm cream #FBF9F6 panel, rounded display font, 150 ms (0.4,0,0.2,1) on controls, 300 ms on panels, content enters in 650 ms |
| MonVE.ch (Swiss) | **One big number** on a dark "receipt" card (51'552 CHF, ≈ 28 CHF a day), every line with % of total, inputs stay editable above the result, every figure with source + date, copy summary, PDF, state in the URL | off-white #F6F4EF, near-black #1D1D1F, yellow dot accent, Geist, pill buttons, dot-matrix car illustration |
| DriEV | First question "Where are you with EVs?" (driving one / shopping / curious) tailors the rest; **"I'm not sure – use an average" on every question**; "Skip to my results"; mid-quiz "Here's your driving today"; result hero card "$631 saved per year · about $53 a month" + "Change my numbers"; "The short answer" ✓ / ! rows; one "Your next step"; "Was DriEV helpful? Yes / Not really" | green #0B7F5E, white cards radius 16, thin teal border |
| Ever | Grey option cards, bold label + grey hint, selected = white card with dark outline, section name + segmented progress, sticky Continue | black / white / grey, iOS-like |
| zzd (Swiss) | Assumptions as one sentence: "15'000 km a year · 5 years · 85 % at home · Change" | mono logo, plain |
| Clive | Honest promise: "No sign-up, and I'll say no if the answer is no"; "Check my working: see how every answer counted" | yellow highlight, black card with offset shadow |
| ChooseEV | Journey stages Explore → Compare → Buy → Prepare → Own | lime on dark |
| CAA EV Matchmaker | "Why does this matter?" link under each question | dated blue gradient (what to avoid) |
| BEV Database | "3–5 matches, not one perfect winner", one trade-off per match, shareable link | dark, cyan |
| EVRadar | Pre-selected sensible default ("mainstream sweet spot") | teal, generic |
| Carculator (PSI) | Scientific depth, not usable on a phone | – |
| PlainEV | not reachable (also for Simone) | – |

## Taken in V8.4
- Tap = next on single-answer questions (Next stays for lists, fields, multi choice).
- Big figure first in the key card (Range km, Costs CHF + a month, Climate %, Which car days covered), sentence smaller under it.
- Accent themes to choose from, background kept: `?theme=pine` (GreenCars/DriEV green), `?theme=ink` (MonVE black), `?theme=petrol`, `?theme=blue` (current). The background glow follows the theme.

## Proposed next (not built yet)
1. "I'm not sure – use a typical value" on every question (DriEV).
2. "Your details" sentence with Change instead of the "Edit your inputs" fold (zzd, DriEV).
3. "Was this helpful? Yes / Not really" at the end of the Summary, for user tests (needs a place to store answers, e.g. an n8n webhook).
4. % of total on cost lines and "≈ CHF … a day/month" next to big amounts (MonVE).
5. "Why does this matter?" one-line info under questions (CAA).
6. Content entry motion like GreenCars: 300 ms rise with 40 ms stagger, controls 150–220 ms.
