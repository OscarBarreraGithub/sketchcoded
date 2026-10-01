# Build checklist

General requirements for every project built with these instructions. Each rule applies every time,
to every app, so the rules carry no dates and name no product. Read this before building and
check each item against the result. Add general preferences here as clear requirements; never
delete one, mark it superseded. Product requests and instructions for a particular tool belong
in that project’s own records and guides. Projects share this checklist, not their histories.

## Layout and interaction (every screen, every view, every zoom)

- [ ] **Nothing grows or shrinks because of what was clicked.** Dialogs, panels and callouts keep a fixed size; their content scrolls inside. Selecting a different pin, tab or option never changes the size of the surrounding frame or moves the rest of the page.
- [ ] **Good control when zoomed in.** Test real browser zoom at 125%, 150%, 200% and 250% in a laptop-sized window (1440×900 and 1280×720). Text stays readable, controls stay reachable, nothing overflows its container, and the main work area stays usable. Zoom must work, every time.
- [ ] **Zoom works all the way in.** After the 125% to 250% checks, keep stepping real browser zoom up to the browser's maximum (500%) in both window sizes. Nothing breaks: the page never scrolls, every control stays reachable (a crowded toolbar scrolls sideways, a dialog becomes one scrolling column with its main content first), nothing overlaps, and a scrolling region still says there is more.
- [ ] **Every view works at every zoom.** Not only the main screen: every editor, list, side panel, secondary view and dialog must be usable at those zooms. Check each one after any layout change.
- [ ] **When something is off screen, the user must know.** Every scrolling region keeps a visible scrollbar and shows a clear “more below” or “more above” signal until the end is reached, in a real zoomed browser and not only in an emulated viewport. Never rely on an invisible overlay scrollbar.
- [ ] **The page never scrolls; panels do.** The app shell always fits the window, at every width and height, including short zoomed windows. Only columns, dialogs, side panels and list views scroll, each inside itself. A canvas or work area is the size of its region, never of its content.
- [ ] **A canvas never pans out of sight of its content.** Panning stops at the outermost item plus padding, so the last item in view is whole with room beside it, never cut off at the edge. When everything fits in view, it floats inside that padding. Something is always on the canvas.
- [ ] ~~**All text is easily legible.** No text on screen under 12px, including eyebrows, badges, captions, footers and hints. Text that lives on a zoomable canvas keeps at least 12 screen pixels at any canvas zoom, or steps aside when the canvas is zoomed far out. Text that grows to stay legible must never change the size of the item it sits on: items on a canvas keep a fixed size in canvas units, and text that no longer fits hides or trims. Check at browser zoom too.~~ Superseded by “Text is comfortable to read without zooming in”.
- [ ] **Text is comfortable to read without zooming in.** If the user would reach for browser zoom to read something, it is too small. At 100% browser zoom, anything a person reads (body text, help, hints, labels, buttons, fields, captions, footers, eyebrows) is at least 15px, and nothing, not even a badge or a count, is under 14px. Text on a zoomable canvas keeps those sizes in screen pixels at the zoom the user actually works at, or steps aside when the canvas is zoomed far out. Text that grows to stay legible never changes the size of the item it sits on: items on a canvas keep a fixed size in canvas units, and text that no longer fits hides or trims.
- [ ] **Look for what is too small.** After any visual change, measure every view instead of judging it by eye: list every piece of text under the minimum and every click target under 44px, at 100% browser zoom and, on a canvas, at the zoom the user works at (including the view they saved). Fix what the list finds. A small visible mark may keep a larger invisible click area. Exempt only a link inside a sentence or a decorative miniature, and say so.
- [ ] **Nothing overlaps.** Labels, pins, frames, buttons and text keep clear of each other. Leave room to breathe. When there are more labels than fit without collision (a canvas, a map, a graph, a chart), show them on demand rather than all at once: a small marker in place, the full label on hover, on selection, or past a zoom level. Selecting something shows its own labels and quiets the rest.
- [ ] **Make it obvious what is clickable** and which option is selected: the active tab is filled, the primary action is unmistakable.
- [ ] Click targets are at least 44px and form fields at least 48px tall. Long notes stay readable without a tiny inner scrollbar.
- [ ] Order of work on any screen: first the logic and the placement of every element, second the behavior when the window resizes, third the mobile appearance.
- [ ] Mobile is a stacked version of the same screen; the drawing says what goes below what.
- [ ] No text-heavy summaries where a picture is expected. A card summarizes; the detail lives one click away.

## Copy and content

- [ ] Preserve authored product copy unless rewriting is requested; when it is, show the revised copy.

- [ ] **Write direct, specific product copy.** Do not invent cute or whimsical labels, slogans, subtitles, inspirational phrases, or vague promises of companionship or reassurance. Every heading, label and supporting line must identify something, explain an action or communicate a concrete benefit. Omit decorative subtitles and filler that add no useful information. Apply this to new work; do not rewrite existing sites without a request.

- [ ] Keep public repository documentation concise and edited. Record requirements and decisions instead of raw conversation transcripts; correct grammar and spelling and omit personal environment details.

## Portability

- [ ] Support new machines, users and accounts without source edits for local paths or credentials. Provide documented configuration for environment-specific values and portable setup commands. Keep private data and credentials out of version control.

## Process, for any agent working with the user

- [ ] **The agent checks what it makes.** When an agent constructs a site from a design, or works on the design itself, including pages whose design is left to the AI, the full checklist must pass before that work is called done. Inspect the rendered result, including overlapping text and zoom control. This belongs in the agent’s instructions; a structural check alone does not verify appearance or usability.
- [ ] **Show what was checked.** Record the views, window sizes and real browser zoom levels tested, the results and any remaining failures. Fix failures within the task’s scope. Say what is blocked or unverified; do not claim it passed.

- [ ] Start servers and browsers only while using them; stop them before handing back, and check that their children and listeners are gone. Never point tests at the user’s data.
- [ ] Verify before saying done: run the project’s build, its tests (including real browser zoom where there is a screen) and its format check, record the results, and do not mark done what was not verified.
- [ ] **Measure before fixing a zoom report.** Reproduce it at laptop sizes (1440×900 and 1280×720 at 125%, 150%, 200% and 250%) with screenshots and numbers (page scroll, panel scroll, hint present), then fix, then measure again. Emulated viewports find layout bugs; the real tab-zoom test confirms them.
- [ ] Write things down the day they are said, so nothing is lost across a compaction: a general preference here, a project request in that project’s record, a decision with its reason where the project keeps decisions.
- [ ] The final message to the user restates the address of anything running and anything they need to do next.
- [ ] Keep this checklist general and undated. It is for every app, not for one; a rule that only makes sense for one product is a project request, not a rule.
