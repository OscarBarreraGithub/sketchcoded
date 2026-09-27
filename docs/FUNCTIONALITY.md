# What Sketchcoded can do

The durable list of product functionality, kept for the public website (“what you can do”, with a
small demo) and for anyone picking the product up later. The same list lives inside the app as the
**Sketchcoded** board’s planning backlog, grouped by the screen each idea belongs on, so the board
and this file describe the same product. When an idea is added in one place, add it to the other.

Written 2026-09-25 from the original brief, the README and the planning conversation.

## Home (the landing page, as drawn on 2026-09-25)

- Title and tagline: SKETCH CODE. Prompts make apps. Sketching makes your vision. (Alternate: Telling an AI what you want gets you an app. Showing it gets you your vision.)
- Example: this website. A frame showing this site as a Sketchcoded board; sends to a read-only version of the demo. Make it obvious it should be clicked. For now the destination is an empty frame.
- Set up: tell your AI. A prompt to paste into an AI (“I want to set up github.com/…/sketchcode. Make sure to…”) with a Copy prompt button. On mobile this block sits below the example frame.
- Runs local, sketches never leave. Rephrase: runs on your computer; your sketches never leave it. No account, no API key.
- Read more: Guide. The guide covers the autochecks (no overlapping or small text, browser zoom issues), setting up from the .md file structure, and points to GitHub.
- GitHub: a link pin. The address lives in the pin's notes; no frame, no yarn.
- See more projects: science with agents, also a link pin.
- The landing page itself lives in the separate `sketchcoded-site` repository.

## Boards (dialog)

- Your boards, with screen counts and last edit; the current one is marked.
- New blank board.
- The chat example: a ready-made board with branches, an intentional one-way login and Back actions.
- Import a project from a `.sketchcoded.zip`; it becomes a separate board and never overwrites one.
- Rename a board.
- New board with your agent: a prompt that has the agent create a board for the project it is working in (through the local API), write the first plan as planned frames and ideas, and report the board's name; you then open it from this menu and draw.

## The board (the studio)

- Sketch library: thumbnails with Used counts, search, a used/unused filter, and locating placements. Drawn as two sections, USED (click to expand) and NEW, with a scroll bar; dropping an image on the board moves it to USED.
- Connect a folder on this computer; new and changed images appear every 20 seconds; refresh checks now.
- Import files or drop images: PNG, JPEG, WebP, GIF, TIFF and SVG from this computer. Also allow drag to upload.
- Drag a sketch onto the board: a tack, a paper title, a spot on the cork.
- Planned frames: frames from the planning stage wait as empty dashed paper listing their ideas; drop a sketch to fill one.
- Pins and yarn: numbered pins on each sketch; click a pin then a card to tie color-coded yarn; labels show the branch summary.
- Ideas panel beside the library: organized ideas, expand, scroll, and make clear what is still left to do.
- Project name in the header; a ? button opens How it works.
- A little home marker on the frame where the landing page starts.
- Codes: every frame (F1, F2, …), sketch (S1, …) and idea (I1, …) carries a short code, shown on the frame footer, in the library, the outline, the plan, the editor title and Test flow; a pin is “F3 pin 2”. Prompts, briefs and the export lead with them.
- Tell the agent (view toolbar): copies a prompt naming this board, the task brief served by the running app, the skills to read and the rules; the same button appears on every frame's footer, in the screen editor (frame, selected pin, idea being placed), the connection editor (the yarn), Plan (whole plan, per frame, per idea), the Ideas panel, App outline (whole and per screen), Review flow (all findings and each finding), Test flow (current screen and trail), the Detail view and the sketch library. The open board refreshes itself when the agent writes and nothing is unsaved. See `docs/AGENT_HANDOFF.md`.
- Leave it up to the AI: a post-it on a frame (toggle in the screen editor) says the builder should generate a standard, conventional page for it from the title, purpose, ideas and yarn. No drawing needed; the flow review stops asking for one; the export says so. For example, the Guide.
- Click to resize a frame. No overlap, lots of space.
- Planned connections are read in the Plan view and the text outline. The board draws only real yarn; a second, dashed kind of line was confusing and messy (removed 2026-09-26).
- Pan and zoom: drag blank space, scroll to zoom around the pointer, Shift + scroll to pan, a slider, plus and minus buttons, F to fit. The board never pans out of sight of its content: panning stops at the outermost frame plus padding, so the last frame in view is whole with cork beside it, never clipped at the edge. Zoomed far out, pin heads and yarn labels step aside so the frames stay readable; zoom in to work with them. Make it obvious which of Board, Outline and Plan is selected.
- Undo and redo, including deletions that remove pins and yarn together.
- Save status beside the board name, and a leave warning while unsaved.
- Export project: a ZIP with `project.json`, `schema.json`, `flow.md`, `review.json`, the images and a READ-ME.
- Mobile thumbnails: a card with a mobile drawing shows a small phone thumbnail in its corner.
- Open a screen, edit a yarn, open Review flow, Test flow, App outline or Planning.

## App outline

- Each screen once: entry screens, app screens, detail sketches; destinations link back so loops stay simple.
- Search screens, pins and paths.
- Edit screen and Show on board from any entry.
- Ideas waiting per screen.

## Planning

- Add an idea any time: title, details, which screen it belongs on, where it leads.
- A pool for unassigned ideas and a folder per screen.
- Place on the drawing: an assigned idea becomes a pin with its text already written, and its planned yarn is tied.
- Placed ideas grey out but stay legible, with their pin number, so nothing lands on two pages.
- Move an idea between screens; a placed idea gives up its pin so it can be placed again.
- Plan a frame before drawing it; it appears on the board with its ideas listed.
- Copy as text or show as text: a markdown outline for discussing the plan in chat; the same outline ships in `flow.md`.

## Screen editor (dialog)

- Web and mobile drawings, chosen from the library; both show the same pins. The drawing shows a toggle that swaps the image; the current build shows both side by side. To decide.
- A pins list beside the image: easy to move and delete; the selected pin is highlighted on the image.
- Color coding with labels you specify.
- Title and description fields for the pin.
- Add a pin on the web drawing; name it and describe the intention.
- Place a pin on the mobile drawing; pins not yet on mobile wait in a strip.
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
- Layout checks: a pin missing from a screen’s mobile drawing; a planned frame waiting for a drawing.

## Test flow (dialog)

- Choose a start: entry screens, or any screen as a labeled test entry.
- Click pins to follow paths; several yarns show a scenario chooser with conditions.
- Web or mobile: switch layouts; pins not yet on mobile are listed under the drawing.
- Rewind test, separate from app Back, which must be drawn.
- Closer looks open detail references without changing app history.
- Restart, and hide pins to see the sketch clean.

## How it works (dialog)

- Six steps and keyboard shortcuts.

## Links out (the route for URLs)

Anything that leaves the app for a web address is a pin with **Link out** as its purpose and the address written in its description, with any conditions in words. No yarn and no destination frame. The checks treat it as a way onward and ask for an address if none is written.

## Deliberately not included yet

- Phone capture or upload from a phone. Images are files already on this computer.
- Any LLM execution: no natural-language condition is evaluated and no code is generated from the board. The export is the input for that later workflow.
