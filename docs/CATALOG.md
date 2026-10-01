# Requirements catalog and selling points

Every request made to Claude and Codex while building Sketchcoded, from the first brief (2026-09-07) to 2026-09-30: 118 distinct prompts, including messages sent while an agent was working, plus the notes written on the hand-drawn frames (kept as the pins of the Sketchcoded board). Requests made for other projects are left out, except where they used Sketchcoded. Items are edited and merged; where a later request changed an earlier one, the later one is listed and the earlier marked superseded. Status is as of 2026-09-30.

This is the source for the guide and the public site. The rules that apply to every project are in [BUILD_CHECKLIST.md](BUILD_CHECKLIST.md), dated Sketchcoded requests in [SKETCHCODED_REQUESTS.md](SKETCHCODED_REQUESTS.md), and the feature list by screen in [FUNCTIONALITY.md](FUNCTIONALITY.md).

## Selling points

1. **Sketch the app instead of describing it.** Drawings on paper, a whiteboard or any image file become the specification, so the AI builds your design rather than a generic one. “Prompts make apps. Sketching makes your vision.”
2. **Pins and yarn hold the logic in plain words.** Pin a button, tie yarn to the screen it opens, and write when it happens, what happens on the way and what data it needs. One pin can branch to several outcomes.
3. **Click through the app before any code exists.** Test flow follows the pins across your drawings, asks which branch to take, and keeps the app's own Back and Close separate from the tester's rewind.
4. **Finds dead ends and one-way paths.** Review flow lists screens nobody can reach, screens with no way onward and trips with no way back. An intentional exception, such as no return after signing in, is accepted with a reason and reopens if the flow changes.
5. **Plan first, draw later.** Write every idea down by screen, paste the plan into a chat as text, and tie the yarn between empty frames before a single drawing exists. Each drawing then slots into a flow that is already connected.
6. **Draw only the pages that matter.** Mark the rest “Leave it up to the AI” and Sketchcoded builds a conventional page from the plan that Test flow walks like a real site.
7. **Made for working with a coding agent.** Every view copies a three-line prompt that points the agent at a live brief for exactly that frame, pin, yarn or finding. The agent reads and writes the board through the local app, and the open board refreshes. An agent can also start a board from a codebase at one of three levels: just the list, frames and strings, or built out.
8. **Hands the builder a complete spec, with your rules.** The export carries the screen graph, its schema, the drawings, the review findings, a readable `flow.md` and your build checklist, which the agent must check its work against, including real browser zoom, overlap and legibility.
9. **One screen, web and mobile.** A frame can hold a web drawing and a mobile drawing that share the same pins and yarn, each pin with a position on both.
10. **Local, private and free.** It runs on your computer with no account, no API key and no upload, and your sketches never leave it. The source is on GitHub.

### More selling points

Also supported by the catalog, roughly in order of strength. Any of these can replace one of the ten above.

11. **Real navigation, not just arrows.** Each yarn says how the next screen opens: open, replace, start fresh, open as a dialog, go back or close. Test flow keeps the history, including dialogs opened from dialogs, so the builder knows exactly how every screen opens and closes.
12. **Big boards stay readable.** Switch to a text outline of the app, filter to one category of yarn while the other frames dull in place, and click a frame to bring its own threads forward. A crowded board shows labels only when asked.
13. **Pins know what they are.** A pin can be navigation, a link out (the address goes in its notes, with no fake screen for the other site), a closer look at a detail, or a note about content and local behavior. The checks and the builder treat each one correctly.
14. **Honest about what it checks.** Conditions are kept in words and never executed or claimed to be proved. An accepted exception keeps its reason and reopens when the flow it was about changes.
15. **Your rules go with every project.** Your general build checklist is in every agent brief and every export, so each agent follows the same standards for zoom, legibility, overlap and copy. What you decide for one board stays with that board.
16. **Shared names for everything.** Frames are P1, P2 …, sketches S1 …, ideas I1 …, and a pin is “P3 pin 2”, so you and the agent always mean the same thing. Codes are never reused.
17. **Drawings arrive by themselves.** Connect a folder and new or changed images appear on their own; drop files or a whole folder into one box otherwise.
18. **Your work is safe.** It saves as you go, keeps a backup of the previous version, refuses to overwrite newer work from another tab or an agent, and has undo and redo. Imported images are copied, so the original files are never changed.
19. **Use it on any project.** An agent working in another codebase on the same computer can create that project's board and plan it. Each board stays separate.
20. **Planned on itself.** sketchcoded.com was planned on a Sketchcoded board, and the public example is that board with its original drawings.
21. **Portable and open.** Export a board as one ZIP with everything in it, and import it as a new board on another machine. It runs on macOS, Windows and Linux, and boards are plain JSON and Markdown.
22. **Learn it by doing.** A six-panel interactive tutorial covers planning, pins, branches, review, Test flow and agent handoff on practice data that never touches your boards.

Not built yet, but requested: **point at the problem** (highlight an element on a built UI and hand it to the agent with a screenshot), which would extend selling point 7.

## Catalog

Status: **Built** (in the app or site), **Done** (a record, rule or process change), **Superseded**, **Open**.

### The core idea (2026-09-07)

- Draw screens on paper, a whiteboard or anything, and bring the images into a library from a folder on the computer. Built.
- Drag images onto a flexible bulletin board with a tack animation; each needs a title on a scrap of paper; zooming in and out is easy. Built.
- Open a screen, drop a pin on an element and describe what it does; tie yarn from the pin to the next screen. Built.
- Clicking yarn opens an editor for the logic (when it opens, what happens if blocked, and so on). One pin can feed several yarns, like if statements. Built.
- A screen can be a reusable view whose content depends on data, such as one chat view per user. Built (described in the yarn's data field).
- Represent the board for an LLM as a graph of nodes and edges, as input to a later agentic build and review loop designed by the user. Built (export); the integrated loop is deferred by design.
- Automatic checks that every page can be left and returned from, with exceptions such as a login page reviewed one by one, and no subtle cases left unaddressed. Built.
- A test button to click through the crude sketches; several yarns on one pin show their summaries to choose from. Built.
- Save the brief as a file, review work against it, track progress so nothing is lost across compaction, decide on the user's behalf and write those decisions down. Done.

### Name and words (2026-09-08, 2026-09-25)

- Name: Sketchcoded, with the domain sketchcoded.com. Approachable, not technical, not a startup billboard; drawn from chalkboard sketches, rough notes and clean output from messy input. Done.
- Landing-page line on AI making generic apps and the human touch, settled as “Prompts make apps. Sketching makes your vision.”; approved alternate “Telling an AI what you want gets you an app. Showing it gets you your vision.” Done.
- Brand line “Ideas, connected.” (from the home drawing). Done.
- Remove the board tagline and “A little space for your next big idea”. Done.
- No cute labels, slogans or decorative subtitles in any product; direct, specific copy only. Done (checklist).

### Rules for every app (2026-09-08 to 2026-09-30)

All are in the build checklist.

- Works in a zoomed browser; every view, editor and dialog works at every zoom. Done.
- Nothing is hard to click; fields are uniform in size. Done.
- Long text reads without clunky inner scrolling. Done.
- Nothing grows or shrinks because of what was clicked. Done.
- When something is off screen, the user always knows; scroll hints work in a real zoomed browser. Done.
- The page never scrolls; panels do. Done.
- A canvas never pans away from its content, and the last frame keeps padding beside it. Done.
- All text is easily legible, including yarn labels. Done.
- Nothing overlaps. Done.
- Order of work: logic and placement first, then window resizing, then mobile. Done.
- No idle development servers or test browsers left running. Done.
- Portable to new machines, users and accounts; nothing tied to one computer. Done.
- Public repositories stay clean and edited, with no raw prompts. Done.
- Write each issue down the day it is raised, so nothing is lost. Done.
- The checklist holds general, undated rules; project requests are kept separately, projects do not read each other's records, and preferences carry across. Done.
- Agents check what they make, including overlap and zoom, when they build a site from a board and when they author a board or its AI pages. Done.
- Examples and demos use the user's own drawings and board, never a stand-in. Done.

### Seeing the board (2026-09-08 to 2026-09-27)

- An overall map of the app without the mess of threads: a text, directory-style outline beside the board. Built (App outline).
- Easier movement: scrolling and a zoom slider instead of hand/pointer modes and plus/minus only. Built.
- A pin that opens a closer look at a detail rather than the next screen. Built (detail pin).
- Explain what the Review flow button does. Built.
- Show whether a sketch is already used. Built (New and Used library sections).
- Remove the dashed planned-connection lines; only yarn is drawn. Done.
- A crowded board stays legible: frames further apart, and clicking a frame highlights its threads and moves the frames tied to it slightly apart without losing anyone's place. Built; the click is superseded (2026-10-01): a click opens the frame and pointing at it highlights its threads.
- A click on a frame opens it; remove the small agent button and open arrow from each frame's footer (2026-10-01). Built.
- Much larger text everywhere, so nothing needs browser zoom; find everything too small; nothing breaks at the browser's maximum zoom (2026-10-01). Built in the app; the site follows.
- Filter by yarn category: the chosen color stays lit, unrelated frames shrink and dull in place, a Threads button beside Board / App outline / Plan with show all, naming and adding categories. Built.
- The smallest useful set of yarn categories, preset by the agent. Built (Main path, Branch, Detour, Way back).
- The bar above the board takes less room. Done.
- Panning and zooming are not edits; “All changes saved” stays. Built.
- Every item has a short internal code for talking to the agent; frames are P, not F, to avoid reading as function keys. Built (P, S, I).
- Resize handles on frames. Built.

### Planning before drawing (2026-09-25 to 2026-09-27)

- Input from files on the computer only; no phone capture. Done.
- Web and mobile drawings per frame with pins on both. Built (Web / Mobile toggle; supersedes showing both side by side).
- A planning stage: a place with every functionality idea, easy to add to at any time, organized by screen, easy to skim and to discuss in chat. Built (Plan view, outline text).
- The agent organizes the ideas into the backbone of the threads and writes what each pin is; the user draws and connects. Built.
- Ask what belongs on a page and get the answer from the plan; move ideas between pages on request. Built.
- Placed ideas grey out but stay legible so nothing lands on two pages. Built.
- Write the functionality down for a website that says what you can do, with a demo, and so future users benefit. Done (FUNCTIONALITY.md, this file).
- A planned destination can be an empty frame to drop a drawing into later. Built (planned frames).
- URLs are link pins: the address goes in the pin's notes, with no yarn and no frame of its own; written down as the expected route. Built.
- A “Leave it up to the AI” post-it for pages that can be standard. Built.
- Left to the AI means actually built: a walkable UI in Test flow, scrolling pages and working redirects, no backend. Built.
- An agent-built board ties its strings, so later changes are tweaks rather than a rebuild. Built (provisional pins).
- Three build levels on a slider: just the list; frames and strings; fully built out for fine-tuning a few pages. Built.

### Working with your agent (2026-09-26 to 2026-09-29)

- Remove the agent chat inside the app; it added nothing. Done.
- A copy-prompt button wherever work happens, telling the agent exactly what is being looked at and where the instructions are, with views, instructions and skills named so the prompt is generated. Built (Tell the agent).
- The agent talks to the running app directly. Built (local API, live refresh).
- The prompt dialog: better looking, clearly copied, the prompt in a small scrolling terminal that says it scrolls. Built.
- No task box; the prompt ends with a line saying anything typed after it is part of the task. Built.
- A short prompt that points at the instructions instead of holding them. Built (three lines and a served brief).
- Several projects: boards are saved separately, a landing page lists them, a new board can be created by an agent working in another project. Built.
- A five- or six-panel interactive tutorial. Built.
- Instructions so agents avoid the writing and layout mistakes seen on agent-built boards, checking zoom themselves. Done (skills, verify-the-result).
- Board-level lessons become instructions for future projects, not just fixes for one board. Done.
- Test the instructions by having a separate agent follow them, rather than the agent that wrote them. Done (process).
- **Point things out on a built UI**: highlight an element or area on the running site, add a note, and hand it to the agent with a screenshot and location, so nothing has to be described in words. Planned on 2026-09-29, **Open: not built**.

### The site and the example (2026-09-25 to 2026-09-28)

- A landing page: the name, a two-line description, a GitHub button, a copyable setup prompt, a way to open the example board, and a guide with an FAQ. Built.
- The site is its own repository, consistent with the app. Built.
- The GitHub button sits below the prompt box with the GitHub logo. Built.
- The example board is this website, planned on the user's real board with the user's drawings. Built.
- The example opens an interactive board only: it resets on reload, frames can be moved, clicking a frame starts Test flow there, a test button sits at the top right, there are no sidebars or editing, and it works on mobile and at every zoom. Built; yarn labels and ways back keep clear of every frame (2026-09-30).
- sketchcoded.com is hosted and live. Done.
- “See more projects” links to sciencewithagents.com. Built.
- The example keeps useful undrawn pages, left to the AI, and drops pages that add nothing. Built.
- “Example: this website” leads to The board itself, so the whole example is connected (2026-09-30). Built.
- The example opens on the view the board was left on in the app, close enough to read the yarn labels (2026-09-30). Built.
- How it works is left out of the example, and a page left to the AI opens there as a one-line summary and “I want this page to:” with a list of what goes there, in the author's voice, centered, nothing else (2026-10-01). Built.
- On mobile, the setup box sits below the example; make it obvious the example should be clicked (from the home drawing). Built.
- The app's own landing page copies the site's design, lists boards and starts new ones; the logo returns to it. Built.

### What the checks are (2026-09-28)

- The home drawing promised automatic checks for overlapping or small text and zoom problems. Review flow stays structural; those visual checks are part of the agent's instructions when building from a board or working on one. Done.
- Find what was asked for and not built, what to cut, what the guide is missing, and what in the checklist is project-specific. Done (review of 2026-09-28).

### Open (2026-09-30, updated 2026-10-01)

- **Point things out on a built UI** (above). Not built.
- **Restructure the guide** as our principles for web design (2026-10-01): every request of the kind “nothing overlaps”, “text readable without zooming”, “zoom works all the way in”, “the page never scrolls, panels do”, “say when there is more below”, “44px targets”, written for the public from [BUILD_CHECKLIST.md](BUILD_CHECKLIST.md), with the guide topics below for using Sketchcoded. Not started.
- **Place the P6 Close pin** on the Screen editor drawing. Every page on the example board now has a Back or Close and the colors use the category names; this one pin waits for its spot on the user's drawing.
- The integrated build and review loop from the original brief remains deferred by design.

## Guide topics

What the guide still needs, checked against the published guide on 2026-09-30. Topics the 2026-09-28 review raised that the guide now covers (the live example, working with an agent, what Test flow simulates, safe storage and recovery, where the build rules live, the setup commands) are left out. This is input for the guide restructure.

| Topic                    | Add or correct                                                                                                                                                                                                                                           |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First session            | Walk through opening or creating a board from the landing page (New blank board, the chat example, New board with your agent) and bringing sketches in through the library's drop box. The guide names the intake options but not the steps.             |
| Plan before drawing      | Give a short example of each build level. Explain why a placed idea stays listed and greyed: so nothing is pinned on two pages.                                                                                                                          |
| Reading the board        | Say where categories are named and added: the Threads menu. The guide mentions two colors you can name, not where.                                                                                                                                       |
| Two drawings, one screen | Say that both drawings share the same yarn and that a mobile drawing is not a separate page. Mention the Web / Mobile switch in Test flow.                                                                                                               |
| Structural checks        | Add the rules the list leaves out: a provisional pin not yet placed on its drawing, a detail sketch or detail pin without a reference, an ending without a reason, a connection without a name, duplicate identifiers, a frame without a board position. |
| What the AI gets         | Add `READ-ME.md`, which every export includes.                                                                                                                                                                                                           |
| Where instructions live  | The paragraph on the Markdown files names `AGENTS.md`, `README.md` and `docs/`. Also name `docs/skills/`, where the board-reading semantics live.                                                                                                        |
| Where are my files       | The FAQ places the data folder next to the app. Add that `--data-dir` chooses another location, as the setup section already says.                                                                                                                       |

**Status vocabulary.** Placed as a pin is not the same as implemented in code. The guide now says so; it should also say that unplaced ideas can describe features that already work. The plan tracks drawing and placement, so it cannot by itself say how much software remains to build. A separate implementation status would be a new product decision.
