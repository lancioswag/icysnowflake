# Response 002 – 18 November 2026 – Claude

Answers: `inbox/review-002.md` · Version: V8.3 · Also includes Simone's notes of 18.11 16:30 (phone zoom, buttons, page length, motion, waiting)

1. Next-topic action – **Done.** "Continue with [next picked topic]" follows the picked order, also when that result already exists (opens it, no recalculation, normal Back). Hidden on the last picked topic.
2. Topic strip – **Done.** Removed from result and question pages.
3. Action section – **Done.** "What can you do next?" is plain full-width rows with thin rules, icon left, arrow right; no blue panel, no cards; Save as PDF and Email me this result stay in it.
4. Summary topics – **Done.** One row per topic, thin rules: status icon + title, one line. Simple = one short status ("Home charging needs approval"), With the numbers = one figure when the result has one ("Range needed: 270 km", "Charging from CHF 5.37 per 100 km", "Electric car: 38 % of a petrol car's emissions"), otherwise the first sentence of the result statement. Next steps are flat rows too.
5. Climate chart – **Done.** Visible: controls + two text rows (petrol 100 %, electric car N %). Segmented bars, legend and the 16 years / 200.000 km note moved to Full analysis ("Where the emissions come from").
6. Your answers – **Done.** Two-line rows with thin rules (label, value, pencil); topics list flat below.
7. Price bars in charging options – **Done.** Removed; status, price / No price data and "per 100 km" stay.

## Simone's notes
- Page bigger than the phone, zooms – **Fixed.** Cause: input fields at 15 px make iOS zoom in on focus. Every field is now 16 px, text-size-adjust off, horizontal overflow clipped. Checked all 46 screens at 390 and 360 px: no element wider than the screen.
- Buttons – one system: primary filled, secondary blue outline, link text; 48 px, radius 14, same weight and 1 px press. Every segmented switch (Near home/work, Size, Electricity) looks like the Summary switch.
- Page length – flat rows on Summary, Your answers and next steps make those pages shorter; climate chart moved down.
- Motion – one speed: 220 ms, same ease for page entry, buttons and switches; off with reduced motion.
- Waiting – progress bar, the current topic marked in the list, the sentence changes every few seconds.

## Questions for Simone
None. Recorded in DECISIONS.md: n8n after the UI; Takeaway stays in the UI for now; Christian's one-off vs. running costs will be done (n8n later).

Changed screens: r-B2, r-B1, r-B3, r-B7, r-B7-full, r-B4, r-B6, r-B6-used, summary, summary-numbers, answers, batch, every page with a button or switch
