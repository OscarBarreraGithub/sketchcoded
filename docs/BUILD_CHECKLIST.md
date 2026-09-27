# Build checklist

The user’s general rules for anything an agent builds for them: from a Sketchcoded board, in
Sketchcoded itself, or in any other project of theirs. Each rule applies every time, to every app,
so the rules carry no dates and name no product. Read this before building; check each item
against the result. When the user states a preference that holds for everything they build, add it
here in their terms; never delete one, mark it superseded.

What this file is not: the record of what the user asked for one project. A request about one
product (remove this label, change that default, call it this) belongs with that project and stays
there. For a board, that record is the board itself: its backlog, its pins’ words and its accepted
findings, which travel in `flow.md` and `project.json`. For Sketchcoded itself, it is
`docs/SKETCHCODED_REQUESTS.md`, `docs/PROGRESS.md` and the Sketchcoded board. Projects do not read
each other’s records; only this file is shared between them.

This file ships inside every export as `BUILD-CHECKLIST.md`, next to `flow.md`, and the running app
serves it at `/api/checklist.md`, so the agent that builds from a board has it first.

## How to read a board

- [ ] `project.json` is the specification. `flow.md` is the same content in reading order. Pins are the interactions; their descriptions are the intent, written by the user or their agent. Use the words as written.
- [ ] A screen’s drawing is the layout to build. Where a screen has a web drawing and a mobile drawing, both are the same screen; each pin has a position on each.
- [ ] Yarn is the navigation. Honor the authored kind: open (push), replace, start fresh (reset), open as dialog (modal), go back, dismiss. Never invent a route that is not drawn. Back and Dismiss use real history; if a screen can be reached without the history they need, the review says so and the user’s accepted reason explains what to do.
- [ ] Conditions on yarn are plain language. Implement them as described. Where they overlap or leave a case out, do not guess silently: build the fallback the user marked, and list the ambiguity.
- [ ] A **link pin** leaves the app for a web address written in its description. Build it as a plain link. Never a screen, never a frame, never a route.
- [ ] A **detail reference** shows a closer look without changing the screen. It is never navigation and never a way back.
- [ ] Planned frames (no drawing yet) and unplaced ideas are the backlog, not the spec. Do not build them; do not drop them either. Carry them forward as open items.
- [ ] Accepted review findings are decisions with reasons. Respect them. Open findings are the user’s to resolve, not yours to paper over.
- [ ] **A frame can be left to the AI.** A frame wearing the “Leave it up to the AI” post-it needs no drawing: build a standard, conventional page for it from its title, purpose, ideas and the yarn in and out. Everything else on the board is the user’s vision and is built as drawn.

## Layout and interaction (every screen, every view, every zoom)

- [ ] **Nothing grows or shrinks because of what was clicked.** Dialogs, panels and callouts keep a fixed size; their content scrolls inside. Selecting a different pin, tab or option never changes the size of the surrounding frame or moves the rest of the page.
- [ ] **Good control when zoomed in.** Test real browser zoom at 125%, 150%, 200% and 250% in a laptop-sized window (1440×900 and 1280×720). Text stays readable, controls stay reachable, nothing overflows its container, and the main work area stays usable. Zoom must work, every time.
- [ ] **Every view works at every zoom.** Not only the main screen: every editor, list, side panel, secondary view and dialog must be usable at those zooms. Check each one, seriously, after any layout change.
- [ ] **When something is off screen, the user must know.** Every scrolling region keeps a visible scrollbar and shows a clear “more below” or “more above” signal until the end is reached, in a real zoomed browser and not only in an emulated viewport. Never rely on an invisible overlay scrollbar.
- [ ] **The page never scrolls; panels do.** The app shell always fits the window, at every width and height, including short zoomed windows. Only columns, dialogs, side panels and list views scroll, each inside itself. A canvas or work area is the size of its region, never of its content.
- [ ] **A canvas never pans out of sight of its content.** Panning stops at the outermost item plus padding, so the last item in view is whole with room beside it, never cut off at the edge. When everything fits in view, it floats inside that padding. Something is always on the canvas.
- [ ] **All text is easily legible.** No text on screen under 12px, including eyebrows, badges, captions, footers and hints. Text that lives on a zoomable canvas keeps at least 12 screen pixels at any canvas zoom, or steps aside when the canvas is zoomed far out. Text that grows to stay legible must never change the size of the item it sits on: items on a canvas keep a fixed size in canvas units, and text that no longer fits hides or trims. Check at browser zoom too.
- [ ] **Nothing overlaps.** Labels, pins, frames, buttons and text keep clear of each other. Leave room to breathe.
- [ ] **Make it obvious what is clickable** and which option is selected: the active tab is filled, the primary action is unmistakable.
- [ ] Click targets are at least 44px and form fields at least 48px tall. Long notes stay readable without a tiny inner scrollbar.
- [ ] Order of work on any screen: first the logic and the placement of every element, second the behavior when the window resizes, third the mobile appearance.
- [ ] Mobile is a stacked version of the same screen; the drawing says what goes below what.
- [ ] No text-heavy summaries where a picture is expected. A card summarizes; the detail lives one click away.

## Copy and content

- [ ] Use the user’s words. Pin names and descriptions are the copy unless they say “rephrase”, in which case rephrase and show them.

## Process, for any agent working with the user

- [ ] Start servers and browsers only while using them; stop them before handing back, and check that their children and listeners are gone. Never point tests at the user’s data.
- [ ] Verify before saying done: run the project’s build, its tests (including real browser zoom where there is a screen) and its format check, record the results, and do not mark done what was not verified.
- [ ] **Measure before fixing a zoom report.** Reproduce it at laptop sizes (1440×900 and 1280×720 at 125%, 150%, 200%) with screenshots and numbers (page scroll, panel scroll, hint present), then fix, then measure again. Emulated viewports find layout bugs; the real tab-zoom test confirms them.
- [ ] Write things down the day they are said, so nothing is lost across a compaction: a general preference here, a project request in that project’s record, a decision with its reason where the project keeps decisions.
- [ ] The final message to the user restates the address of anything running and anything they need to do next.
- [ ] Keep this checklist general and undated. It is for every app, not for one; a rule that only makes sense for one product is a project request, not a rule.
