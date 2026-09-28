# Sketchcoded product requirements

Edited, dated requirements specific to Sketchcoded. General development preferences live in [BUILD_CHECKLIST.md](BUILD_CHECKLIST.md), implementation status in [PROGRESS.md](PROGRESS.md), and architectural reasoning in [DECISIONS.md](DECISIONS.md). This document is not included in another project's export.

Record requirements and decisions rather than conversation transcripts. Preserve intended behavior when editing prose, and identify requirements superseded by later decisions.

## Product requirements

- **One kind of line on the board.** Colored yarn is navigation. No second, dashed kind of line between frames; planned connections are read in the Plan view and in the text outline, not as lines. (2026-09-26)
- **Everything the user and the agent talk about has a short code.** Frames are P1, P2, …; sketches S1, S2, …; ideas I1, I2, …; a pin is named by its frame and number (“P3 pin 2”). Codes are assigned once and never reused. They appear in every relevant view and lead prompts, briefs and export headings so references remain clear. (2026-09-26)
- **Every view can hand its task to the agent.** Wherever the user works (board and each frame on it, screen editor, connection editor, plan and each idea, ideas panel, outline, review and each finding, test flow, detail view, sketch library, the boards list), one button copies a prompt that names the view, the exact subject and where the instructions are, and shows the text for manual copying. The prompt points the agent at the running app’s local API for the live brief, the drawings and the skills; the agent writes back through the same API and the open board picks the change up by itself when nothing is unsaved. Views, briefs and skills have stable names and generate the prompt from registries. (2026-09-26)
- **The handoff prompt is fixed per view.** It ends with “Anything I add below this line is part of the task”; the user types their own instructions after pasting it. The dialog shows what was copied and the prompt in a small terminal, never a task box, and never tells the user to “add” anything. (2026-09-26)
- **Moving around the board is not an edit.** “All changes saved” stays while the user only pans or zooms; the viewport is saved quietly. Not a general rule. (2026-09-26)
- **No tagline on the board.** Keep the workspace header compact. (2026-09-26)
- **Copy.** Name: Sketchcoded. Brand line: “Ideas, connected.” Landing-page message: “Prompts make apps. Sketching makes your vision.” Approved alternate: “Telling an AI what you want gets you an app. Showing it gets you your vision.” Describe the local workflow accurately: no account, API key or automatic upload. Generate the setup prompt from the configured repository address and provide a copy button. (2026-09-25; updated 2026-09-28)
- **Scope.** Desktop only for input: image files already on the computer, no phone capture (2026-09-25). The landing site is its own repository and its own thing; keep name, tagline, setup prompt and feature list identical between site and app (2026-09-25). No agent chat inside the workstation; the plan is where ideas go, the export and the API are where an agent reads from (2026-09-25). No LLM runs inside Sketchcoded yet; nothing written in words is executed or proved (2026-09-07).
- **Process for this repository.** Read `AGENTS.md`, `docs/ORIGINAL_BRIEF.md`, `docs/PROGRESS.md`, `docs/DECISIONS.md`, this file and the checklist before changing anything. Run `npm run build`, `npm test`, `npm run test:ui` (build first) and `npm run format:check`; record results in `docs/PROGRESS.md`. Keep `docs/FUNCTIONALITY.md` current, along with any authorized local product-planning board. Leave a development server running only when explicitly requested; verification uses a scratch server and a scratch data folder.
- **Where things are written down.** The checklist holds general rules only, without dates. Requests specific to Sketchcoded go here, the work in `docs/PROGRESS.md`, and what is still to do in the board’s backlog. Project records do not talk to each other; preferences do. (2026-09-26)
- **The prompt is three lines.** Subject, the brief’s address, and “Anything I add below this line is part of the task.” Everything else (task, skills, rules) lives in the brief the app serves, so the copied text is compact and only the address changes between views. (2026-09-27)
- **A new board is written at one of three levels**, chosen with a three-position switch in the handoff dialog: Just the list (ideas only, a to-do list of what to draw and connect), Frames and strings (planned frames with the yarn already tied through provisional pins; the default, so later changes are tweaks instead of starting over) and Built out (frames and strings with every frame left to the AI; the user takes the post-it off the one or two pages they draw themselves). The same switch appears for an empty board. (2026-09-27)
- **Strings before drawings.** A planned frame may carry provisional pins with real yarn; when a drawing lands, the editor asks the user to place each waiting pin and the review warns until they do. (2026-09-27)
- **The agent writes for the builder.** Purposes carry no stage numbers, build order or disclaimers; ideas are things on a screen, not checklists or layout contracts. In the skills start-a-board and plan-the-backlog. (2026-09-27)
- **One place to bring sketches in.** The library leads with the drop box (drop, browse files, add a folder, or connect one to watch it), not with a folder card and a second box further down. (2026-09-27)
- **A crowded board rests quietly.** Above eight threads the yarn draws back and every label waits as a small mark; clicking a frame brings its own threads and labels forward, fades the rest, and steps the frames it is tied to a little further apart. The step is only on screen, so nothing is moved or lost. Clicking a frame no longer opens it: the tape, the arrow and a double-click do. (2026-09-27)
- **Left to the AI means built out, not labelled.** Sketchcoded builds each such frame a real page from its title, purpose, ideas and yarn, and Test flow walks the site: scrolling pages, working buttons, forms, dialogs, with only the redirects behind them. (2026-09-27)
- **A color is a category of yarn**, with four presets: Main path (red), Branch (gold), Detour (blue), Way back (olive), and two spare colors a board can name. The Threads button beside Board / App outline / Plan filters to one category: its yarn stays lit and the frames it never touches shrink a little and dull, in place, never moving. The same menu names and adds categories. The agent colors the yarn from the start at both levels that write strings. (2026-09-27)
- **The chrome above the board earns its height.** No board tagline, a smaller title, tighter rows: the board gets about three quarters of the window. (2026-09-27)
- **Frames are P1, P2, … (P for page).** F1, F2 read like the function keys. Old boards are renumbered on the way in, keeping each frame's number. Sketches stay S and ideas I. (2026-09-27)
- **The example board is the real board.** The public demo shows the user's own Sketchcoded board with their hand drawings, never a mock drawn in code. (2026-09-27)
- **Planned cards keep a fixed box.** Zoomed out under 40%, planned frames show only their tape and code, tape titles trim to the tape, and the layout math and the rendering agree, so thirty planned frames fit the window as a readable map. (2026-09-27, from the first agent-built board)

## 2026-09-28 — Review follow-up

- Protect pending edits when returning to the boards list and when an agent refresh arrives during typing.
- Keep the workspace usable at real browser zoom, including short laptop windows.
- Include delegated pages in structural reachability and dead-end checks. Preserve code allocation after deletion and undo.
- Distinguish content or local-action pins from navigation pins. Do not invent routes for static annotations.
- Implement the six-panel interactive tutorial covering planning, provisional pins, branches, review decisions, Test flow and agent handoff.
- Bring the public demo's links, layouts, generated pages and history behavior into agreement with the app. Keep its drawings and graph faithful to the source board.
- Point the public site's projects link to https://sciencewithagents.com.
- Require agents to verify the full checklist when authoring a board, including delegated pages, and again when building the resulting site. Inspect rendered text, overlaps, controls and real browser zoom, and report evidence. Review flow remains a structural checker; no automatic visual checker is promised.
- Keep the shared checklist general. Board-reading semantics belong in agent skills; product history belongs here.

Implementation and evidence: [REVIEW_2026-09-28.md](REVIEW_2026-09-28.md). The source-board reconciliation is summarized in [BOARD_SYNC_2026-09-28.md](BOARD_SYNC_2026-09-28.md).

## 2026-09-28 — Portable setup and public documentation

- Support fresh machines and users without assumptions about a developer's directory layout, personal boards, signed-in account or credentials.
- Provide cross-platform startup commands, configurable ports and data directories, and instructions for moving boards or hosting a fork.
- Keep public documentation professional: replace raw chat prompts with edited requirements, correct spelling and grammar, and remove personal environment details. This supersedes the earlier request to retain the initial prompt verbatim.
- Preserve product intent, authored drawings and user data while cleaning documentation. Use normal commits; this cleanup does not rewrite published Git history.
