# Review 002 – 18 November 2026 – ChatGPT

Status: continue
Based on: V8.2 (STATE.md, c9604f2), live app and screen map inspected at 390 px on 18 November 2026

## Items

### 1. r-B2, r-B1, r-B3, r-B7, r-B4 – restore the next-topic action
- Priority: high
- Problem: After the selected topics have all been calculated, a topic result ends at “What can you do next?” The promised “Continue with next topic” action is absent, so the reader has to navigate back to the Summary to read the next result.
- Change: After “What can you do next?”, show one primary button labelled “Continue with [next selected topic title]”, using the next topic in the person's selected order even when its result already exists. Open that saved result and keep the normal Back history; do not recalculate. Omit the button only on the last selected topic. BRIEF rule: one reused topic template ending with Continue with next topic; Back = the page seen before.
- Applies to: the five selectable topic pages

### 2. r-B2, r-B1, r-B3, r-B7, r-B4, r-B6, r-B6-used – remove the duplicate topic strip
- Priority: high
- Problem: A horizontal strip of topic names sits between the top bar and the result question. On a 390 px phone, the current topic can be offscreen, and the strip pushes the key result down.
- Change: Remove this strip from result pages. Keep the existing top bar and the topic picker with its drag handle on Start. The Summary and the bottom “Continue with [next selected topic title]” button provide movement between topics. BRIEF rule: no duplicated navigation; one sentence and one number first; mobile first.
- Applies to: all topic pages

### 3. r-B2, r-B1, r-B3, r-B7, r-B4, r-B6, r-B6-used – flatten the action section
- Priority: high
- Problem: “What can you do next?” is a large blue container holding several separate white rounded cards. This is a box inside a box and takes most of a phone viewport.
- Change: Keep the heading and the existing action labels and order. Render the actions as plain full-width rows on the page, separated by thin rules, with the existing icon at left and an arrow at right. Remove the blue outer panel and the rounded border/background from each action; keep Save as PDF and Email me this result in the same section. BRIEF rule: no box inside a box; less text; one reused topic template.
- Applies to: all topic pages

### 4. summary, summary-numbers – make “Your topics” schematic
- Priority: high
- Problem: Six large rounded topic cards repeat long explanations already introduced by the Takeaway and the topic pages. “With the numbers” adds paragraphs without making the overview easier to scan.
- Change: Under “Your topics”, replace each card with one linked row separated by a thin rule: existing topic title and status icon on the first line, one outcome line on the second, arrow at right. In Simple, use at most one existing short outcome per topic (for example “Home charging needs approval”); in With the numbers, use at most one existing metric per topic (for example “Range needed: 270 km”). Keep source references in the existing Sources section; do not create or change values. Keep the Takeaway, counters, next-step rows and save/share grid. BRIEF rule: Summary uses schematic lines; much less text; early summary, deep dive on demand.
- Applies to: these two screens

### 5. r-B7 – put the climate composition chart in Full analysis
- Priority: medium
- Problem: The visible result already has a clear 38% comparison, but the size/range/electricity controls, two segmented bars and a six-item legend make the first screen dense.
- Change: Keep the current result sentence and the Size, Range and Electricity controls in the visible block. Show only the existing two comparison values as text rows: “New petrol car — 100 %” and the dynamically named electric car with its current percentage. Move the segmented bars and their legend to Full analysis, before its sources. BRIEF rule: one sentence and one number first; details behind Full analysis; one block per topic.
- Applies to: this screen and r-B7-full

### 6. answers – shorten the editable overview
- Priority: medium
- Problem: Seven separate rounded answer cards make “Your answers” long before the topic status list appears.
- Change: Render HOME, WORK, TRIPS, CHARGING AT HOME, YOUR CAR, SECOND CAR and BUDGET as compact two-line rows with thin dividers: label above the unchanged current value, pencil at right. Remove each answer's rounded card border/background. Keep “Your topics” and its Done / Not checked yet states directly below. BRIEF rule: pencil only; less text; use spacing and thin rules.
- Applies to: this screen

### 7. r-B2 – remove unexplained price bars
- Priority: medium
- Problem: The blue horizontal bars beside charging options have no scale or label and can read as availability or progress, while the CHF per 100 km price is already shown.
- Change: Remove the three bars from “Your charging options”. Keep each option's current status, price or “No price data”, “per 100 km” qualifier, and tap through to Full analysis. BRIEF rule: charging status in one clear line; less visual clutter; details on demand.
- Applies to: this screen

## Questions for Simone

None for this round. The data and calculation questions in STATE.md remain outside the UI loop.
