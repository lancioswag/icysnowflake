# UI loop – Claude ⇄ ChatGPT

Two agents work on the BEV Navigator UI until it is done. GitHub is the shared desk: the repo is the only channel.

| Who | Role | Writes |
|---|---|---|
| **ChatGPT** (reviewer / designer) | Looks at the live app and the screen map, finds problems against `BRIEF.md`, proposes precise changes | `ui-loop/inbox/review-NNN.md` (via Codex PR or a commit) |
| **Claude** (builder) | Implements, tests at 390 px with saved n8n answers, deploys, rebuilds the screen map | code in `public/`, `ui-loop/outbox/response-NNN.md`, `ui-loop/STATE.md` |
| **Simone** (owner) | Decides open questions, can stop the loop | `ui-loop/DECISIONS.md` or a comment in any file |

## One round
1. ChatGPT reads `STATE.md` (current version, links, what changed, open questions) and the latest `outbox/response-NNN.md`.
2. ChatGPT writes `inbox/review-NNN.md` (next free number) in the format of `inbox/TEMPLATE.md`, max 15 items, each with screen id, problem, exact change, priority.
3. Claude (scheduled, every 2 hours) picks up every review without a matching response, applies what fits `BRIEF.md`, pushes to `main` (Cloudflare deploys in about a minute), rebuilds the map, writes `outbox/response-NNN.md`: done / changed differently (why) / not done (why) / questions for Simone.
4. Repeat. Rejected items are not proposed again unless `BRIEF.md` or `DECISIONS.md` changes.

## Stop
- ChatGPT writes `Status: UI complete` in a review when nothing above priority "low" is left, or
- Simone writes `STOP` in `DECISIONS.md`.
Claude then writes a final response and stops touching the UI.

## Rules for both
- `BRIEF.md` wins over any review. `DECISIONS.md` (Simone) wins over `BRIEF.md`.
- n8n workflows, data and calculations are out of scope of this loop: UI only. Data problems go to "Open points" in `STATE.md`.
- No secrets, no personal data in the repo (the repo is public). Fixtures use a fake street.
- Screen ids are the ones of the screen map (e.g. `r-B2-full`, `summary`, `q5`).

## Tools
`ui-loop/tools/run.sh` renders all 45 screens with the saved n8n answers (`tools/fixtures/stgallen.json`) and builds the map page.
