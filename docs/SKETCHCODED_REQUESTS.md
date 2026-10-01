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
- **Process for this repository.** Read `AGENTS.md`, `docs/ORIGINAL_BRIEF.md`, `docs/PROGRESS.md`, `docs/DECISIONS.md`, this file, `docs/CATALOG.md` and the checklist before changing anything. Run `npm run build`, `npm test`, `npm run test:ui` (build first) and `npm run format:check`; record results in `docs/PROGRESS.md`. Keep `docs/FUNCTIONALITY.md` current, along with any authorized local product-planning board. Leave a development server running only when explicitly requested; verification uses a scratch server and a scratch data folder.
- **Where things are written down.** The checklist holds general rules only, without dates. Requests specific to Sketchcoded go here, the work in `docs/PROGRESS.md`, and what is still to do in the board’s backlog. Project records do not talk to each other; preferences do. (2026-09-26)
- **The prompt is three lines.** Subject, the brief’s address, and “Anything I add below this line is part of the task.” Everything else (task, skills, rules) lives in the brief the app serves, so the copied text is compact and only the address changes between views. (2026-09-27)
- **A new board is written at one of three levels**, chosen with a three-position switch in the handoff dialog: Just the list (ideas only, a to-do list of what to draw and connect), Frames and strings (planned frames with the yarn already tied through provisional pins; the default, so later changes are tweaks instead of starting over) and Built out (frames and strings with every frame left to the AI; the user takes the post-it off the one or two pages they draw themselves). The same switch appears for an empty board. (2026-09-27)
- **Strings before drawings.** A planned frame may carry provisional pins with real yarn; when a drawing lands, the editor asks the user to place each waiting pin and the review warns until they do. (2026-09-27)
- **The agent writes for the builder.** Purposes carry no stage numbers, build order or disclaimers; ideas are things on a screen, not checklists or layout contracts. In the skills start-a-board and plan-the-backlog. (2026-09-27)
- **One place to bring sketches in.** The library leads with the drop box (drop, browse files, add a folder, or connect one to watch it), not with a folder card and a second box further down. (2026-09-27)
- **A crowded board rests quietly.** Above eight threads the yarn draws back and every label waits as a small mark; clicking a frame brings its own threads and labels forward, fades the rest, and steps the frames it is tied to a little further apart. The step is only on screen, so nothing is moved or lost. Clicking a frame no longer opens it: the tape, the arrow and a double-click do. (2026-09-27; the click part is superseded on 2026-10-01: a click opens the frame, and pointing at a frame on a crowded board picks it out.)
- **Left to the AI means built out, not labelled.** Sketchcoded builds each such frame a real page from its title, purpose, ideas and yarn, and Test flow walks the site: scrolling pages, working buttons, forms, dialogs, with only the redirects behind them. (2026-09-27)
- **A color is a category of yarn**, with four presets: Main path (red), Branch (gold), Detour (blue), Way back (olive), and two spare colors a board can name. The Threads button beside Board / App outline / Plan filters to one category: its yarn stays lit and the frames it never touches shrink a little and dull, in place, never moving. The same menu names and adds categories. The agent colors the yarn from the start at both levels that write strings. (2026-09-27)
- **The chrome above the board earns its height.** No board tagline, a smaller title, tighter rows: the board gets about three quarters of the window. (2026-09-27)
- **Frames are P1, P2, … (P for page).** F1, F2 read like the function keys. Old boards are renumbered on the way in, keeping each frame's number. Sketches stay S and ideas I. (2026-09-27)
- **The example board is the real board.** The public demo shows the user's own Sketchcoded board with their hand drawings, never a mock drawn in code. (2026-09-27)
- **Planned cards keep a fixed box.** Zoomed out under 40%, planned frames show only their tape and code, tape titles trim to the tape, and the layout math and the rendering agree, so thirty planned frames fit the window as a readable map. (2026-09-27, from the first agent-built board)

## 2026-09-08 — Rename and usability

- Rename the product to Sketchcoded without disrupting saved projects: keep the `.drawcode/` storage directory and existing client identifiers, and keep importing older bundles.
- Add a text outline of the app beside the board: each screen once, with its pins and destinations, readable without the yarn.
- Make moving around the board simple: scrolling, blank-space panning and a draggable zoom slider instead of tool modes.
- Let a pin open a closer look at a detail sketch, separate from app navigation.
- Explain what Review flow checks and what to do with each finding.
- Show whether each sketch is already used, and where.
- Make it clear what the data field on a connection holds.

The general requests from this pass (browser zoom, click targets, field sizes, no nested scrolling for long notes) are in the checklist.

## 2026-09-25 — Planning, two drawings and the workstation

- A Plan view holds every functionality idea, saved with the project: easy to add, skim and search. An idea can be assigned to a screen, moved between screens or left in the pool, and can name the screen it leads to.
- Placing an assigned idea makes a pin with its text, and its yarn when it leads somewhere. Placed ideas stay listed and greyed with their pin, so nothing is pinned on two pages.
- A screen can be planned before it is drawn; dropping a sketch on the frame fills it. A planned card shows a count of its ideas; the list is in the editor, Plan and the outline.
- The plan reads two ways: on the board, and as a copyable text outline that every export includes.
- The agent keeps the backlog current from what the user describes, proposes screen assignments and moves ideas on request (`AGENTS.md`, Planning routine).
- A screen can hold a web drawing and a mobile drawing that share its title, purpose, pins and yarn; each pin has a position on both. The board card shows a phone thumbnail, Test flow switches layouts, Review flow reports pins missing from the mobile drawing (waivable) and exports describe both. The editor's Web / Mobile toggle supersedes the first side-by-side layout.
- The workstation: a library in New and Used sections; an Ideas panel listing what is left to place; Board, App outline and Plan tabs with the selected one filled; frames resized from their corner; a home marker on entry frames; pin colors with a meaning per board (refined into yarn categories on 2026-09-27); a pins list in the screen editor that moves, deletes and highlights pins.
- A web address is a link pin with the address in its description, never a frame. This supersedes the first model of external sites as ending frames.
- Sketchcoded is planned on its own board: the frames are the product's screens, drawn by the user, with ideas written by the agent. The product's functionality is kept in one place, that board's backlog, mirrored in `docs/FUNCTIONALITY.md`.
- Planning is explained in the help dialog and the README.
- Superseded: planned connections drawn on the board (see “One kind of line on the board”, 2026-09-26) and an agent box in the workstation (removed the same day; see Scope).

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

All of these are implemented; verification is in the milestones of [PROGRESS.md](PROGRESS.md). The Sketchcoded board's records were brought into agreement with the implemented behavior at the same time, without changing its drawings, pin positions or yarn.

## 2026-09-28 — Portable setup and public documentation

- Support fresh machines and users without assumptions about a developer's directory layout, personal boards, signed-in account or credentials.
- Provide cross-platform startup commands, configurable ports and data directories, and instructions for moving boards or hosting a fork.
- Keep public documentation professional: replace raw chat prompts with edited requirements, correct spelling and grammar, and remove personal environment details. This supersedes the earlier request to retain the initial prompt verbatim.
- Preserve product intent, authored drawings and user data while cleaning documentation. Use normal commits; this cleanup does not rewrite published Git history.

## 2026-09-28 — Focus the public example

Keep useful connected pages in the example and mark undrawn pages as left to the AI. Omit isolated, undeveloped frames that add no useful information to the public walkthrough. Preserve the full local planning backlog, original drawings, pin positions and authored yarn. The official example omits P2 Boards and P8 Review flow; its other seven undrawn pages are delegated.

## 2026-09-29 — Point things out on a built UI

When a UI is already built, let the user highlight an element or area and point it out to the agent, so nothing has to be described in words. A plan was made (select or box an area, add a note, hand it over with a screenshot and the page's location through Tell the agent); it is not built. Recorded on 2026-09-30.

## 2026-09-30 — Catalog, selling points, guide and example board

- Catalog every request given to Claude and Codex, and distill about ten selling points from it: [CATALOG.md](CATALOG.md).
- Restructure the guide completely, starting from that catalog.
- Every page on the example board has a way back: Back to the board on App outline and Planning, Close on the dialogs, Home on the Guide and the example demo. These are Back and Close steps, so no new lines cross the board. The board's colors use the category names the guide teaches (Main path, Branch, Detour, Way back), and the stale note on the example pin was removed.
- Make the website and both repositories ready to share: every fix discussed for the site and example, no stale documents or unused files.
- Starting a walk from any frame on the example must not dead-end: a page's Back or Close works wherever the walk began.
- “Example: this website” on Home leads to The board, because the example on the site is the board itself, so the whole board is connected. The separate P11 Example demo frame is removed; this supersedes the 2026-09-28 count of seven delegated pages (now six).
- The example opens exactly as the board stands in the app, at its saved zoom and position; visitors can still move frames, pan and zoom.
- The ways back under each frame made the board busy. Keep them, but as a small ↶ mark in the frame's footer with the words on hover. (2026-10-01)
- Remove the blank P2 Boards and P8 Review flow frames from the board; their ideas go to the unassigned pool. Accept Home → The board as one way: the example opens the board itself, and the site's logo returns home. (2026-10-01)
- Running tests or a build must never reload a board that is open in the development server. (2026-10-01)
- The logo is the owner's hand-drawn alien (from the Science with Agents branding), in cream ink on the brand's green tile, in the app header, the favicon and on the site. Keep the drawing's strokes; never redraw it. (2026-10-01)
- Remove the Guide frame from the board. “Read more: Guide” on Home becomes a link out to the guide page; the frame's ideas go to the pool. (2026-10-01)
- A click on a frame opens it; picking a frame out only highlighted it, which read as broken. On a crowded board, pointing at a frame picks it out instead. Remove the agent button and the open arrow from each frame's footer: both were too small, and the frame itself now opens. (2026-10-01)
- Make the app's text much larger everywhere, so nothing needs browser zoom to read: the worst was the screen editor's hint (“Click a pin to describe it…”). Check every view for anything too small, and make sure nothing breaks when the browser is zoomed all the way in. (2026-10-01)
- The guide is to become our principles for web design: every request of this kind (text size, zoom, overlaps, scrolling, click targets and the rest of the build checklist), written for the public. (2026-10-01)
- Leave How it works out of the example entirely. In the example, a frame left to the AI opens as a page with a one-line summary and then a bullet list of what goes there, written as the author: “I want this page to:”. Nothing else, and centered, not pushed to the left. (2026-10-01)
