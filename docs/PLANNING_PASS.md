# Planning pass — 2026-09-25

Historical acceptance record for planning and dual-layout support. Subsequent refinements are described below and in `DECISIONS.md`; current status is in `PROGRESS.md`.

## Scope decisions

- [x] **Desktop only for now.** No phone app and no phone-photo intake. Users bring image files that already live on their computer: connect a folder, choose files, or drag and drop. The README’s limits describe desktop sources only.
- [x] **Priority order for every screen the user designs:** first the logic and pin placement, second the window-resizing behavior, third the mobile appearance. Sketchcoded’s own UI keeps that order too.

## Web and mobile layouts for one screen

- [x] A screen can hold **two drawings**: a web (desktop browser) drawing and a mobile browser drawing. Both represent the same logical screen and share its title, purpose, type, pins and yarn.
- [x] Pins live once per screen and can be positioned on **both** drawings, so a connection authored once applies to both layouts. A pin that is not yet placed on the mobile drawing is visibly “not yet on mobile”.
- [x] Clicking a screen shows the **web and mobile drawings side by side** with their pins, and lets the user drag pins on either drawing.
- [x] The board card makes it obvious when a screen has a mobile layout.
- [x] Test flow can switch between web and mobile layouts and still follow every pin.
- [x] Review flow points out pins that are missing from a screen’s mobile layout, and the user can accept that with a reason.
- [x] Exports describe both layouts and both pin positions.

## Planning stage: a functionality backlog that drives the drawings

- [x] A **Planning view** stores every functionality idea for the product being designed. Ideas are easy to add at any time, easy to skim, searchable, and saved with the project so nothing is forgotten between sessions.
- [x] Each idea can be **assigned to a screen**, moved between screens, or left in the unassigned pool.
- [x] An assigned idea can be **placed on the drawing** in one click: it becomes a pin with the idea’s name and description, so the user draws and connects while the agent has already written down what each pin is.
- [x] An idea can record the screen it **leads to**. Placing it creates the draft yarn automatically, and the board shows planned threads between frames before the drawings exist.
- [x] Ideas already placed are **greyed out but legible**, and marked with the pin they became, so an idea is never pinned on two pages by accident.
- [x] Screens can be **planned before they are drawn**: a frame with a title, purpose and assigned ideas but no image yet. It appears on the board as an empty frame waiting for a drawing; dropping a sketch onto it, or choosing one in its editor, fills it in and keeps its pins-to-be.
- [x] The plan is readable **two ways**: as frames, pins and yarn on the board, and as a **chat-friendly text outline** (copyable, and included in exports) so the user and agent can discuss it in conversation and the agent can reorganize it on request.
- [x] The agent’s working routine for this project: keep the backlog current from the user’s ideas, propose screen assignments and move ideas when requested. The yarn and pins update with the plan.
- [x] The Planning feature is discoverable: it is explained in the help dialog and the README so future users know they have it.

## Dogfooding: the first real board is Sketchcoded itself

- [x] Create a board named **Sketchcoded** whose frames are the screens of the actual product and site. The user draws them; the agent pre-fills each frame’s ideas from the brief and documented product requirements.
- [x] The agent tells the user **what belongs on the home page** so drawing can start immediately.
- [x] All product functionality discussed so far is written down in **one durable place** that later feeds the public website (feature explanations and a small demo). It is kept both as the Sketchcoded board’s planning backlog and as a document in the repository.

## Later refinements

The Web / Mobile toggle replaced the initial side-by-side editor. Pins can now be provisional before a drawing exists. Planned connections appear in Plan and the outline; the board draws real yarn only. External sites use link pins, not separate terminal frames. These refinements supersede the corresponding initial implementation details below.

## Verification plan

- `npm test` for model helpers, graph rules, planning outline and export/import of ideas and layouts.
- `npm run build` for types.
- `npm run test:ui` including a new browser workflow for planning and layouts.
- Manual check of the Sketchcoded board in the running app.

## Evidence

Recorded 2026-09-25 after the pass.

- `npm run build`: TypeScript and the production build pass.
- `npm test`: **62** checks pass (49 existing plus 13 in `tests/planning.test.ts`): legacy files parse with an empty backlog; idea status, placement, linking, moving and unlinking on deletion; the planning outline’s markers and threads; web/mobile drawing rules; planned-frame review rules; export text; a storage, export and import round trip that preserves ideas, planned frames and mobile positions.
- `npm run test:ui`: **16** browser workflows pass, the 13 existing ones plus three in `tests/e2e/planning.spec.ts`: planning a frame, adding ideas, placing one as a pin with its yarn and seeing it greyed out and persisted; adding a mobile drawing, placing a pin on it, the review finding, the preview toggle and the export text; dropping a sketch onto a planned frame.
- `npm run format:check` passes.
- Visual check on an isolated server with scratch data (screenshots in the session scratchpad): the Planning view with cards and as text, the editor with web and mobile drawings side by side, a planned frame with its ideas and a dashed planned thread on the board, the preview in mobile layout, and the seeded Sketchcoded board with ten planned frames and 71 ideas. No browser runtime errors.
- The **Sketchcoded** board was created on the user’s server at http://127.0.0.1:5173 with ten planned frames and 71 ideas. The Home frame lists what to draw first. The user’s Little chat board was not modified.
- The functionality catalogue for the website is `docs/FUNCTIONALITY.md`; the README, `docs/GRAPH.md`, `docs/DECISIONS.md`, `docs/PROGRESS.md` and `AGENTS.md` describe the new model, views and the agent’s planning routine.
- Process hygiene: the temporary verification server on port 5175 and its test browsers were stopped. No current server state is implied by this historical record.

## Follow-up, 2026-09-25 — first drawings and readability

The user drew three pages (landing page, the workstation, the screen editor overlay), reported that the board was unreadable (walls of text on planned frames, overlapping planned threads), and asked to load the drawings as the starting point and to walk through the functionality.

- [x] Planned frame cards show a count (“9 ideas planned”) instead of listing every idea. The list stays in the frame’s editor, in Planning and in the outline.
- [x] Planned threads are drawn once per frame pair with a short label (“3 planned”), and the label’s tooltip names the ideas. Board labels are smaller and lighter.
- [x] The selected Board / App outline / Planning tab is filled green so it is obvious which view is showing.
- [x] The PDF pages were rasterized and imported as `sketchcoded-landing.png`, `sketchcoded-board.png` and `sketchcoded-screen-editor.png`, attached as the web drawings of Home, The board and Screen editor.
- [x] Home’s backlog was replaced by the landing page as drawn: title and tagline, Example: this website, Set up prompt with Copy, Runs local line, Read more: Guide, GitHub, See more projects, and a mobile-layout note. Four frames were added for the drawn destinations: Example demo (read-only, empty for now), Guide, GitHub (external, ending), Science with agents (external, ending). The board is a second entry point because the installed app starts there.
- [x] Pins were placed where the drawings put them (33 pins across the three pages) and the drawn yarn was tied (10 connections), colored blue for dialogs, gold for external endings and red for pages. New ideas from the notes were added: Used and New sections, Ideas panel, Agent conversation, Project name, Help button, Home marker, Click to resize, No overlap; Pins list, Highlight the selected pin, Color coding, Title and description; and the web/mobile toggle question.
- [x] The board was re-laid out in three rows with wide spacing: the landing cluster, the studio views, and the dialogs.

Evidence: `npm test` 62 pass, `npm run test:ui` 16 pass, `npm run build` and `npm run format:check` pass. The same update was applied to an isolated copy first and walked through with screenshots (board, Home editor with pins, The board editor, Planning, App outline, Review flow, Test flow into the empty example frame), then to the user’s server.

## Workstation pass, 2026-09-25

The user's second and third drawings describe the app itself, and three notes arrived while building: never let anything grow or shrink because of a click; links are pins, not frames; build the landing page as its own site and repository.

- [x] Library in two sections, New and Used; a sketch moves to Used when it lands on a frame.
- [x] Ideas panel beside the library: what is left to do by screen and an Open the plan link. The agent box drawn in the corner was built, then removed at the user's request the same day: it added clutter without a model behind it.
- [x] Board, Outline, Plan tabs with the selected one filled.
- [x] Resize a frame by dragging its corner; a home marker on entry frames.
- [x] Pin color coding with a per-board meaning for each color and a legend in the editor.
- [x] Screen editor: a Web / Mobile toggle that swaps the drawing, a pins list with move and delete, the selected pin highlighted, title and description, remove.
- [x] Link pins: address in the description, no yarn, counted as a way onward; `link-address` and `link-navigation` findings; shown in Test flow, the outline and the export.
- [x] Layout stability rule in `AGENTS.md`; large dialogs keep a fixed size and scroll inside.
- [x] Sketchcoded board: GitHub and the projects link are link pins; the two external frames are gone; pins are colored (red navigation, olive notes, blue links, gold decisions).
- [x] Landing site in the separate `sketchcoded-site` repository: index, guide with checks, build rules, setup and FAQ, one file of links, bundled fonts, phone layout with the setup block below the example frame.

Evidence, recorded 2026-09-25 after the pass:

- `npm run build`, `npm test` (**66** checks, including link pins and pin colors) and `npm run test:ui` (**16** browser workflows, including the New/Used library, the Web/Mobile toggle and real browser zoom at 125% to 250%) pass. `npm run format:check` passes.
- Measured on an isolated copy: the screen editor dialog stays 1190 × 920 px when switching between pins, and no element overflows the dialog at any tested zoom level.
- The Sketchcoded board on the user's server has 12 frames, 33 pins (2 link pins), 8 yarns and a color legend. The GitHub and projects frames are gone.
- The landing site renders on desktop and phone with the setup block below the example frame on phones; the setup prompt is generated from the single GitHub address in `links.js`.
- Both repositories were published in a later pass; see `PROGRESS.md` for current status.
