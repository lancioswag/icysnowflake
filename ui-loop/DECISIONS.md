# Decisions by Simone (win over BRIEF.md and over any review)

<!-- Write one line per decision, newest on top. Write STOP to stop the loop. -->

- 2026-11-18: Codex implements and deploys UI updates directly while Simone reviews the map; no waiting for the Claude loop.
- 2026-11-18: Start keeps five topic keys. Visually separate them from Continue, Your results and Tell us in your own words; use a softer pressed-key style. The top badge counts selected topics. Your answers and Start provide Start fresh. Keep the assistant launcher available on every screen.
- 2026-11-18: Summary keeps the page but removes the three work/limitation/open counters. Remove the underline under 350 km in the car-fit result. Keep the product name BEV Navigator.
- 2026-11-18 16:30: Scheduled loop stopped. Simone reviews the screen map and gives the next tasks directly; ChatGPT reviews still come in as inbox/review-NNN.md.
- 2026-11-18 16:30: First the UI, n8n is changed afterwards to match. Takeaway with the extra cost stays in the UI for now; later the rule moves into the n8n summary prompt (one source).
- 2026-11-18 16:30: Christian asked for one-off vs. running costs: do it. n8n will deliver a separate yearly running cost and the rental assumptions (later); the UI shows the split.

- 2026-11-18: Loop started. Claude builds, ChatGPT reviews, UI only, deploy to main is fine.

## 19.11 – Gallery result (Simone)
- Colour: background and text stay as the old blue (A); buttons and accent myblueplanet blue #2b69b4 (C).
- Buttons: raised shape with the soft shadow of option C.
- Motion: rise, one element after another (110 ms apart), 650 ms each; leaving a question 200 ms.
- Logo: map pin + bolt in the old blue #2564df (app bar and browser icon).
- Text: big figure on one line, monthly amount right under it, explanation below; every CHF range shown as one average, "about CHF …".
- Wording: stays as decided by Christian. Gallery closed (/gallery/ shows "Voting is closed").

## 19.11 – Second round of Simone's notes (V8.8)
- Top bar and chat use the app background (blurred), no own colour.
- No auto-advance: every answer is confirmed with Next. Tapping a greyed-out Next/Recalculate shows the reason in red.
- Car: Brand → Model → Fuel (only if several) → Version; camper/conversion bodies (FIAT-ADRIA, …) hidden; lists stay open when the keyboard closes.
- First registration of the current car optional (year alone is fine; empty → age estimated from mileage, 15’000 km/year).
- Postal codes: 3’348 codes with locality names (e.g. 6950 Tesserete (Capriasca) TI), from GeoNames via npm swiss-zipcodes.
- Results: no pencil at the top; key box "In short" with a coloured left edge on every topic; full analysis indented under the section titles, more space.
- B2 map: CARTO Voyager tiles, 500 m circle around the estimated home point (it was never drawn before: SVG width bug).
- B3: big figure + "/ CHF … a month"; "To pay today" as a formula with + / −; missing area data shown as an orange note.
- B7: "−62 % greenhouse gases than a new petrol car"; keep-vs-switch sentence names the comparison; two boxes (t saved / flights); "Calculated for" in rows.
- Sources: pills "Source ↗" (link) vs "Our assumption".
- Summary: title "What we found for you", "In short" box like the topics; "Was this helpful?" removed → short sheet after saving/sharing + "Give feedback" link in the footer (research: ask right after a finished task, never mid-flow).
- Open for n8n: B7 block1 does not change with renewable electricity; ElCom price / motor tax gaps; AC prices; chat prompt length (frontend sends answer_style + app_facts meanwhile).

## 19.11 – V8.9: Navigator inside the chat, model selector, new report
- n8n: new workflow "Assist v2 – Navigator in chat (model selector)" (OGgnBIfA6tjZWZSk, folder Test Claude), POST /webhook/assist-v2, contract assist-2.0. Copy of "Assist – Navigator chat" (old /assist untouched).
  - Model selector: DEFAULT_MODEL in "Build prompt" → openai (gpt-6-luna, default, ~2 s), groq (openai/gpt-oss-120b, works), gemini (gemini-3.8-flash, works, ~15–20 s), anthropic (claude-haiku-5-5: the stored credential is Bearer, Anthropic needs x-api-key → not working yet). The page can test one with ?model=groq etc.
  - mode chat returns start_check (topics) + patch (facts the user said); mode intake turns free text into a patch for the open question.
- Frontend: the chat asks the same questions as the Navigator (same blocks, same validation), applies the patch (checked in the page), runs the same /navigator calls and shows the summary in the chat with links to each topic. Town names → postal code from the local list.
- Full report (PDF): cover with the AI takeaway and one line per topic (big figure), "In short" box per topic, fewer columns, max 5 charging sites, formula for "to pay today", sources as "Source ↗ / Our assumption", CO2 without "eq", no long tip lists.
- Sasha: Costs say "Two options: buy a new electric car, or keep your car (no new petrol car here)"; Climate says the bars compare two new cars and the keep-vs-switch part is a different question.

## 19.11 – V8.10 (Christian's feedback)
- Start title "Ready to make the switch to electric?"; topic "Which electric car fits me" → "Lifestyle match" (punchier, same style as the other topics).
- Charging question: "Let's talk charging" + subline "Which situation is on your mind?".
- Charging key sentence worded positively: no fixed parking → "No fixed parking space? No problem. Public charging is close by."
- Charging result: the map ("Your charging options") is the only block on the page; cost ranking, home and work blocks, charging times, long trips and abroad are in the Full analysis dropdown. Next steps (emails, BFE map) stay.
- While calculating (one topic or all): a green box with a leaf and one positive line, changing every ~4 s ("Thanks for helping build a greener future." / "Every EV on the road makes the air a little cleaner." / "Great that you're thinking green!"). Christian's lead-ins ("Almost done…" etc.) are left out: the status is already above, and "Almost done" would appear too early. Replaces the grey placeholder bars.
