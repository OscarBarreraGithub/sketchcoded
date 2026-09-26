# Product progress and handoff

Last updated: 2026-09-07 (America/New_York)

## Current state

- The workspace was empty and was not a Git repository when inspected.
- No applicable AGENTS.md was found in the workspace or its ancestor directories.
- The original request is saved in [ORIGINAL_BRIEF.md](ORIGINAL_BRIEF.md).
- The user authorized autonomous completion and delegated development decisions. An active goal tracks completion of the full brief.
- The application is implemented and running at http://127.0.0.1:5173. The complete acceptance and verification pass has finished.
- Major implementation choices are recorded in [DECISIONS.md](DECISIONS.md).

## Objective

Build and verify every in-scope item in the original brief: a useful local screenshot flow designer with a tactile bulletin board, annotated interaction pins, branching yarn connections, reviewable graph diagnostics, and a sketch-based interactive preview. Leave the agentic generation/review workflow for later.

## Implemented defaults

- A desktop-oriented localhost web application with a small local server and React/TypeScript frontend. Single-user and local persistence for the first version.
- Connect a local screenshot folder to the library; also support importing individual image files. Keep saved boards usable if source files move. Source-image updates must not silently invalidate pin placement.
- Persist projects and image assets on disk. Support a versioned, readable JSON graph export with referenced images for future LLM use.
- Keep the tactile cork, paper, pins, and yarn visual treatment functional: images remain legible, connections remain selectable, and zoom/pan remains easy.
- Use a small bundled chat example so authoring, conditional routing, diagnostics, and preview can be tested without waiting for user images.
- No hosted deployment, accounts, collaboration, or LLM provider integration in this first version.

## Acceptance checklist

### Repository and continuity

- [x] Save the original prompt as Markdown.
- [x] Create a durable progress and handoff document.
- [x] Initialize the repository and runnable app.
- [x] Document setup, persistence, data format, and known limitations.
- [x] At each milestone, review work against the original brief and update this file with evidence and the next action.

### Library and board

- [x] Connect a local screenshot folder and display image thumbnails in a panel.
- [x] Import images by file selection/drop; handle unsupported or missing files visibly.
- [x] Drag library images onto a spacious, pannable workspace and reposition them.
- [x] Animate placement with decorative tacks; respect reduced motion.
- [x] Require a screen title and show it on a paper label; allow renaming.
- [x] Offer clear zoom in/out, reset, and fit controls.
- [x] Save and reload screens, board layout, annotations, edges, and images.

### Pins and yarn

- [x] Open a screen to place, edit, move, and delete pins on the image.
- [x] Give each pin a high-level description of the intended interaction.
- [x] Return to the board and connect a pin to a destination screen using yarn.
- [x] Allow one pin to have multiple outgoing connections.
- [x] Select a yarn to edit its short branch summary and detailed behavior/conditions.
- [x] Support deleting or reconnecting connections without orphaning graph references.
- [x] Preserve pins consistently across display zoom using normalized image coordinates.

### Graph and checks

- [x] Define a versioned graph with stable identifiers for screens, pins, and transitions; separate layout from behavior.
- [x] Preserve free-text intent and logic, structured branch summaries, entry screens, and navigation semantics without claiming to execute natural-language conditions.
- [x] Provide graph and asset export suitable for later LLM consumption.
- [x] Detect broken references, missing required descriptions, unconnected pins, unreachable screens, possible dead ends, and return-path concerns.
- [x] Distinguish definite structural errors from potential navigation concerns and semantic questions requiring review.
- [x] Handle login/onboarding, terminal screens, alternate entry points, dialogs, history, and conditional branches without requiring a reverse edge for every transition.
- [x] Offer issue-by-issue acceptance of intentional exceptions with a saved reason; never silently dismiss a concern based only on a screen name.
- [x] Invalidate accepted exceptions when the relevant evidence changes; keep decisions scoped to individual findings.
- [x] Include meaningful tests for graph integrity, reachability, conditional caveats, navigation/history, and exception lifecycle.

### Interactive sketch preview

- [x] Enter preview from a chosen entry screen and show the sketch with clickable pins.
- [x] Follow a single connection directly.
- [x] For multiple outgoing connections, show a chooser with branch summaries and conditions, then follow the selected branch.
- [x] Show helpful behavior for pins with no destination.
- [x] Support restart/exit and intentional navigation/history semantics.
- [x] Clearly distinguish preview-player controls from navigation authored in the app so preview does not hide missing escape routes.
- [x] Verify a complete chat example with normal and blocked-user branches, including return paths and intentional one-way login.

## Graph-review design notes

A directed multigraph is the baseline: screens are nodes; pins are screen-local interaction anchors; transitions connect pins to destination screens. Multiple transitions may share a pin and destination. A screen can represent a reusable view such as a conversation; transitions may describe selected data/context without creating a separate node for each user.

Do not enforce strong connectivity or require a reciprocal edge for every transition. There can be an indirect return path, an authored history-back action, dismissal to a caller, an intentional terminal state, or a context-changing transition such as authentication. A history reset after login may be correct. Multiple entry screens can also be legitimate.

Structural reachability is not proof of runtime reachability when guards are written in natural language. Treat conditional edges as possible paths and surface uncertainty. Similarly, a graph cycle does not guarantee that a return route is available in every state. Flag missing branch summaries/fallback decisions for review without claiming free-text branches are exhaustive or mutually exclusive.

Separate stored review decisions from graph content. Each accepted concern needs its rule, subjects, relevant evidence signature, reason, and attribution. Show accepted issues and reopen them if the relevant graph context changes. Acknowledgment records an intentional decision; it does not invent missing logic.

The preview should let the user choose among natural-language branches and show the chosen branch. It should not silently evaluate conditions. Preview rewind is a testing aid; it is not evidence that the designed app has working back navigation.

## Verification approach

- Test graph algorithms and exception invalidation using focused fixtures, including intentional one-way login, unreachable nodes, blocked branches, legitimate terminal screens, and indirect return paths.
- Verify folder import, durable saves, image placement, pin editing, yarn editing, branching, diagnostics, and preview through the running UI.
- Inspect the rendered board and image editor at normal and small viewport sizes; check zoom/pan, keyboard dismissal, focus, and reduced motion.
- Run the project’s type/build checks and relevant tests. Record actual results here; do not mark an item complete based only on a plan or implementation claim.

## Next action

The original in-scope vision is complete; the 2026-09-25 passes added the planning stage, planned frames, web + mobile layouts, the workstation as drawn, link pins and the companion landing site (see the dated sections below). Next, for the user: check the three drawn frames, draw the nine frames still waiting (Boards, App outline, Planning, Connection editor, Review flow, Test flow, How it works, Example demo, Guide) and drop each onto its planned card; decide the web/mobile toggle question flagged in gold on the Screen editor frame; publish the two repositories to GitHub and confirm the address in the site's `links.js`. The agentic workflow remains deferred, using docs/GRAPH.md as the data contract.

## Final verification evidence

- **Build:** `npm run build` passed TypeScript checking and the production Vite build.
- **Logic, storage, and API:** `npm test` passed **40 tests** across graph diagnostics, acceptance invalidation, authored history, dialog dismissal, deletion integrity, image snapshots, atomic saves/backups, conflicting revisions, bundle round trips, and localhost API boundaries.
- **Browser:** `npm run test:ui` passed **9 workflows** against an isolated production server:
  1. Login, allowed and blocked chat branches, authored Back, restart, absent-history feedback, and independent test rewind.
  2. Real local-folder connection, drag placement, titles, pin/yarn authoring, source-image refresh with immutable existing screens, save/reload, screen deletion and undo.
  3. Intentional login acknowledgment, persistent reason, logic edit, and automatic reopening of changed evidence.
  4. Project export and import through the interface.
  5. Board dragging, zoom, fit, keyboard undo, and dialog dismissal/focus.
  6. A 700px viewport with reduced motion, authoring access, and branching preview.
  7. Pin movement and description, yarn reconnection, pin deletion, and restoration of all branches with undo.
  8. Individual file imports, visible corrupt-image notes, and honest preview feedback for an unconnected pin.
  9. Two-tab save conflicts, protection of the server version, and exporting the unsaved version for recovery.
- **Formatting:** `npm run format:check` passed. The original brief is excluded from automatic formatting.
- **Visual review:** Inspected the finished board, screen/pin editor, connection editor, issue review, branching preview, and compact editor. Final screenshots are in `docs/screenshots/`. The visual walkthrough reported **zero browser runtime errors**.
- **Original brief review:** Completed after setup, after the main implementation, and at final acceptance. Every in-scope checklist item above is satisfied. The separate future agentic workflow remains intentionally deferred.

## Handoff

- Run: `npm install` then `npm run dev`; start http://127.0.0.1:5173 only for active use and stop it afterward with Ctrl+C.
- User guide and recovery: `README.md`.
- Important delegated choices: `docs/DECISIONS.md`.
- Portable format and checker limits: `docs/GRAPH.md`.
- Continued development instructions: `AGENTS.md`.
- User data: `.drawcode/projects/` and `.drawcode/assets/`, ignored by Git.
- Browser verification data: `.drawcode/ui-tests/`, separate from the user's boards.
- The demo intentionally starts with three review concerns so users can try the acceptance flow. These are sample design questions, not application test failures.

## 2026-09-08 — Sketchcoded usability follow-up

The user chose Sketchcoded and asked for browser zoom fixes, a text outline, easier board navigation, larger uniform fields, detail references, clearer flow review and visible screenshot usage. The original brief remains the baseline; this is a usability refinement before the user supplies further sketches.

Implemented the requested interface and model changes. All 13 browser workflows pass, including all 9 original workflows and actual browser zoom at 125%, 150%, 200% and 250%. **49 domain/storage/API tests** pass. Domain coverage now includes reference separation, nested/cyclic details, legacy parsing, deletion repair, and preservation of navigation acceptance. Screenshots in `docs/screenshots/` show the updated visual direction; a 390px walkthrough reported zero runtime errors and no form overflow. Detailed acceptance evidence is in `docs/USABILITY_PASS.md`.

Next: collaborate on the user’s forthcoming sketches of Sketchcoded. The current pass preserves the existing user data, local server workflow and original brief. No deployment or agentic execution was added.

## 2026-09-08 — Stop idle development processes

The user clarified that they are not currently using a browser or local app server. Development servers and test browsers should run only while directly needed for a task, then be closed.

Stopped the leftover Sketchcoded npm/tsx watcher and server on port 5173, including its child processes. Closed the background Google Chrome session. No Playwright/Chromium test processes were left over. The project should remain stopped until the next active development or verification session. The process lifecycle rule is recorded in `AGENTS.md`.

## 2026-09-25 — Planning stage, planned frames, and web + mobile layouts

The user scoped input to desktop files, asked for a planning stage whose ideas become pins, two drawings per screen, and a first real board that plans Sketchcoded itself. Every point is enumerated in `docs/PLANNING_PASS.md`; decisions are in `docs/DECISIONS.md`; the functionality catalogue for the future website is `docs/FUNCTIONALITY.md`.

Implemented: `ideas[]` in the schema with assignment, placement and leads-to; planned frames (`assetId: null`) that take a drawing by drop or selection; `mobileAssetId` and per-pin `mobile` positions with a side-by-side editor, board thumbnail, preview toggle and review finding; the Planning view with pool, folders, greyed placed ideas, a text outline and copy; planning and layout sections in `flow.md`; a seeded **Sketchcoded** board with ten planned frames and the backlog. Verification evidence is recorded in `docs/PLANNING_PASS.md`.

## 2026-09-25 — First drawings on the Sketchcoded board

The user drew the landing page, the workstation and the screen editor overlay and found the planned board unreadable. Planned frames now show an idea count instead of a list, planned threads are merged per frame pair, and the selected view tab is filled. The three drawings were imported and attached to Home, The board and Screen editor; the landing page backlog was rewritten to match the drawing; four destination frames were added (Example demo, Guide, GitHub, Science with agents); 33 pins and 10 yarns were placed as drawn. Details and evidence: `docs/PLANNING_PASS.md` (follow-up section). Next for the user: check the pin positions and text on the three drawn frames, then draw the remaining frames and drop them onto their planned cards.

## 2026-09-25 — Workstation pass

Built the app as drawn: New/Used library, Ideas panel with an agent box (saves ideas; no model), Plan tab, frame resizing, home markers, pin colors with a legend, a Web/Mobile toggle in the editor, a pins list with move and delete, and link pins for URLs. Recorded the no-layout-shift rule and the link route in `AGENTS.md`. Created the landing site as a separate static repository at `../sketchcoded-site`. See `docs/PLANNING_PASS.md` for the checklist and evidence.

## 2026-09-26 — The page never scrolls, the board keeps its content, every view at every zoom

**Standing instruction from the user:** every issue they raise is also a rule. Append it to `docs/BUILD_CHECKLIST.md` the same day, in their words, with the date, under both the rules and the dated log. Never delete; mark superseded. Five issues were raised and logged today.

What changed, in the order the user raised it:

- **The pill did not show up in a real zoomed browser; the cork board scrolled for thousands of pixels.** Same cause: a `max-height: 650px` block from 2026-09-08 let the shell grow with its content, which is what a laptop at 150% zoom is. Measured before the fix at 1440×900 @150%: the page scrolled 2963px, the board was 3320px tall, the column never scrolled. `src/workstation.css` now keeps the shell at `100dvh` at every size and makes the chrome compact instead. Measured after: page scroll 0px at 1440×900 and 1280×720 for 125%, 150% and 200%; the left column scrolls inside itself and shows “More below” wherever the column is shown (the drawer takes over below 780px).
- **The board panned out past the content.** `src/boardView.ts` clamps every view change. Refined the same day on the user's screenshots: the limit is the outermost frame plus padding, not a frame's inner border. The content's bounding box stays inside the padded board when it fits and covers it when it is larger; a nearest-frame safety net handles layouts with an empty corner. Fit board uses the same padding. Applied to drag, wheel pan, zoom, window resize and content changes. 10 unit tests; a browser test drags past the frames in four directions on an emulated 1280×720 laptop at 150%.
- **The dashed planned threads were confusing and messy.** Removed from the board with their labels and legend entry. Colored yarn is the only line; planned connections are read in the Plan view and the text outline. Zoomed under 40%, pin heads and yarn labels also step aside (they would cover the frames) and the legend says “Zoom in for pins and labels”.
- **The screen editor did not work zoomed in.** Dialogs keep their fixed size at every width now, not only above 1000px. The editor and Test flow keep two panes side by side down to 640px; the drawing is sized to its stage in both directions (measured with a `ResizeObserver`), so the whole sketch is visible for placing and clicking pins; the inspector and the preview sidebar scroll inside themselves with their pills. Compact headings under 650px of height; the app header stays one row below 700px with icon-only Export and Test flow; the board controls stay one row on small boards. Screenshots of every view (board, review, plan, outline, editor, connection editor, Test flow, boards menu) at 960×600, 853×480 and 640×360 CSS pixels are in the session scratchpad.
- **“Leave it up to the AI.”** New: a post-it on a frame (`leftToAi`, toggled in the screen details) means the builder generates a standard page from the title, purpose, ideas and yarn. The board shows the sticker; the review stops asking for a drawing; `flow.md` and the planning outline say so; the outline and plan show the badge. The Guide frame on the Sketchcoded board wears it, and the feature is in the board's backlog on the Screen editor frame. Rule recorded in `docs/BUILD_CHECKLIST.md` and `AGENTS.md`; the site guide mentions it.

Verification: `npm run build` passes; `npm test` **74** unit tests pass (5 files); `npm run test:ui` **18** browser workflows pass, including real Chromium tab zoom at 125–250% with the new “page never scrolls” assertion, the emulated laptop at 150% (page, column, pill, pan clamp) and the post-it flow; `npm run format:check` passes. Visual checks with scratch data on an isolated server: the workstation and the screen editor at 1440×900 and 1280×720 for 150% and 200%; every view at three zoomed laptop sizes; the post-it on the board and in the editor.

Open for the user: publish the two repositories (`gh repo create sketchcoded --private --source=. --push`, and the same in `../sketchcoded-site`), then confirm the addresses in the site's `links.js`. The web/mobile toggle question and the “Sketchcoded” versus “Sketch Code” naming on the site are still theirs to decide.

## 2026-09-26 — Hand the task to the agent

**Goal (set by the user):** the whole site plays well with the agent the user is working with. In every view where the user works, one button gives a prompt, copied to the clipboard and shown for manual copying, that tells the agent exactly what the user is looking at and where the task instructions are, so there is no confusion or back-and-forth. The agent talks to the running localhost directly. Views, instructions and skills are named so the prompt is generated modularly. A reviewer checks every place.

**Places (the checklist):**

- [x] Board: view toolbar (Board tab), the whole board.
- [x] Screen editor: toolbar, the frame, the selected pin, the layout shown.
- [x] Connection editor: dialog actions, the yarn (or a new yarn from its pin).
- [x] Plan: header (whole plan) and each frame's folder (that frame's ideas).
- [x] Ideas panel (left column): what is left, as a plan task.
- [x] App outline: header (whole outline) and each screen.
- [x] Review flow: heading (all open findings) and inside each finding.
- [x] Test flow: footer, the current screen and the trail.
- [x] Help dialog explains the button; README, `docs/FUNCTIONALITY.md`, the site guide and `AGENTS.md` describe it; `docs/AGENT_HANDOFF.md` is the full description with the reviewer's checklist.

**How it is built:** `shared/agent.ts` (registries `views`, `skills`, `contextSchema`; `agentPrompt`, `agentBrief`, `briefUrl`), `src/components/TellAgent.tsx` (button and dialog), server routes `/api/projects/:id/brief`, `/flow.md`, `/outline.md`, `/api/checklist.md`, `/api/skills`, `/api/skills/:id.md`; skills in `docs/skills/` (eight files), shipped in exports under `skills/`.

**Verification:** `npm run build` passes; `npm test` **84** unit tests pass (6 files, including `tests/agent.test.ts`: registries against the skill files, subjects, prompts, briefs for every view); `npm run test:ui` **20** browser workflows pass, including `tests/e2e/agent.spec.ts` (every button clicked, including the frame icon, the library icon and an idea card; the clipboard read back; every brief fetched as Markdown; skills and documents served; a wrong skill name rejected; a Test flow trail of one step; and the live refresh after an agent's write); `npm run format:check` passes. The live app on port 5173 serves `/api/skills` and `/api/checklist.md`; the Sketchcoded board's backlog lists the feature. A reviewer agent checked placements, names, briefs on real data (637 contexts over 12 boards), docs and tests. Its findings, and what was done the same day:

- A frame's brief dropped every pin- and yarn-level finding (65 across the boards). Fixed: findings about the frame now include its pins and their yarn, and a selected pin gets its own findings section; a unit test guards it.
- The write-back story was told from the wrong side: the browser autosaves with a cached revision, so an agent's write made the user's next edit fail. Fixed three ways: the open board checks for changes every few seconds and on focus and takes the newer copy when nothing is unsaved (toast “Updated from your agent”); a local change that only moved the viewport (the most common one, and the one the board makes by itself on opening) merges with the agent's copy instead of conflicting, and automatic clamps no longer write at all; the conflict banner gained “Take the newer copy”. The skill and every task line say to write once at the end and warn the user to pause editing. A browser test renames the board through the API and watches the heading change.
- `idea` was a declared subject nobody produced. Fixed: the editor passes the idea being placed; each idea card in Plan has its own button; the brief has an idea section and a task.
- The id rule in the skill was wrong (any string); now letters, digits, `-` and `_`. The finding classes in resolve-findings were wrong; rewritten from the rules in `shared/graph.ts`.
- No button in the sketch library, the Detail view, or on the frames themselves. Fixed: a `library` view with its own brief (sketches used and unused, frames waiting); the Detail view names its sketch; every frame's footer on the cork has an icon.
- The prompt ended in a literal `<name>` placeholder; now it links the skills index. The pin task ignored the pin's state; now a described pin without yarn, a link pin, a detail pin and a pin being placed from an idea each get their own task. Headings in the brief were misnested; the frame's section now sits under one heading with ideas and findings beneath it, and a single finding's brief carries the frame (and yarn) it is about.
- A malformed brief query said “Invalid project data”; it now names the valid views and fields. The site FAQ still said the export is what you hand to the agent; corrected.
- Test gaps the reviewer listed are covered except two, left open on purpose: the clipboard-denied path and Escape inside a nested dialog.
