# Review 003 – 18 November 2026 – ChatGPT

Status: continue
Based on: V8.3 (STATE.md, da788de), live app and screen map at 390 px, and Simone's direct feedback on 18 November 2026

Simone's decisions for this round: keep five selectable topics and the name “BEV Navigator”; separate topic choices from action buttons; the top-right list icon still opens Your answers; its badge counts selected topics; add Start fresh both on Start and in Your answers; restore a circular Assistant launcher on every screen. These owner directions supersede conflicting BRIEF wording or earlier reviews.

## Items

### 1. home-results, home-picked, answers – make Start fresh reachable and safe
- Priority: high
- Problem: A returning visitor can see answers and results saved by another person in the same browser, but the existing reset confirmation has no visible entry point. This caused the St. Gallen test profile to appear already calculated for a team tester.
- Change: On Start, when answers or results exist, add a quiet text action “Start fresh” below the three main actions. Add the same action after “Your topics” in Your answers. Both open the existing “Delete your answers?” confirmation; never clear data on the first tap. Say exactly what is cleared from this browser. If signed in, do not silently overwrite the account copy: sign out before clearing local data, and say in the confirmation that saved account answers remain. BRIEF rule: mobile first and clear navigation; Simone explicitly requests these two reset entries.
- Applies to: Start, Your answers, reset confirmation

### 2. r-B1, r-B1-full, r-B2-full, answers – let people change an existing trip
- Priority: high
- Problem: “Add or change a trip” opens the Add trip form, not the list of existing trips. Charging → Abroad shows general guidance with no route to edit the person's trips. The trip editor works during the first questionnaire, but the post-result entry points mislead users.
- Change: Rename the Range action “Edit your trips”; make it open the existing trip list with each row's Edit and Delete actions visible, followed by “+ Add a trip”. In Charging → Abroad add a single “Edit your trips” row that opens that same editor. Keep the Trips row in Your answers opening the same editor. Verify that editing distance and frequency of an existing “Holiday abroad by car” trip saves the values and recalculates affected results through the existing flow. BRIEF rule: one editable answer overview, no duplicated question, Back returns to the prior page.
- Applies to: these screens and the existing trip editor

### 3. home-empty, home-picked, home-results – separate the five topics from the actions
- Priority: high
- Problem: Selected topic keys and the Continue/Recalculate button use the same saturated blue and similar depth; at 390 px they read as one undifferentiated stack. The third action looks like a text link while the other two are buttons.
- Change: Keep all five selectable topic keys and the drag handles. End the topic group with 24 px of space and one thin rule. Below it, place a separate action group: primary “Continue” (or the existing “Recalculate” state), secondary “Your results” only when results exist, and tertiary full-width “Tell us in your own words”. Give the action group its own button treatment, distinct from pressed topic keys, with equal width and a consistent 48 px minimum height. BRIEF rule: Start labels and conditional Your results remain; Simone explicitly requests two visual styles and three actions.
- Applies to: all Start states

### 4. home-picked, home-results, q1–q13, summary, all results – keep the Assistant launcher available
- Priority: high
- Problem: V8.2 removed the floating Assistant launcher. The Assistant can now be found only from Start, so it is unavailable when a question or a result needs explanation.
- Change: Restore one circular 52–56 px chat launcher on every screen while the Assistant is closed, including Start, questions, results, Summary and Your answers. Use the chat-bubble icon, an accessible name “Open assistant”, and the same soft 220 ms motion. Keep it clear of sticky Next/Recalculate buttons, input fields and the mobile safe area at 390 and 360 px; reserve page space where needed. Hide the launcher only while the Assistant is open, where the existing Close control works. BRIEF rule: mobile first, one motion style; Simone's current direction overrides the earlier bubble removal.
- Applies to: every app screen except the open Assistant

### 5. home-empty, home-picked, home-results, answers – make the top-right badge count topics
- Priority: high
- Problem: The blue badge on the top-right list icon shows the number of answer rows (for example 7), but looks like a topic count.
- Change: Keep the icon's tap destination as Your answers. Show the number of currently selected topic keys, updating immediately as keys are added or removed on Start; hide the badge when none are selected. Keep the accessible label explicit, for example “Your answers, 3 topics selected”. The Start fresh action from item 1 is visible inside Your answers. BRIEF rule: selected topics are the user's navigation context; Simone directly sets the meaning of this badge.
- Applies to: the top bar and Start selection state

### 6. home-picked, home-results, q1–q13, all results – calm the selected keys and align actions
- Priority: medium
- Problem: The lit-up selected keys are too bright, and action icons/text shift sides across screens. Continue has an arrow on the right, Your results has an icon on the left, and some action labels are centred.
- Change: Give selected topic keys a subtle pale-blue vertical gradient, a blue border, dark-blue text, an inset shadow and the existing 1 px sunk press; keep unselected keys white with a soft outer shadow. Keep the primary action filled in #2564df, with a soft shadow rather than a glow. In every full-width topic key, action button and next-step row, put the thematic icon in a fixed left column and left-align its label to one shared text inset. Right-side chevrons for navigation and the drag handle remain on the right; number chips and segmented controls remain centred. BRIEF rule: pressed selection, drag handle, current blue and Inter; Simone requests a quieter finish and consistent alignment.
- Applies to: full-width controls throughout the app

### 7. assistant – remove explanatory chrome and use an unmistakable Send icon
- Priority: medium
- Problem: “About: Start page”, the long first message and the footer repeat context without helping the person ask a question. The current paper-plane path looks like a location icon.
- Change: Remove the visible “About: …” line and the footer “Answers use the figures and sources of this page.” Replace the initial message word for word with “Ask me about this page or your results.” Keep the suggested questions. Replace the Send icon with a horizontal right-pointing paper plane with a line through its centre (or a chat bubble with an arrow), while retaining the accessible label “Send”. Continue passing page context to the Assistant behind the scenes. BRIEF rule: much less text; Simone explicitly removes these visible explanations.
- Applies to: this screen

### 8. summary, summary-numbers – remove the three verdict counters
- Priority: medium
- Problem: “1 work for you · 0 with a limitation · 0 still open” was not understood in a one-topic result and repeats the topic rows.
- Change: Remove the entire three-counter row under the Takeaway in both Summary styles. Keep the Summary page, Takeaway sentence, “Topics n/6”, Simple / With the numbers switch, topic rows, next steps and save/share. BRIEF rule: early summary with less text; Simone's explicit decision supersedes the former Summary counter rule.
- Applies to: these two screens

### 9. r-B4 – remove the false-link underline from result figures
- Priority: medium
- Problem: The blue underline beneath a range such as “350 km” looks clickable, but is only decoration from the shared numeric highlight style.
- Change: Remove the underline from numeric highlights in result key statements, including “350 km” on Which electric car fits you?, while keeping their weight and colour. Keep actual links underlined and clickable. BRIEF rule: clear one-sentence result; Simone directly requests removing this line.
- Applies to: result key statements, especially this screen

### 10. map – show the five barrier paths before the detailed canvas
- Priority: medium
- Problem: The map puts Start on the far left, shared questions in the middle and result screens far to the right. A reviewer cannot quickly see how the five Start choices relate to the five barriers. Its header still says V8.1 and its Assistant note describes an old bubble state.
- Change: Above the zoomable canvas add a compact clickable overview: “Start” → one row of the five selectable topics in Start order → “Shared questions” → “Calculation” → “Summary” → “Topic results”. Each topic name focuses its corresponding result thumbnail in the detailed map; explain that questions and calculation come before the result, so the overview does not imply a direct jump in the app. Show Battery as a child of Range/Costs, not a sixth selectable key. Update the map's version label to the deployed version and remove stale notes. BRIEF rule: five Start keys, each question once, Summary before results; Simone asks for visible links and barriers in one row.
- Applies to: the screen map

### 11. home-empty, home-picked, home-results – give BEV Navigator a site icon
- Priority: medium
- Problem: The browser tab and Start have no recognisable product icon; the page title is plain text.
- Change: Keep the owner-approved name “BEV Navigator”. Add a small original SVG mark: a blue rounded square with a single white route line ending at a charging point. Use the same mark as favicon and beside a compact “BEV Navigator” wordmark in the Start top bar, without replacing the page title on inner screens. Verify it is legible at 16 px and at phone size. BRIEF rule: keep current blue and Inter; Simone requests a clear site name and icon.
- Applies to: Start branding and browser tab

## Questions for Simone

None blocking this round. The name stays “BEV Navigator”; five topic keys and the top-right icon's Your answers destination are confirmed.
