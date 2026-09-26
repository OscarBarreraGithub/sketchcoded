# Development decisions

## 2026-09-07 — Foundation

User delegated implementation choices and requested that significant decisions be recorded.

- **Local web application:** React + TypeScript with an Express server and Vite development middleware, bound to loopback. One command starts the app. No provider keys or hosted infrastructure.
- **Images are immutable snapshots:** Import and normalize image orientation on the local server; retain assets independently of their source folder. Refreshing a folder adds changed image versions to the library. Existing screens retain their chosen image and pin alignment.
- **Projects are portable:** Store versioned JSON and assets in `.drawcode/`, with atomic project saves and revision conflict detection. Export a ZIP with JSON, images, diagnostics, and a reading guide; import that bundle into a new local project.
- **Conditions stay natural language:** A short branch summary supports readable yarn labels and preview choices; separate fields capture conditions, detailed logic, and data passed to reusable views. The application does not execute prose or claim to prove its completeness.
- **Review findings carry evidence:** Graph issues have stable identities and scoped evidence fingerprints. Accepting an intentional exception requires a reason. Changes to relevant evidence reopen the concern. Structural corruption cannot be waived.
- **Navigation has explicit semantics:** Push, replace, reset, modal, back, and dismiss are authored transition types. Rewind in the preview is a testing control and is never counted as an app escape route.
- **UI verification fallback:** The browser skill was read, but this session exposes neither the required browser JavaScript tool nor a tool-discovery tool. Use standalone Playwright for local automated browser verification if those tools remain unavailable.

## 2026-09-07 — Final product choices

- **Folder refresh is polling:** Connected folders are checked every 20 seconds; manual refresh is immediate. A cache avoids decoding unchanged files again. This works without relying on browser-specific persistent folder permissions or filesystem watcher behavior.
- **Image normalization:** Apply EXIF orientation, retain the first frame/page, cap the longest side at 4096 pixels, and store WebP snapshots. Identical normalized content is deduplicated. Original files remain untouched. This trades original-file fidelity for dependable image display and portable bundles; limits are documented in the README.
- **Graph export has two reading modes:** Include canonical JSON plus JSON Schema, and a generated `flow.md` grouped by screen, pin, and branch. Include asset files and review evidence. Future agents can traverse IDs mechanically while reading intent in context.
- **Conservative review:** Acknowledgments of reachability/return concerns depend on topology because an indirect route can change elsewhere in the board. Branch acknowledgments depend on the branch semantics. Neither viewport changes nor yarn recoloring invalidate navigation decisions. Runtime state and prose predicates remain explicitly unverified.
- **A real navigation simulator:** The preview maintains page/modal history and supports nested dialog dismissal. Choosing a non-entry screen is allowed as a clearly labeled test entry. Missing history produces an actionable message. Test rewind restores a simulator snapshot independently of the authored app graph.
- **Reversible authoring:** Include local undo/redo with typing/drag grouping and preserve the viewport across content undo. Deletions remove associated graph records together. Assets are kept to protect other boards, backups, and undo; automatic garbage collection is deferred.
- **Single-process local storage:** JSON files with atomic rename, a previous-version backup, serialized writes, and optimistic revision checks. A single app server owns a data directory. No multiuser or multi-server storage protocol is included.
- **Usable controls:** Native HTML yarn-label buttons provide keyboard access. Multiple yarns from the same pin to the same destination are drawn with separate curves. A paper title can also be selected as a destination while connecting.
- **Validation:** Standalone Chromium/Playwright was used because the required in-app browser execution tool was unavailable. Automated UI tests use an isolated server and data directory. Original brief reviews were performed during setup, after the main implementation, and during final acceptance.

## 2026-09-08 — Sketchcoded and usability feedback

- **Product name:** Sketchcoded, as chosen by the user. Displayed branding, package metadata, favicon and new export filenames use it. Existing `.drawcode/` data, the `DRAWCODE_DATA_DIR` environment variable, browser preference key, internal drag type, and local request header remain compatible. Domain ownership does not entail deployment in this pass.
- **Two ways to understand the flow:** The board retains the paper, pins and yarn. The app outline lists each screen once, with expandable pins and branch descriptions; destination links handle shared screens and cycles without recursive duplication. It offers searching, editing and centering a sketch on the board.
- **Board interaction:** Drag blank space to pan, drag a sketch to move it, scroll to zoom around the pointer, Shift+scroll to pan. Space/middle-drag still provide temporary panning. The persistent hand/pointer switch is removed. A native range slider provides pointer and keyboard zoom. Cmd/Ctrl wheel remains available for browser zoom. New sketches added by a click are placed after existing sketches instead of overlapping them.
- **Readable controls:** Explicit 48px field heights and 44px control targets; auto-growing notes; one scrolling content region per dialog with its heading/close button visible. Narrow screens move the library into a drawer and stack editors. Short viewports allow outer page scrolling instead of clipping workspace controls. Yarn hit areas sit behind paper cards so they cannot steal screen clicks.
- **Detail references:** A pin can point to a supporting/enlarged sketch, independently of navigation. Optional version-1 pin fields (`kind`, `detailTarget`) and a `detail` screen role represent this. An otherwise unused regular target becomes a detail; an existing app screen retains its role. References never satisfy a path or return check. Preview opens the reference without changing app history or the step count. Invalid references and accidental app transitions involving dedicated details remain review findings. Reference-only cycles need a connection from an app sketch; deeper detail browsing has separate breadcrumbs. Adding illustrations does not invalidate navigation acceptance.
- **Clearer status and review:** Library usage counts expand to locate existing placements, with used/unused filtering. Review flow explains missing paths, unreachable screens, return paths and reasoned exceptions. The context field is labeled “What data or information is needed?” while its stable JSON key remains `context`.
- **Verification:** Continue using standalone Playwright because the browser skill’s required execution/discovery tools are unavailable. A localhost-only test extension sets actual Chromium tab zoom; it is never shipped as part of the app or installed in the user’s browser. User projects are not test fixtures.

## 2026-09-08 — No idle servers or browsers

User preference: do not leave local development servers or Chrome/test-browser processes running between tasks. Start only when directly needed, close browsers and stop servers in cleanup paths, and verify that their children and listeners have exited before handoff. Keep a process running only when the user explicitly requests it. The previously retained Sketchcoded development server has been stopped; saved projects remain on disk.

## 2026-09-25 — Planning stage, planned frames, and web + mobile layouts

The user asked for a desktop-only scope, a planning stage that feeds the drawings, two layouts per screen, and a first real board that plans Sketchcoded itself. Details are in `docs/PLANNING_PASS.md`.

- **Desktop only:** Input is image files on this computer. No phone capture; the HEIC question is closed. The compact layout for narrow browser windows stays.
- **Ideas are project data:** `ideas[]` joins the version-1 schema as an optional array (legacy files parse with an empty list). An idea records a title, details, the screen it belongs on, the pin it became, and the screen it leads to. Placing an idea creates the pin from its text and, when it leads somewhere, a draft `push` (or `modal`) transition. Moving a placed idea removes its pin, undoably, so the idea can be placed again. Deleting a pin or screen unlinks its ideas instead of deleting them.
- **Planned frames:** A screen may have `assetId: null` until it is drawn. It keeps a layout, purpose, type and ideas, appears as dashed paper listing its ideas, and takes a drawing by drop or by choosing one in its editor. The checker reports `needs-drawing` and skips dead-end and reachability findings for it until then; other errors still apply. Pins need a web drawing.
- **Two drawings per screen:** `mobileAssetId` on the screen and `mobile: {x, y}` on the pin. Pins are anchored on the web drawing first; the mobile position is a second placement of the same pin, so yarn is authored once. `mobile-pin-missing` is a waivable warning. The editor shows both drawings side by side; the board card shows a phone thumbnail; Test flow toggles layouts and lists pins not yet on mobile so a path is never lost.
- **Two readings of the plan:** The Planning view (cards, folders per screen, a pool) and `planningOutline()` (markdown with `[x]`, `[ ]`, `( )` markers and planned threads). The outline is copyable in the app and included in `flow.md`, so a conversation about the plan and the export use the same text.
- **Dogfooding:** The first real board is `Sketchcoded`, seeded with ten planned frames and the functionality backlog from the brief, the README and the conversation. `docs/FUNCTIONALITY.md` mirrors that backlog for the future website.
- **Agent routine for planning:** keep the backlog current from the user’s ideas, propose screen assignments when asked, move ideas on request, and read or share the plan through the outline. Recorded in `AGENTS.md`.

## 2026-09-25 — Readability on a planned board

The first real board (Sketchcoded, ten planned frames and seventy ideas) was unreadable: every planned frame listed its ideas in handwriting and every planned idea drew its own dashed thread and label.

- **Cards summarize, editors list.** A planned frame shows only how many ideas it holds. The ideas themselves live in the frame’s editor, in Planning and in the outline, where there is room to read them.
- **One planned thread per frame pair.** Threads are grouped by source and destination; the label shows the idea title for a single idea or a count, with the titles in the tooltip. The real yarn is unchanged.
- **The selected view is filled.** The active tab in the Board / App outline / Planning switch uses the green fill so the current view is obvious at a glance.
- **External links are endings.** A landing-page button that leaves the site (GitHub, another project) is modeled as a terminal frame with a purpose, so the review understands the exit instead of flagging a dead end.

## 2026-09-25 — Workstation pass: the app as drawn

The user's second drawing is the workstation itself, and the third is the screen editor. Both are direct feedback on the app, so they were built rather than only planned.

- **Library in two sections.** New sketches first, Used below; a sketch moves to Used the moment it lands on a frame. The usage filter is gone.
- **Ideas beside the library.** A compact panel of what is still left to do, grouped by screen, with an agent box. No model is connected; anything typed there is saved as an idea in the plan and the panel says so. The Plan tab keeps the full view.
- **One drawing at a time in the editor.** A Web / Mobile toggle swaps the image, as drawn, replacing the side-by-side stages. Pins not yet on mobile wait in a strip under the mobile drawing.
- **Pins list, colors and labels.** The screen details list every pin with move and delete; a pin has one of four colors and the board says what each color means.
- **Resize on the board.** Drag a frame's corner; the slider in the editor still works.
- **Home marker.** Entry frames carry a small house so the start of the flow is visible.
- **Links are pins.** An external destination is a link pin with the address in its description, never a frame. GitHub and the projects link on the landing page were converted, and the two external frames removed.
- **Layout stability is a rule.** Dialogs keep a fixed size while their content scrolls; selecting a pin no longer changes the editor's height. Recorded in `AGENTS.md` so it applies to everything built from a board.
- **The landing page is its own repository.** `../sketchcoded-site` is static HTML with the copy from the drawing, a guide page, and one file of external addresses. Publishing to GitHub needs the user's choice of name and visibility.

## 2026-09-25 — No agent box in the UI

The drawn agent conversation box was built as a stub that saved typed notes as ideas. The user judged it clutter without a model behind it and asked for its removal. The Ideas panel stays; ideas are added in Plan. Any future agent integration starts from the export, not from a chat box in the workstation.
