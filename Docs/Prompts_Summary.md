# Ensyncro — prompts summary

A running log of prompts/decisions from this chat and from Claude Code, in execution order. Claude Code should append its own entries here after each executed + pushed change (see instructions at the bottom).

## Chat (planning, PRD, deck)

| # | Prompt / decision | Outcome |
|---|---|---|
| 1 | Initial brief: build Ensyncro, a funding marketplace (demo/staging/prod), Angular + PostgreSQL, app included, high security, non-coder workflow | Scoped tool split: Claude Code for build, this chat for planning/docs/deck |
| 2 | "do you think claude or kimi would fit better" | Compared honestly; stuck with Claude for the integrated chat + Claude Code workflow |
| 3 | PRD outline + wireframes | PRD v1 drafted; homepage wireframe + palette options shown |
| 4 | Connect to GitHub for auto commit/push/deploy | No GitHub MCP connector available; Vercel connector is read-only. Recommended Claude Code (real git credentials) + Vercel auto-deploy-on-push instead |
| 5 | Move to Claude Desktop / Claude Code | Handoff plan given: PRD.md into repo, first scaffold prompt provided |
| 6 | Keep documents in doc, excel, ppt | Generated Ensyncro_PRD_v1.docx, Ensyncro_Execution_Plan.xlsx, Ensyncro_Pitch_Deck.pptx (+ kept .md as fast-editing source) |
| 7 | Stats question: demo vs staging vs prod data | Demo = seeded, Staging = real live data, Production = threshold-gated (25+ founders, 10+ investors) before showing real counts |
| 8 | Messaging in v1? | Recommended against full messaging for v1; "Request intro" action instead. Full messaging deferred to phase 2 |
| 9 | Palette decision | Locked: Charcoal green (#2C2C2A / #1F6D3B / #F6F5F1 / #FFFFFF / #E1DFD6 / #7A7870) |
| 10 | Maintain a running Prompts_Summary doc across chat + Claude Code | This file created |

## Claude Code (build, commits, pushes)

*No entries yet — populate once the build starts. Suggested row format:*

| # | Date | Prompt given to Claude Code | Commit / PR | Status |
|---|---|---|---|---|
| | | | | |

---

## Instruction to paste into Claude Code (once, at project start)

> Maintain a file at `docs/Prompts_Summary.md` in this repo. Every time you execute a prompt that results in a commit, append a row to the "Claude Code" table: the date, a one-line summary of what was asked, the commit hash or PR link, and status. Do this as part of the same commit, not a separate one. If the file doesn't exist yet, create it with this structure.
