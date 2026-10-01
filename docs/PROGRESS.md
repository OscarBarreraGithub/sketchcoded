# Product progress and handoff

Updated 2026-09-30. Current status for anyone picking the product up. Requirements are in [SKETCHCODED_REQUESTS.md](SKETCHCODED_REQUESTS.md), decisions in [DECISIONS.md](DECISIONS.md), and every request so far with its status in [CATALOG.md](CATALOG.md).

## Current state

The local screenshot flow designer, structural review and interactive Test flow are implemented, together with planning, web and mobile drawings, provisional pins, agent handoff, pages left to the AI, thread categories and a six-panel tutorial. The integrated model generation and review workflow remains deferred by design.

The companion site is live at [sketchcoded.com](https://sketchcoded.com), with a [guide](https://sketchcoded.com/guide) and a [read-only example](https://sketchcoded.com/demo) made from the authored Sketchcoded board and its original hand drawings. The published example has nine frames: three drawings and six pages left to the AI, all connected, the same nine as the local board.

The local Sketchcoded board is at revision 235. Home's “Example: this website” leads to The board, since the example on the site is that board; the separate P11 Example demo frame was removed, and so were the blank P2 Boards and P8 Review flow frames, whose 14 ideas are now in the unassigned pool. Every page has a way back through Back or Close pins, shown as small ↶ marks in the frame footers, and its categories are named Main path, Branch, Detour and Way back. Home → The board is accepted as one way (the site's logo returns home). Review flow has one open finding: the P6 Close pin waits to be placed on its drawing. The example opens on the view the board was left on, and was regenerated from revision 235.

## Start here

1. Read `AGENTS.md`, then `ORIGINAL_BRIEF.md`, `SKETCHCODED_REQUESTS.md`, `DECISIONS.md`, `BUILD_CHECKLIST.md` and `CATALOG.md` before changing the product.
2. Follow the repository README for setup, configuration, storage and recovery. Node 22.12 or later and npm are required; no account or API key is needed. The checkout can live anywhere.
3. Run `npm ci`, then `npm run dev`. Use `-- --port 0` to choose an available port, and open the address printed by the server. Keep only one server per data directory.
4. Preserve `.drawcode/` or the configured data directory. A fresh installation creates the Little chat sample and needs no maintainer board. Use isolated data for tests.
5. Use the active board's plan and generated outline when discussing its requirements. Update an existing product-planning board only when that work is authorized. Keep `FUNCTIONALITY.md` current independently of local data.
6. The companion site is the separate `sketchcoded-site` repository and can be cloned anywhere. Its README covers configuration, example regeneration and deployment. A fork uses its own hosting project.
7. Stop task servers and test browsers, including their child processes, before handing back unless asked to keep them running.

## Implemented scope

- Local file and folder intake, immutable image snapshots, watched folders and New/Used library sections.
- A pannable, zoomable board with named, resizable frames, pins, branching yarn, thread filtering and an outline alternative.
- A planning backlog with assignments, placed markers and copyable text; planned frames and provisional pins before drawing.
- Web and mobile drawings of the same screen, with shared navigation and separate pin positions.
- Interaction, link, detail and content/local-action pins with distinct semantics.
- Structural diagnostics, reasoned exceptions, evidence invalidation and explicit checker limits.
- Test flow with branches, authored history, dialogs, generated standard pages and independent test rewind.
- Autosave, atomic backups, revision conflicts, undo/redo and portable export/import with the checklist and skills.
- Generated agent prompts and live briefs in every work view; three board-build levels and safe refresh after agent writes.
- Six tutorial panels with practice state separate from saved boards.
- Cross-platform setup with configurable port and data directory.
- Public guide and read-only example, with links, layouts and history matching the app.

See `FUNCTIONALITY.md` for the feature list by screen and `GRAPH.md` for model semantics.

## Milestones

| Date          | Result                                                                                                                                                                                     | Verification                                                                                                                                                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-07    | Local designer, graph, review, preview and export                                                                                                                                          | Build, 40 unit/API tests, 9 browser workflows, formatting                                                                                                                                                                     |
| 2026-09-08    | Sketchcoded rename, App outline, detail references, board controls, browser zoom                                                                                                           | Build, 49 tests, 13 browser workflows including real Chromium zoom at 125–250%, formatting                                                                                                                                    |
| 2026-09-25    | Planning backlog, planned frames, web and mobile drawings, link pins, workstation, separate public site                                                                                    | Build, 66 tests, 16 browser workflows, formatting; the screen editor kept a fixed 1190×920 px while switching pins                                                                                                            |
| 2026-09-26–27 | Agent handoff, codes, provisional pins, build levels, standard pages, thread categories                                                                                                    | Covered by the 2026-09-28 regression suite                                                                                                                                                                                    |
| 2026-09-28    | Review follow-up: save safety, workspace at high zoom, checks for pages left to the AI, durable codes, annotation pins, tutorial, public-demo alignment; 22 static pins became annotations | Build, 102 unit/API tests, 32 browser workflows, formatting; at 1280×720 and real 250% zoom the board keeps 184 CSS px of height (was 22.8)                                                                                   |
| 2026-09-28    | Portability: cross-platform startup, port and data options, repository-relative resources, complete exports, CI matrix                                                                     | Build, 105 unit/API tests, 32 browser workflows; a fresh checkout in a path with spaces passed; app and site CI passed on macOS, Linux and Windows with Node 22.12 and 24; 16 site checks at both laptop sizes and four zooms |
| 2026-09-28    | Focused public example: ten frames, seven pages left to the AI                                                                                                                             | Build, 105 tests, 32 browser workflows; 112 delegated-page checks (7 pages, 4 zooms, 2 window sizes, app and demo); site CI passed                                                                                            |
| 2026-09-30    | Requirements catalog; ways back and named categories on the Sketchcoded board                                                                                                              | Board review findings went from 18 to 3                                                                                                                                                                                       |

## Deliberate limits

- Input uses image files on the computer; phone capture is not implemented.
- One local server owns each data directory. Hosted collaboration, authentication and cloud sync are not implemented.
- No model runs inside Sketchcoded. Prose conditions are not executed or proved; generated standard pages are navigable prototypes without a backend.
- Visual verification belongs to the acting agent and the test workflow. Review flow does not inspect pixels.
- Source-folder connections are machine-specific. Portable ZIPs omit those paths; reconnect a folder after moving machines if ongoing refresh is needed.
- Earlier documentation remains in Git history; cleanup uses normal commits.

## Open

- Place the P6 Close pin on the Screen editor drawing (the user's step), then regenerate the example.
- Restructure the guide from `CATALOG.md`, starting with its “Guide topics” section.
- Point things out on a built UI: planned on 2026-09-29, not built.
- Decide whether the in-app How it works help folds into the six-panel tutorial.
- Existing UI copy that predates the direct-copy rule (for example “From a sketch to a story.”) is unchanged, as that rule asks; rewrite it only on request.

## Verification · 2026-09-30

Changes: ways back and category names on the Sketchcoded board; yarn labels placed clear of every frame and ways back shown as small ↶ marks in each frame's footer, in the app and the public example (`src/boardNotes.ts`); the AI post-it never covers a title; waiting pins listed beside the drawing in Test flow; the example's legend and controls in a strip below the cork; a 404 page, the logo's full stop, guide paragraph spacing and a current hero image on the site; stale pass reports and unused screenshots removed and their content folded into the current records.

- `npm run build`, all **113** unit/API tests (five for label placement, three for arriving at a test start), all **32** browser workflows (one extended for waiting pins in Test flow, one updated for arriving at a test start) and `npm run format:check` pass.
- Starting a walk from each of the board's frames: in the app's Test flow and in the public example, every frame with yarn has a working way onward or back. Back and Close return to the board or Home, because a walk that starts away from an entry arrives along its authored route. No frame on the board is without a way onward.
- App board, measured in the browser at fit (36%), 46%, 59%, 75% and 100%: no label or way-back note covers a frame, a title tape or another label; no post-it covers a title; the words of planned frames keep clear of waiting pins.
- Site, at actual Chromium tab zoom of 125%, 150%, 200% and 250% in 1440×900 and 1280×720 windows, plus a 390×844 phone window: home, guide, example and 404 pages (36 checks) have no page scroll or horizontal overflow, no text under 12px, a visible scroll hint wherever a panel scrolls, and no example label or note over a frame. At every zoom the example walks Home → Guide → Home with its controls reachable. No browser errors.
- Example walks: every page has its way back (Guide and the example demo return Home; App outline and Planning return to the board; each dialog closes to the board); P6's Close waits beside the drawing until it is placed.
- Site exporter and staging tests pass (`node --test`); staging includes the 404 page and still excludes repository notes and tools.
- The user's data was only written once, through the app's API (revision 219 → 220, backup kept outside the repository). Screenshots and the example came from a copy of the data on a separate port. Servers and test browsers were stopped afterwards. The development server now ignores test reports, build output and board data, so a build or a test run (32 browser workflows) caused no reload of the board open in it.
