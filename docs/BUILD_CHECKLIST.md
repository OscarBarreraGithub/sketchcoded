# Build checklist

The explicit list of rules for any agent that builds a site or app from a Sketchcoded board, and
for anyone working on Sketchcoded itself. Everything the user has asked for is here, in their own
terms, dated. Read it before building. Check each item against the result. When the user adds a
rule, add it here the same day; never delete one, mark it superseded.

This file ships inside every export as `BUILD-CHECKLIST.md`, next to `flow.md`, so the agent that
builds from the strings has it. It is also the source for the “build rules” section of the guide.

## How to read a board

- [ ] `project.json` is the specification. `flow.md` is the same content in reading order. Pins are the interactions; their descriptions are the intent, written by the user or their agent. Use the words as written.
- [ ] A screen’s drawing is the layout to build. Where a screen has a web drawing and a mobile drawing, both are the same screen; each pin has a position on each.
- [ ] Yarn is the navigation. Honor the authored kind: open (push), replace, start fresh (reset), open as dialog (modal), go back, dismiss. Never invent a route that is not drawn. Back and Dismiss use real history; if a screen can be reached without the history they need, the review says so and the user’s accepted reason explains what to do.
- [ ] Conditions on yarn are plain language. Implement them as described. Where they overlap or leave a case out, do not guess silently: build the fallback the user marked, and list the ambiguity.
- [ ] A **link pin** leaves the app for a web address written in its description. Build it as a plain link. Never a screen, never a frame, never a route.
- [ ] A **detail reference** shows a closer look without changing the screen. It is never navigation and never a way back.
- [ ] Planned frames (no drawing yet) and unplaced ideas are the backlog, not the spec. Do not build them; do not drop them either. Carry them forward as open items.
- [ ] Accepted review findings are decisions with reasons. Respect them. Open findings are the user’s to resolve, not yours to paper over.

- [ ] **A frame can be left to the AI.** A frame wearing the “Leave it up to the AI” post-it needs no drawing: build a standard, conventional page for it from its title, purpose, ideas and the yarn in and out. Everything else on the board is the user’s vision and is built as drawn. (2026-09-26)

## Layout and interaction (every screen, every device)

- [ ] **Nothing grows or shrinks because of what was clicked.** Dialogs, panels and callouts keep a fixed size; their content scrolls inside. Selecting a different pin, tab or option never changes the size of the surrounding frame or moves the rest of the page. (2026-09-25)
- [ ] **Good control when zoomed in.** Test real browser zoom at 125%, 150%, 200% and 250%. Text stays readable, controls stay reachable, nothing overflows its container, and the main work area stays usable. Zoom must work, every time. (2026-09-08, restated 2026-09-25)
- [ ] **When something is off screen, the user must know.** Every scrolling region keeps a visible scrollbar and shows a clear “more below” or “more above” signal until the end is reached. Never rely on an invisible overlay scrollbar. (2026-09-25)
- [ ] **The page never scrolls; panels do.** The app shell always fits the window. Only the left column, dialogs, side panels and list views scroll, each inside itself. The cork board must never make the page scroll, at any zoom or window size. (2026-09-26)
- [ ] **The board never pans out of sight of its content, and it stops at the last frame plus padding.** Panning ends when the outermost frame in view sits fully on the board with breathing room beside it, never with a frame cut off at the inner edge. When the whole board fits in view, it floats inside that padding. (2026-09-26, refined the same day)
- [ ] **Scroll hints must work in a real zoomed browser**, not only in an emulated viewport. Verify at 125% to 250% on a laptop-sized window, both 1440×900 and 1280×720. (2026-09-26)
- [ ] **Every view works at every zoom.** Not only the board: the screen editor, the connection editor, Review, Test, the outline, the plan and every dialog must be usable at 125%, 150%, 200% and 250% browser zoom on a laptop window. Check each one, seriously, after any layout change. (2026-09-26)
- [ ] **One kind of line on the board.** Colored yarn is navigation. Do not draw a second, dashed kind of line between frames; planned connections are read in the Plan view and in the text outline, not as lines. (2026-09-26)
- [ ] **All text is easily legible.** No text on screen under 12px, including eyebrows, badges, captions, footers and hints. Text that lives on the board (yarn labels, frame titles, frame footers) keeps at least 12 screen pixels at any board zoom, or steps aside when the board is zoomed far out. Check at browser zoom too. (2026-09-26)
- [ ] **Nothing overlaps.** Labels, pins, frames, buttons and text keep clear of each other. Leave room to breathe. (2026-09-25)
- [ ] **Make it obvious what is clickable** and which option is selected: the active tab is filled, the primary action is unmistakable. (2026-09-25)
- [ ] Click targets are at least 44px and form fields at least 48px tall. Long notes stay readable without a tiny inner scrollbar. (2026-09-08)
- [ ] Order of work on any screen: first the logic and the placement of every element, second the behavior when the window resizes, third the mobile appearance. (2026-09-25)
- [ ] Mobile is a stacked version of the same screen; the drawing says what goes below what. (For the landing page: the setup block sits below the example frame.) (2026-09-25)
- [ ] No text-heavy summaries where a picture is expected. A card summarizes; the detail lives one click away. (2026-09-25)

- [ ] **Every view can hand its task to the agent.** Wherever the user works (board, screen editor, connection editor, plan, outline, review, test flow), one button copies a prompt that names the view, the exact subject (board, frame, pin, yarn, idea, finding, trail) and where the instructions are, and shows the text for manual copying. The prompt points the agent at the running app's local API for the live brief, the drawings and the skills, so the agent reads the current state instead of asking. Views, briefs and skills have stable names so the prompt is generated, never hand-written. (2026-09-26)

## Copy and content

- [ ] Use the user’s words. Pin names and descriptions are the copy unless they say “rephrase”, in which case rephrase and show them.
- [ ] Sketchcoded: “Prompts make apps. Sketching makes your vision.” Alternate: “Telling an AI what you want gets you an app. Showing it gets you your vision.” (2026-09-25)
- [ ] Say plainly that it runs on the user’s computer and that sketches never leave it. No account, no API key, no upload. (2026-09-25)
- [ ] The setup prompt is the whole onboarding: something to paste into an AI, with a copy button. It is generated from the one place the repository address lives. (2026-09-25)

## Scope decisions to respect

- [ ] Desktop only for input: image files already on the computer. No phone capture. (2026-09-25)
- [ ] The landing site is its own repository and its own thing; the app is the app. Keep name, tagline, setup prompt and feature list identical between them. (2026-09-25)
- [ ] No agent chat inside the workstation. The plan is where ideas go; the export is where an agent reads from. (2026-09-25)
- [ ] No LLM runs inside Sketchcoded yet. Nothing written in words is executed or proved. (2026-09-07)

## Process for agents working on Sketchcoded itself

- [ ] Read `AGENTS.md`, `docs/ORIGINAL_BRIEF.md`, `docs/PROGRESS.md`, `docs/DECISIONS.md` and this file before changing anything.
- [ ] Run `npm run build`, `npm test`, `npm run test:ui` (includes real browser zoom) and `npm run format:check`. Record results in `docs/PROGRESS.md`; do not mark done what was not verified.
- [ ] Start servers and browsers only while using them; stop them before handing back. Never point tests at the user’s data.
- [ ] **Measure before fixing a zoom report.** Reproduce it at laptop sizes (1440×900 and 1280×720 at 125%, 150%, 200%) with screenshots and numbers (page scroll, panel scroll, pill present), then fix, then measure again. Emulated viewports find layout bugs; the real tab-zoom test confirms them. (2026-09-26)
- [ ] Keep `docs/FUNCTIONALITY.md` and the Sketchcoded board’s backlog in step. Keep this checklist explicit and dated.
- [ ] The final message to the user restates the URL of anything running and anything they need to do next.

## What the user said, and when

A dated record so nothing is lost. Each line points at the rule above it created.

- **2026-09-07, the brief.** A bulletin board for sketches; drop with a tack animation; title each image on a paper scrap; easy zoom; pins with high-level descriptions; yarn with the logic; one pin can feed many yarns; a graph the LLM can read; an automatic check for one-way pages, with the login case handled by letting the user or a later LLM accept the exception one by one; a Test button to click through the sketches, with a chooser when a pin has several yarns; save the brief as Markdown; track progress so nothing is lost across compaction.
- **2026-09-08, usability.** Rename to Sketchcoded; fix zoomed-in clipping; an outline view beside the board; simpler board movement and a zoom slider; every control easy to click; consistent field sizes and readable text; no nested scrolling for long text; detail sketches distinct from navigation; explain what Review flow checks; show which sketches are used.
- **2026-09-08, process.** No idle development servers or browsers.
- **2026-09-25, scope.** Desktop only for now; users bring files from the computer. Mobile and web layouts for every screen, overlaid, with pins connected accordingly and both shown when a screen is opened. Logic and placement first, resizing second, mobile third.
- **2026-09-25, planning.** Make the first board the structure of the site itself. The agent organizes the functionality into the backbone and leaves the pins open; the user draws and connects. Show the plan as pins and yarn and as text that is easy to talk about in chat. A place for ideas that is easy to add to and skim. “What should go on the home page?” answered from the backlog; move ideas on request; the yarn follows. Pinned ideas grey out but stay legible so nothing lands on two pages. Write the functionality down for a website that explains what you can do, with a demo, so future users benefit too.
- **2026-09-25, the landing page.** A sentence or two; the name; two lines; a GitHub button; a copy-and-paste prompt to set up; an easy way to open the example workspace, not to play it; a guide plus FAQ. Tagline work settled on “Telling an AI what you want gets you an app. Showing it gets you your vision.”
- **2026-09-25, the drawings.** Landing: example of this website sending to a read-only demo, made obviously clickable; on mobile the setup block goes below the example frame; runs local and sketches never leave, rephrased; read more in a guide covering the autochecks (no overlapping or small text, no browser zoom issues), setup from the Markdown file structure, and GitHub. Workstation: Used and New library sections, drag and drop onto the board moves an image to Used, drag to upload; an ideas panel that makes clear what is left; project name; Export, Test and help buttons; plus and minus zoom just in case; Board, Outline and Plan tabs with the selected one obvious; cork background; color-coded yarn; tape titles; click to resize; no overlap; lots of space; a little home marker where the landing page starts. Overlay: add pin; highlight the selected pin; a pins list that is easy to move and delete; color coding with labels; title and description; toggle web versus mobile changes the image; remove.
- **2026-09-25, readability.** Walls of text per image are unusable; too many things overlapped. Cards summarize; threads merge; labels shrink.
- **2026-09-25, layout stability.** “We should never have the background grow or shrink depending on the button we pressed.” Never, on any site ever built.
- **2026-09-25, links.** GitHub should not have its own frame. A pin can carry a URL in its description with any conditions; the pin is the exit. This is the expected route for URLs.
- **2026-09-25, repositories.** The landing page is separate, as the public site; two repositories; set up clean.
- **2026-09-25, agent box.** Remove the agent chat from the workstation; it adds nothing and makes it messy.
- **2026-09-25, zoom and scrolling.** It was not obvious that the left panel scrolls when zoomed in. Always keep good control when zoomed in, and always let the user know when something is off screen. Keep this checklist explicit and complete.
- **2026-09-26, zoom, scrolling and panning.** The scroll pill did not show up in a zoomed-in browser. The cork board should not scroll for so long; the left panel is what should scroll. The board must never pan out past the content: room is fine, but there must always be content on the board. Keep adding every issue raised to this checklist.
- **2026-09-26, leave it up to the AI.** “We should also have the option to basically have the AI generate a standard board for one particular page, if needed. For example, for our guide, we can put a little label that says like ‘leave it up to the AI’ with a sticker or something. A post-it note.”
- **2026-09-26, dashed threads.** “The use of the dashed lines connecting things (instead of the colored yarn) is confusing. Not clear at all what is going on, also too overlapping and messy.”
- **2026-09-26, the editor at zoom.** “The view when we actually open up the image to add the pins and stuff doesn’t work zoomed in. Make sure, seriously, that every view works with all zooms.”
- **2026-09-26, the board's edge.** “Constrain the board so that it's not just the inner border of one of the posted pictures, but you have some padding on the last one in view.” (With two screenshots: one frame clipped at the left edge; one frame alone in view.)
- **2026-09-26, legible text.** “We also need the text connecting things to be larger. Hard to read. Can we make sure all text is easily legible?”
- **2026-09-26, tell the agent.** “For the board view where we are manually adding the pins, can we have a button which gives us a prompt, copied into our clipboard (but also with the ability to manually copy), that basically tells the agent exactly which frame you're looking at and where the task instructions are. This entire site has to play well with the agent the user is working with. Nowhere do we have the agent directly talking with our running localhost. We need an easy way to tell the agent ‘here is your current task’: point to the right page and the right prior instructions so there is no confusion or unneeded back and forth. Work out everywhere, in every view, where this is needed and set up the copy prompts there. Name the views, instructions and skills so generating the prompt is modular. Have a reviewer check everything.”
