# Response 001 – 18 November 2026 – Claude

Answers: `inbox/review-001.md` · Version: V8.2

1. Floating assistant covers controls – **Done.** The bubble is gone on every page; the assistant opens only from Start ("Or tell us about you in your own words").
2. r-B3 cost block – **Done.** One visible block "Cost at a glance": year selector, To pay today, Average total cost per year, Difference versus keeping your car over N years (same option as the headline, n8n values only). "Value later", option cards, chart and table moved into Full analysis; the year chips appear once.
3. summary takeaway – **Done, with a question.** When Costs shows the EV costs more, the Takeaway becomes "An electric car covers your trips, but costs about CHF X more over N years in this comparison." (built from B1/B3 result fields; "covers your trips" only with a Range result and no "no option" in Which car). Otherwise the n8n sentence stays. Also fixed: numbers in the Takeaway were shown with the browser's yellow highlight. See question 1.
4. r-B4 template – **Done.** Visible block "Your car option" (Class, Driving days, Seats, New price, ⚠ when above budget); the board, trip requirements, other transport and notes are in Full analysis, sources at its end.
5. r-B7 "– km" ranges – **Done.** Classes without range data are not shown; one value shows as text ("500 km" under "Range"), none shows "Range data unavailable".
6. r-B2 home price – **Done differently.** Label "per 100 km if installed" under the price in the options list (the full sentence does not fit the right column at 390 px); the tile in "At home" says "Electricity if installed". Status pill unchanged.
7. r-B2 missing public price – **Done differently.** BRIEF fixes the wording "No price data", so it stays. In the options list the "–" is gone (one line). On a tapped site the arrow links to the operator only when there is an operator link (tariff URL or known operator); otherwise plain "No price data", no fallback link.
8. q3, q4 picked trip shown twice – **Done.** A picked preset leaves the chips and shows only in the trip list (Edit / Delete); Delete brings the chip back.
9. answers car value – **Done.** Model list label, else the car name n8n resolved (Costs / Climate), else "Car details unavailable". Same in the PDF report.
10. q2 hint – **Done.** "Fill in at least one." disappears as soon as a postal code, address or distance is valid and comes back if it is cleared.

## Questions for Simone
1. Takeaway: is it OK that the UI swaps the n8n sentence for the cost sentence when the EV costs more, or should this go into the summary prompt in n8n (better long term: one source for the verdict)?
2. From the review: should n8n give a separate yearly running-cost figure (without loss of value) and the rental assumptions, so Costs can show "one-time vs. running" as Christian asked?

Changed screens: q2, q3, q4, r-B2, r-B2-full, r-B2-email-site, r-B3, r-B3-full, r-B4, r-B4-full, r-B7, r-B7-full, summary, summary-numbers, answers, and every page that had the assistant bubble
