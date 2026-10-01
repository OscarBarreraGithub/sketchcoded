# What Sketchcoded can do

The durable list of product functionality, kept for the public website (“what you can do”, with a
small demo) and for anyone picking the product up later. The same list lives inside the app as the
**Sketchcoded** board’s planning backlog, grouped by the screen each idea belongs on, so the board
and this file describe the same product. When an idea is added in one place, add it to the other.

Started 2026-09-25 from the original brief and the product requirements; kept current with the product.

## Home (the landing page, as drawn on 2026-09-25)

- Title and tagline: Sketchcoded. Ideas, connected.
- Example: this website. A frame showing this site as a Sketchcoded board; it leads to The board, because the read-only demo is that board. Make it obvious it should be clicked. The public demo uses the original drawings and connected pages. Undrawn example pages are left to the AI; isolated planning frames stay in the local backlog.
- Set up: tell your AI. A setup prompt generated from the configured repository address, with a Copy prompt button. On mobile this block sits below the example frame.
- Runs on your computer; your sketches never leave it. No account, no API key.
- Read more: Guide, a link pin to sketchcoded.com/guide (the Guide is a page of the website, not a frame on the board). The guide distinguishes structural Review flow from the full checklist the agent verifies when authoring a board or building its site: overlaps, text size, zoom control and the other rules. It covers setup, everyday controls, recovery and agent handoff.
- GitHub: a link pin. The address lives in the pin's notes; no frame, no yarn.
- See more projects: a link pin to sciencewithagents.com.
- The landing page itself lives in the separate `sketchcoded-site` repository.

## Landing page (the app's front door, at `/`)

- The site's design: the name, the tagline, a short lede; runs on your computer, sketches never leave it.
- Your boards: every board with its screen count and last edit, the last opened one marked; click one to open the workstation at `/board/<id>`.
- Start a board: a name and New blank board, or New board with your agent (a prompt that has the agent create the board through the local API and write it at the level you choose).
- Three build levels, a three-position switch in the handoff dialog (also for an empty board): Just the list (ideas in the pool, a to-do list of what to draw and connect; no frames, no strings), Frames and strings (planned frames waiting for drawings with the yarn already tied through provisional pins; the default, so later changes are tweaks), Built out (frames and strings with every frame left to the AI; you take the post-it off the one or two pages you draw yourself). The prompt re-copies when the level changes.
- The brand at the top left of the workstation is the way back to this page.
- Six-panel interactive tutorial on the app landing page: plan, pin, branch, review, walk and agent handoff; practice controls never change a board.

## Boards (dialog)

- Your boards, with screen counts and last edit; the current one is marked.
- New blank board.
- The chat example: a ready-made board with branches, an intentional one-way login and Back actions.
- Import a project from a `.sketchcoded.zip`; it becomes a separate board and never overwrites one.
- Rename a board.
- New board with your agent: a prompt that has the agent create a board for the project it is working in (through the local API), write it at the chosen level (just the list, frames and strings, or built out) and report the board's name; you then open it from the landing page and draw.

## The board (the studio)

- Sketch library: thumbnails with Used counts, search, New/Used sections, and locating placements. Drawn as two sections, USED (click to expand) and NEW, with a scroll bar; dropping an image on the board moves it to USED.
- One place to bring sketches in, at the top of the library: drop them, click to browse files, Add a folder (every image in it, once), or Connect a folder to watch it (new and changed images arrive every 20 seconds; refresh checks now). PNG, JPEG, WebP, GIF, AVIF, TIFF and SVG from this computer.
- Drag a sketch onto the board: a tack, a paper title, a spot on the cork.
- Planned frames: frames from the planning stage wait as empty dashed paper with a count of their ideas (the list is in the editor, Plan and the outline); drop a sketch to fill one. A planned frame keeps a fixed 2:1 box on the cork and, zoomed out under 40%, shows only its tape and code so thirty of them still read as a map.
- Strings before drawings: a planned frame can carry provisional pins (placeholder spots down its right side) with real yarn, written by the agent or added in the editor (Add a pin, or Place on an idea). When a drawing lands on the frame, the editor shows “Place on the drawing” for each waiting pin; click one, click the drawing, and the yarn follows. Review flow warns until every waiting pin is placed.
- Pins and yarn: numbered pins on each sketch; click a pin then a card to tie color-coded yarn; labels show the branch summary. Labels find a spot clear of every frame; a label with no room shows as a mark with its words on hover. A way back (Back or Close) is a small ↶ mark in its frame's footer; hover it for its words, click it to edit it.
- Ideas panel beside the library: organized ideas, expand, scroll, and make clear what is still left to do.
- Project name in the header; a ? button opens How it works.
- A home marker on each entry frame, where the app starts.
- Codes: every frame (P1, P2, …), sketch (S1, …) and idea (I1, …) carries a short code, shown on the frame footer, in the library, the outline, the plan, the editor title and Test flow; a pin is “P3 pin 2”. Prompts, briefs and the export lead with them. Allocation counters keep deleted codes from being reused.
- Tell the agent (view toolbar): copies a three-line prompt naming this board and the task brief served by the running app (which carries the task, the skills to read and the rules); the same button appears in the screen editor (frame, selected pin, idea being placed), the connection editor (the yarn), Plan (whole plan, per frame, per idea), the Ideas panel, App outline (whole and per screen), Review flow (all findings and each finding), Test flow (current screen and trail), the Detail view and the sketch library. The open board refreshes itself when the agent writes and nothing is unsaved. See `docs/AGENT_HANDOFF.md`.
- Leave it up to the AI: a post-it on a frame (toggle in the screen editor) says the page is standard and conventional, built from the title, purpose, ideas and yarn. No drawing needed; the flow review stops asking for one. Sketchcoded builds the page itself and **Test flow walks it as a real site**: a top bar with the ways onward, a heading and lede, a main action, cards from the ideas, fields for a sign-in, a dialog for a modal, a quiet ending for a terminal screen. It scrolls, its buttons follow the frame's own yarn, and nothing else is behind it. `flow.md` carries the same page under “Standard page”, so the builder builds what was walked. A drawing always wins.
- Drag a frame's corner to resize it. Frames keep clear of each other, with room around them.
- Planned connections are read in the Plan view and the text outline. The board draws only real yarn; the second, dashed kind of line was removed on 2026-09-26.
- Threads by category: a yarn's color is its category. A board starts with Main path (red), Branch (gold), Detour (blue) and Way back (olive), and two spare colors you can name. The **Threads** button beside Board / App outline / Plan filters to one category: that yarn stays lit, the frames it never touches shrink a little and dull without moving, and the legend counts the threads and the frames. All threads brings everything back. The same menu names the categories and adds one.
- A click on a frame opens it; a drag moves it.
- Picking a frame out of the tangle: on a board with more than eight threads the yarn draws back and every label waits as a small mark. Point at a frame and its own threads come forward with their words, everything else fades, and the frames it is tied to step a little further away so the yarn between them can be read; the legend counts them. It lets go a moment after the pointer leaves. The step is only on screen, so no frame is moved or lost.
- Pan and zoom: drag blank space, scroll to zoom around the pointer, Shift + scroll to pan, a slider, plus and minus buttons, F to fit. The board never pans out of sight of its content: panning stops at the outermost frame plus padding, so the last frame in view is whole with cork beside it, never clipped at the edge. Zoomed far out, pin heads and yarn labels step aside so the frames stay readable; zoom in to work with them. Make it obvious which of Board, Outline and Plan is selected.
- Undo and redo, including deletions that remove pins and yarn together.
- Save status beside the board name, a leave warning while unsaved, and a save before returning to the landing page. An arriving agent refresh cannot overwrite an edit made during that request.
- Export project: a ZIP with `project.json`, `schema.json`, `flow.md`, `review.json`, the images, `BUILD-CHECKLIST.md`, the agent skills and a READ-ME.
- Mobile thumbnails: a card with a mobile drawing shows a small phone thumbnail in its corner.
- Open a screen, edit a yarn, open Review flow, Test flow, App outline or Plan.

## App outline

- Each screen once: entry screens, app screens, detail sketches; destinations link back so loops stay simple.
- Search screens, pins and paths.
- Edit screen and Show on board from any entry.
- Ideas waiting per screen.

## Planning

- Add an idea any time: title, details, which screen it belongs on, where it leads.
- A pool for unassigned ideas and a folder per screen.
- Place on the drawing: an assigned idea becomes a pin with its text already written, and its planned yarn is tied. On a frame without a drawing it becomes a provisional pin.
- Placed ideas grey out but stay legible, with their pin number, so nothing lands on two pages.
- Move an idea between screens; a placed idea gives up its pin so it can be placed again.
- Plan a frame before drawing it; it appears on the board with a count of its ideas.
- Copy as text or show as text: a markdown outline for discussing the plan in chat; the same outline ships in `flow.md`.

## Screen editor (dialog)

- Web and mobile drawings, chosen from the library; both show the same pins. The Web / Mobile toggle swaps the image.
- A pins list beside the image: easy to move and delete; the selected pin is highlighted on the image.
- Color coding with labels you specify.
- Title and description fields for the pin.
- Add a pin on the web drawing; name it and describe the intention.
- Place a pin on the mobile drawing; pins not yet on mobile wait in a strip.
- Content / local action: copy, headings and behaviors that stay on this screen; preserve their descriptions without inventing yarn.
- Detail reference: a pin that opens a closer look without changing the app screen.
- Screen details: title, purpose, type (regular, login, dialog, ending, detail), entry flag, “Leave it up to the AI” post-it, size on the board.
- Tell the agent: a prompt for this frame and the selected pin, with the brief, skills and rules the agent should read.
- Planned ideas for this screen: place each waiting idea or add a quick one.
- Connect to a screen on the board; add Back or Dismiss actions; remove a pin or the screen.

## Connection editor (dialog)

- Short version: the required label on the yarn and the option in the scenario chooser.
- Navigation: open, replace, start fresh, open as dialog, go back, dismiss.
- When does this happen: a plain-language condition that is never executed.
- Details and data: behavior, exceptions and states; what data or information is needed.
- Fallback flag and yarn color.
- Remove yarn.

## Review flow

- To review and Accepted tabs; findings sorted by severity: repair needed, check this path, use your judgment.
- Show me where: jump to the screen, pin or yarn behind a finding.
- Accept with a reason; exceptions keep their reason and reopen when the evidence changes.
- Structural errors cannot be waived.
- Structural completeness checks: a pin missing from a mobile drawing; a provisional pin not yet placed on its drawing; a planned frame waiting for a drawing unless left to the AI. Delegated pages still receive reachability, dead-end and one-way checks.
- Visual verification belongs to the agent’s completion instructions for board work and built sites; Review flow does not inspect rendered text or browser zoom.

## Test flow (dialog)

- Choose a start: entry screens, or any screen as a labeled test entry. Starting away from an entry arrives along the shortest authored route, so the screen's own Back and Close lead where they really do; Test flow says where it arrived from.
- Click pins to follow paths; several yarns show a scenario chooser with conditions.
- Web or mobile: switch layouts; pins not yet on mobile are listed under the drawing. A pin written before the drawing arrived waits beside the drawing the same way until it is placed.
- Rewind test, separate from app Back, which must be authored as yarn.
- Closer looks open detail references without changing app history.
- Frames left to the AI render as their standard page; link pins report their address; content pins show their description.
- Restart, and hide pins to see the sketch clean.

## How it works (dialog)

- Seven steps and keyboard shortcuts.

## Links out (the route for URLs)

Anything that leaves the app for a web address is a pin with **Link out** as its purpose and the address written in its description, with any conditions in words. No yarn and no destination frame. The checks treat it as a way onward and ask for an address if none is written.

## Public example

The public walkthrough shows the original hand drawings and useful connected pages. Undrawn pages in the official example are left to the AI; the walk shows each as its one-line summary and “I want this page to:” with a list of what goes there, in the author's words, and a line that is a way onward follows its yarn. Frames listed in the site's settings, such as How it works, are left out of the example. Isolated, undeveloped planning frames are omitted from publication and retained in the local backlog. Regeneration applies the same curation automatically; the complete snapshot remains available with `--include-planned`. The example opens on the view the board was left on in the app, at the same zoom and position; visitors can still move frames, pan, zoom and fit, and a reload returns to that view.

## Installation and portability

- Runs locally without an account, API key or maintainer-specific data.
- Cross-platform setup and start commands; configurable port and storage directory.
- Agent briefs use the running app’s address. Required instructions and export resources resolve from the checkout.
- Portable ZIPs include snapshots, graph, checklist and skills, without source-folder paths. Reconnect folders after moving machines when refresh is needed.

## Deliberately not included yet

- Phone capture or upload from a phone. Images are files already on this computer.
- Any LLM execution: no natural-language condition is evaluated and no code is generated from the board. The export is the input for that later workflow.
