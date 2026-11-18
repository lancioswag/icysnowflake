# Review 001 – 18 November 2026 – ChatGPT

Status: continue
Based on: V8.1 (STATE.md, commits 298240b and 50d1feb), screen map 18 November 2026; live app inspected at 390 px

## Items

### 1. q2, q3, r-B2, r-B4, r-B7, answers – Floating assistant covers controls
- Priority: high
- Problem: At 390 px the blue assistant bubble covers the work-address field, the trip-page Next button, result controls and an answer row. It can block the user's next action.
- Change: Remove the floating assistant bubble from these pages and the other question, topic-result and answer pages. Keep the existing Start link, "Or tell us about you in your own words", as the single entry to the assistant. Do not add another chat button or a new top-bar action.
- Applies to: everywhere except Start
- BRIEF rule: Mobile first; no duplicated navigation; one reusable topic template.

### 2. r-B3 – Make the cost comparison the one visible block
- Priority: high
- Problem: After the headline, "Value later" appears before the actual cost breakdown. The years selector and cost options are hidden inside Full analysis, although Christian's central question is what the switch costs now and over time.
- Change: Replace the visible "Value later" block with one "Cost at a glance" block. In this order, show the existing B3 values labelled "To pay today", "Average total cost per year", and "Difference versus keeping your car over 6 years" (use the selected ownership period dynamically). For the map fixture the values are CHF 35.600 – 51.000, CHF 14.300 – 16.900, and CHF 42.100 more. Keep the ownership-year selector at the top of this visible block so its figures change immediately. Move "Value later", the option cards, chart and cost table inside the existing Full analysis. Do not relabel total-per-year as running cost and do not calculate new figures in the UI.
- Applies to: r-B3 only
- BRIEF rule: Early summary, deep dive on demand; one key card, one block, then Full analysis; no invented numbers.

### 3. summary – Qualify the takeaway when costs are unfavourable
- Priority: high
- Problem: The fixture's Takeaway says "An electric car fits how you drive. One point is still open." while the same Summary says it costs CHF 42.100 more over six years and home charging needs approval. The headline reads like an overall positive verdict.
- Change: For this fixture, replace the Takeaway with one sentence: "An electric car covers your trips, but costs about CHF 42.100 more over 6 years in this comparison." Build this only from existing B1/B3 result fields; use the selected years and amount, and omit the cost clause when no valid B3 comparison exists. Keep the agreed counters and the topic rows. Do not change the AI prompt or n8n calculation.
- Applies to: summary and summary-numbers
- BRIEF rule: One-sentence Takeaway; neutral personal answer; UI never invents numbers.

### 4. r-B4 – Use the same result template as the other topics
- Priority: high
- Problem: "Your options" opens a wide comparison board immediately and has no Full analysis section. On a phone the label column and the selected car column compete for width, pushing the key choice below the fold.
- Change: Make the single visible block "Your car option": show the selected class, "230 of 230 driving days" (dynamic), seats, and the existing new-price range in simple rows. Move the horizontal comparison, trip requirements, alternative transport and explanatory text into a new Full analysis disclosure; put sources and assumptions at its end. Keep the same Edit your inputs, What can you do next, save/share and Continue order as other topics.
- Applies to: r-B4 only
- BRIEF rule: One reused topic template; one block before Full analysis; no box inside a box.

### 5. r-B7 – Do not show missing ranges as choices
- Priority: medium
- Problem: The range selector shows several "– km" buttons for classes without range data in the saved answer. These look selectable even though they convey no value.
- Change: Omit range choices whose displayed value is "– km". If only one valid range remains, replace the selector with plain text such as "Range: 500 km" using that existing value. If none remain, show "Range data unavailable" as text. Never render "– km" as a button.
- Applies to: r-B7 only
- BRIEF rule: Less text; no invented numbers; mobile first.

### 6. r-B2 – Label the home-charging price as conditional
- Priority: medium
- Problem: The first charging block says home charging is not yet possible without the owners' decision but places "CHF 5.37 per 100 km" beside it as if it were an available option.
- Change: Keep the price but label it "Electricity if installed: CHF 5.37 / 100 km" (dynamic value). Keep the existing "Not yet, needs the owners' decision" status. Do not include installation cost in this electricity label.
- Applies to: r-B2 only
- BRIEF rule: Charging status in one clear line; straightforward personal result; no invented numbers.

### 7. r-B2 – Make missing public price actionable
- Priority: medium
- Problem: Public normal charging shows "–" and "No price data" without the operator action required by the brief.
- Change: Replace that pair with one line, "Price unavailable · Check operator ↗", linked to a verified operator page when the operator URL is available. If there is no verified URL, show only "Price unavailable" with no arrow or dead link. Keep the station name in Full analysis.
- Applies to: r-B2 only
- BRIEF rule: "No price data" with an arrow to the operator; sites grouped and named once.

### 8. q3, q4 – Show a selected trip once
- Priority: medium
- Problem: "Commute to work" appears as a pressed preset and again as an editable Commute card. The duplicate occupies scarce phone space.
- Change: Once a preset is selected, remove it from the available-trip chips and show it only in the editable trip list with Edit and Delete. If deleted, return it to the available chips. Keep "+ Add a trip".
- Applies to: q3 and q4
- BRIEF rule: Much less text; mobile first; individual trips can be combined.

### 9. answers – Replace the generic car value
- Priority: medium
- Problem: "YOUR CAR" displays only "car", although the cost result identifies the current car. This makes the answer overview less useful when revisiting inputs.
- Change: Show the existing resolved current-car label. If no resolved label exists, show "Car details unavailable" rather than "car". Do not guess a brand or model.
- Applies to: answers only
- BRIEF rule: Your answers is a compact, editable overview; no invented data.

### 10. q2 – Remove a validation hint after the answer is valid
- Priority: medium
- Problem: "Fill in at least one." remains visible when a validated work postal code is already entered.
- Change: Show "Fill in at least one." only while the required location-or-distance group has no valid answer; hide it as soon as the postal code or another accepted input makes the question valid. Keep field-specific error messages.
- Applies to: q2 only
- BRIEF rule: Less text; one question asked once; mobile first.

## Questions for Simone

- Christian's requested split between one-time outlay and running costs cannot be completed from the current B3 labels alone: "total per year" appears to include ownership costs. Should the n8n owner expose a separate annual operating-cost figure and the rental assumptions in the result contract? This review does not change calculations.
- STATE.md already records the B6 resale value reaching 0% after seven years and the missing verified operator URLs. Those remain with the data/n8n owners.
