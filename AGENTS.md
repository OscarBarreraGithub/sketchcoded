# Working on Sketchcoded

Read `docs/ORIGINAL_BRIEF.md`, `docs/PROGRESS.md`, `docs/DECISIONS.md`, `docs/SKETCHCODED_REQUESTS.md`, `docs/BUILD_CHECKLIST.md` and `docs/CATALOG.md` before changing the product. The checklist is the user's general rules for anything they build, as edited requirements without dates; it is shared with every project, so add a preference there the day it is given, never delete, mark superseded. Requests specific to Sketchcoded (remove this label, change that default) are not rules: record them, dated, in `docs/SKETCHCODED_REQUESTS.md`, note the work in `docs/PROGRESS.md` and keep the board's backlog current. Project records do not read each other; only the checklist is shared. `docs/CATALOG.md` lists every request so far with its status, and `docs/PROGRESS.md` ends with what is open. Keep public documentation as concise, edited requirements and decisions, without raw chat transcripts, personal paths, account details or session-specific instructions. Preserve the intent of the original brief; its prose may be edited. Keep the progress file and significant decisions current when the implementation changes.

This is a local screenshot flow designer. The later LLM generation/review workflow is not implemented yet. Keep screen/pin intent and natural-language branch rules intact; do not pretend to execute or prove prose conditions. Keep test rewind distinct from authored navigation.

- `shared/model.ts`: executable versioned project schema.
- `shared/graph.ts`: structural diagnostics and acceptance invalidation.
- `shared/navigation.ts`: preview history semantics.
- `shared/planning.ts`: the chat-friendly planning outline (ideas by screen, with placed/waiting/pool markers).
- `server/`: image snapshots, local persistence, import/export, API.
- `src/`: React application and interaction components.

Run `npm run dev` for localhost:5173. `npm test` covers the graph, navigation, planning, codes, agent briefs, standard pages, storage, API and portability. `npm run build` checks types and builds the frontend. `npm run test:ui` tests the built app on an isolated localhost:5174 server; build first. `npm run format:check` checks formatting.

Preserve `.drawcode/` user data. It is ignored by Git. Do not point tests at a user's production data directory. Do not run multiple app servers against the same data directory.

## Planning routine

The Plan view holds the functionality backlog (`project.ideas`). When the user describes functionality, add it there rather than only in chat, assigned to the screen it belongs on and with `leadsTo` when the destination is clear. When asked what belongs on a screen, answer from the backlog and move ideas on request; the board's planned frames update from the same data (planned connections are shown in the plan and the outline, never as lines on the board). Use `planningOutline()` (Copy as text in the app, or the section in `flow.md`) as the shared text when discussing the plan. Placed ideas stay listed and greyed so nothing is pinned on two pages. Keep `docs/FUNCTIONALITY.md` in step with the product requirements. When maintaining an authorized local Sketchcoded planning board, keep its backlog in step too; a fresh checkout does not depend on that board existing. The user draws and connects; the agent writes down what each pin is.

A screen may be a planned frame (`assetId: null`) and may carry a mobile drawing; pins are anchored on the web drawing and get a second position for mobile. A planned frame may already carry **provisional pins** (`provisional: true`, placeholder positions down its right side) with real yarn, so the flow is tied before anything is drawn; when a drawing lands on the frame the editor asks the user to place each one, and the review warns (`pin-not-placed`) until they do. Input is desktop only: image files on this computer, no phone capture.

## Design rules

The full list of general requirements is `docs/BUILD_CHECKLIST.md`; it ships inside every export and is served at `/api/checklist.md`. The essentials:

- **Nothing on screen grows or shrinks because of what was clicked.** Dialogs, panels and callouts keep a fixed size; their content scrolls inside. Selecting a different pin, tab or option must never change the size of the surrounding frame or move the rest of the page. This applies to Sketchcoded and to anything built from a Sketchcoded board.
- Nothing overlaps: labels, pins and frames keep clear of each other, and the board leaves room to breathe.
- Test real browser zoom (125% to 250%) after layout changes; text must stay readable, controls reachable, and the user must keep good control of the workspace.
- When content continues off screen, say so: every scrolling region keeps a visible scrollbar and shows a “More below” hint (`ScrollHints`) until the end is reached. Never rely on an invisible overlay scrollbar.
- Keep click targets at least 44px, fields at least 48px, and long notes readable without nested text scrolling.
- **The page never scrolls; panels do.** The app shell is always the height of the window (`100dvh`, at every width and height, including short zoomed windows). Only the left column, dialogs, side panels and list views scroll, each inside itself. The board is the size of its area, never of its content.
- **The board never pans out of sight of its content.** Every view change goes through the clamp in `src/boardView.ts`: panning stops at the outermost frame plus padding (`PAD`), so the last frame in view is whole with cork beside it, never clipped at the edge; a frame always stays on the board.
- **A color is a category of yarn.** Red is the main path, gold a branch, blue a detour, olive the way back; violet and teal are spare, and `colorLabels` names whatever a board uses (`defaultColorLabels` and `categoryHelp` in `shared/model.ts`). The **Threads** button beside Board / App outline / Plan filters the board to one category: its yarn stays lit and the frames it never touches shrink slightly and dull, in place, so the shape of the board is never lost. Naming and adding categories happens in the same menu.
- **A crowded board rests quietly.** With more than eight threads the yarn draws back and each label waits as a small mark. Clicking a frame picks it out: its own threads and labels come forward, everything else fades, and the frames it is tied to step 26 screen pixels further away. The step is a transform, never a written position, so nothing is lost and nothing jumps. Clicking the cork lets go; the tape title, the arrow and a double-click open the frame.

## Links out

A pin that leaves the app for a web address is a **link pin** (`kind: "link"`). The address, and any conditions, go in the pin's description in plain words; the checker reads the first URL from it. A link pin has no yarn and no destination frame; it counts as a way onward for its screen. Do not create a screen to represent an external site. This is the expected route whenever a URL is involved.

## Pins, details and codes

Content and local behavior use `kind: "annotation"` (Content / local action), with intent in the description and no yarn. They are not exits. Detail references are illustrations, separate from app transitions; never count them as reachability or return paths. Preserve `codeCounters` so deleted P/S/I codes are never reused. Preserve the board/outline alternatives. The Sketchcoded rename deliberately retains the `.drawcode/` storage path and legacy protocol keys. The app landing page includes the six-panel practice tutorial.

## Left to the AI

A frame may wear the “Leave it up to the AI” post-it (`leftToAi: true`, toggled in the screen editor). It means: build a standard, conventional page for this screen from its title, purpose, ideas and the yarn in and out; no drawing is expected and the review does not ask for one. Everything else on the board is the user's vision and is built as drawn.

Sketchcoded builds that page itself. `shared/standard-page.ts` turns the frame into a page (a top bar, a heading, a main action, cards, fields, a footer) from its pins and ideas; `src/components/StandardPage.tsx` renders it, and **Test flow walks it like a real site**: scrolling pages, buttons that follow the frame's own yarn, forms for `auth`, dialogs for `modal`, quiet endings for `terminal`. Nothing is behind it: only the redirects work. A drawing always wins, since that is the user's own vision. `flow.md` carries the same page under “Standard page (what Test flow shows)”, so the builder builds what the user clicked through.

## Handing a task to the agent

Every work view has a **Tell the agent** button (`src/components/TellAgent.tsx`). It copies a three-line prompt generated from `shared/agent.ts`: the view and the exact subject (board, frame, pin, yarn, idea, finding, trail), the URL of the task brief the running app serves for it (`/api/projects/:id/brief?view=…`), and the line that whatever the user types under it is part of the task. The brief holds everything else: the task, the skills to read (`/api/skills/:id.md`, files in `docs/skills/`) and the user's rules (`/api/checklist.md`). The agent reads the live board and writes back through `PUT /api/projects/:id`. Views, contexts, skills and build levels are registries; add to them, never hand-write a prompt. A new board, or an empty one, is written at one of three levels chosen in the dialog (`mode`): **Just the list** (ideas in the pool), **Frames and strings** (planned frames, ideas, provisional pins and yarn; the default) or **Built out** (frames and strings with every frame left to the AI); `docs/skills/start-a-board.md` says what each writes and how to write for the builder. `docs/AGENT_HANDOFF.md` is the full description and the reviewer's checklist. When you are the agent receiving such a prompt: read the brief first, follow the named skills, stay on the named subject, and tell the user to reload after writing.

## Companion site

The public landing page lives in the separate `sketchcoded-site` repository (static HTML, no build), published at [sketchcoded.com](https://sketchcoded.com) and on GitHub as `OscarBarreraGithub/sketchcoded-site`. This repository is `OscarBarreraGithub/sketchcoded`. The two repositories can be cloned into any directories; do not assume they are siblings. Keep the site's copy consistent with `docs/FUNCTIONALITY.md` and the README: same name, tagline, setup prompt and feature list. Its `links.js` holds every external address in one place.

- **The example board on the site is the user's real Sketchcoded board**, with their own hand drawings, pins and yarn. It is never drawn or invented by an agent. With the intended app instance running, `node tools/make-example.mjs` in the site repository pulls the board named Sketchcoded from `http://127.0.0.1:5173` and writes `example/board.json` and `example/art/`; commit what it writes. Regenerate whenever that board changes. Use `--base` and `--board-id` for a different app instance or board; the bundled snapshot works without a local board. The public export omits isolated, undeveloped planning frames by default; `--include-planned` exports the full board. Preserve those omitted frames in the local backlog. Only publish drawings authorized for public use.
- **Deploy** using the site repository's README: stage the public files with `node tools/stage-site.mjs` and deploy the staged `.site-dist/` directory, never the repository root, authenticated to the intended hosting account and explicitly selecting its project. A fork needs its own hosting project and domain; no machine or account credentials are supplied by either repository. Preserve existing email DNS records (including MX and SPF) when configuring a domain. Never change DNS as a side effect of a content deployment.

## Development process lifecycle

The user wants no idle development servers or Chrome/test-browser processes left running. Start them only while directly using them for the current task, then stop them before handing control back unless the user explicitly asks to keep them open.

- Check existing project processes and listening ports before starting a server. Reuse an appropriate instance instead of creating duplicates.
- Track the processes/sessions started for the task. Close browser contexts and browsers in `finally` blocks; stop temporary servers on success, failure, cancellation, and timeout.
- Before finishing, verify the project server/watchers, their child processes, temporary test browsers and test-port listeners are gone. Stop the watcher/parent as well as the serving child so it cannot restart the server.
- Identify processes by executable, working directory, parentage and port. Do not use broad commands such as `pkill node` or `pkill chrome`; unrelated IDE, OS and agent services may be active.
- Do not launch a browser or server just to verify a documentation or process-cleanup change.

## Agent acceptance at both stages

Every task brief requires `verify-the-result` (`docs/skills/verify-the-result.md`). An agent working on a board checks the affected rendered views and every affected page left to the AI against the whole general checklist. An outside agent constructing the site checks the finished implementation against the same checklist, including overlaps and actual browser zoom. Report evidence and unresolved failures before claiming completion. Review flow remains structural; there is no separate automatic visual checker.

## Portability

Use the README's cross-platform commands and configuration options. Resolve bundled resources from `server/paths.ts`, never from a developer's home directory or the launch directory. Default data stays in this checkout's `.drawcode/`; an explicit data path belongs to the caller. Bind only to loopback. Keep tokens, account IDs and local data out of Git. Canonical public links are product configuration, not prerequisites for running the app.
