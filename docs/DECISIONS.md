# Development decisions

Current architectural decisions, with the dates they were introduced or refined. Product requirements are in [SKETCHCODED_REQUESTS.md](SKETCHCODED_REQUESTS.md); verification evidence is in [PROGRESS.md](PROGRESS.md).

## Local application and storage · 2026-09-07

React and TypeScript provide the frontend. Express serves the local API, with Vite middleware for development and static frontend files for the built app. The server binds to loopback. No hosted infrastructure, account or model-provider key is required.

A single server owns a data directory. Projects use versioned JSON with serialized writes, atomic replacement, a previous-version backup and optimistic revision checks. Importing a bundle creates a separate board. Concurrent editing reports a conflict instead of replacing another tab's work. Multi-server and multiuser storage are outside the current scope.

Images are immutable snapshots: imports apply orientation, retain the first frame or page, cap dimensions at 4096 pixels and normalize to WebP. Identical normalized content is deduplicated. Connected folders are polled every 20 seconds, with manual refresh and a cache for unchanged files. New source versions do not replace drawings already used by screens. Source files remain untouched; automatic asset deletion is deferred to protect other boards, backups and undo.

## Specification and review · 2026-09-07

The export contains canonical JSON, JSON Schema, images, structural findings and a readable `flow.md`. Conditions, logic and passed context remain natural language. The app does not execute prose or prove that its branches cover every runtime state.

Findings have stable identities and scoped evidence fingerprints. Intentional navigation exceptions require recorded reasons; changed evidence reopens the relevant finding. Topology affects reachability and return decisions; recoloring and viewport changes do not. Structural corruption cannot be waived.

Navigation explicitly supports push, replace, reset, modal, back and dismiss. The simulator maintains page and modal history, including nested dismissal. A non-entry screen can be chosen as a labeled test entry. Test rewind restores a simulator snapshot independently of authored navigation.

Undo groups typing and dragging and preserves the viewport across content undo. Deleting graph elements repairs related records together. Undo history is session-local.

## Branding, controls and detail references · 2026-09-08

Displayed branding and new ZIP names use Sketchcoded. The `.drawcode/` directory, `DRAWCODE_DATA_DIR`, legacy ZIP support, browser preference key, drag type and local request header retain their names for compatibility.

The outline lists each screen once, with links to shared destinations and cycles. The board supports blank-space panning, pointer-centered wheel zoom, Shift+scroll panning, temporary Space/middle-drag panning and a keyboard-accessible range slider. Browser zoom remains available. New drawings added by clicking are placed beside existing frames.

A detail pin references an illustration without adding navigation, changing app history or satisfying a return path. Dedicated detail frames are excluded from app reachability checks. Invalid references, reference-only cycles and accidental navigation into details remain findings. An otherwise unused target can become a detail; an existing app screen keeps its role.

Fields are at least 48px high, controls at least 44px, and long notes grow inside their containing panel. The later fixed-shell decision supersedes the initial short-window document-scroll layout. Native browser zoom is tested with an isolated test extension that is not shipped with the app.

## Planning and layouts · 2026-09-25

Ideas are first-class project data: title, details, assigned screen, optional destination and optional placed pin. Placing an idea creates its pin and draft transition. Moving a placed idea removes the old placement undoably; deleting a screen or pin unlinks its ideas rather than deleting them. Planned frames use `assetId: null` until a drawing arrives.

A screen may carry a web drawing and a mobile drawing. Each pin has one identity, one set of yarn and separate positions for the two drawings. Missing mobile positions are reviewable findings. The editor's Web / Mobile toggle supersedes the initial side-by-side layout. The board shows a mobile thumbnail; Test flow switches layouts and keeps unplaced pins available.

`planningOutline()` provides the same plan as copyable text and in `flow.md`. Placed ideas remain legible but subdued. Planned cards summarize their idea count; details belong in the editor, Plan and outline.

The library has New and Used sections and one intake area for drops, file selection, one-time folder import and connected-folder refresh. The Ideas panel summarizes remaining work; Plan is the editing surface. An initial chat stub was removed because no model ran behind it.

External destinations use link pins with URLs in their descriptions, no yarn and no destination frame. This supersedes the initial external-terminal-frame model. Links count as a way onward. Frames can be resized and entry screens have a home marker.

The companion marketing site is a separate static repository. Its branding and feature descriptions agree with this app; public addresses are configured in its `links.js`.

## Layout and agent handoff · 2026-09-26

The application shell fits the window at every supported size. Panels scroll internally and announce overflow with visible scrollbars and hints. Board changes go through the shared clamp so an outer frame remains visible with padding. Fit and clamp use the same bounds. Legibility floors do not enlarge canvas cards; labels hide or trim when they no longer fit.

Planned connections are read in Plan and the outline; their former dashed board lines were removed. Real provisional pins and yarn later provided a way to connect frames before drawing.

Every work view exposes a generated three-line handoff: subject, live brief URL and a line indicating that subsequent user text belongs to the task. Registries define views, contexts, skills and build levels. Briefs, drawings, the checklist and skills are served by the running app. Agents write back through the local API. Automatic refresh adopts newer board content only while local content is clean; saves and in-flight refreshes recheck for conflicts.

The shared checklist contains undated general requirements. Board semantics live in skills. Each project's own decisions remain in its graph, backlog and findings; projects do not inherit another project's history.

## Build levels, generated pages and board clarity · 2026-09-27

New or empty boards offer Just the list, Frames and strings (default), and Built out. Provisional pins carry real yarn and placeholder positions until a drawing is attached and the user places each pin.

Built out sets `leftToAi` on frames. `shared/standard-page.ts` derives a conventional prototype page from each frame's purpose, pins, ideas and role. Test flow renders its controls with the frame's authored navigation; there is no backend or model execution. A drawing takes precedence. The same page outline is exported for the builder.

Crowded boards quiet their yarn and show labels on demand. Selecting a frame emphasizes its routes and temporarily offsets connected frames by 26 screen pixels without changing stored layout. Thread categories have four initial meanings and two spare colors. Filtering dims and slightly shrinks unrelated frames in place; it preserves the board's arrangement. These intentional presentation transforms do not resize surrounding panels.

Frames use P codes, sketches S and ideas I. Legacy F codes become P with the same number when read. Allocation counters retain the highest issued number across deletion, undo and older-client saves.

The official public example is a snapshot of the authored Sketchcoded board and its original drawings. It is separate from the bundled Little chat sample. A fresh app installation needs neither the maintainer's board nor a hosting account.

## Verification and review follow-up · 2026-09-28

Every brief and export includes `verify-the-result`. Agents inspect the affected board and delegated pages when authoring, and the finished site when implementing. The full checklist applies, including real browser zoom, overlaps, control access and honest reporting of evidence. Review flow remains structural; no standalone visual checker is introduced.

Content and local actions use annotation pins: no yarn, no missing-route warning and no false exit. Delegated pages participate in reachability, dead-end and one-way checks even without drawings. Pending edits are protected on route changes and against arriving agent refreshes. The six-panel tutorial uses isolated practice state.

Short windows switch to compact toolbars so the board keeps working room at high browser zoom. Acceptance tests assert a minimum board size and maximum page bounds, not only the absence of page overflow. Generated standard pages stay inside their stage and scroll internally; Test flow keeps notices and unplaced pins in its scrolling sidebar, so selecting a pin cannot shrink the drawing.

The public demo consumes a snapshot without local source paths and shares the app's standard-page descriptions. Authored Back, Dismiss and reset are distinct from test rewind. External links, mobile positions and detail references retain their meanings.

## Portability and repository documentation · 2026-09-28

The logo is generated, not drawn: `npm run logo` (`scripts/make-logo.mjs`) trims, scales and tints the owner's drawing in `public/brand/alien-drawing.png` onto the green tile and writes `public/favicon.svg`, which is the app's header logo and favicon and is copied to the site as `assets/favicon.svg` (2026-10-01). The development server's file watcher ignores test reports, build output and board data, so a build or a test run never reloads a board open in it (2026-10-01). Bundled resources resolve from the repository location, independently of the launch directory. Default data remains in that checkout's `.drawcode/` for compatibility; explicit relative data paths resolve from the caller's working directory. Command-line options override environment variables, and `npm start` uses a cross-platform production flag. Port 0 requests an available local port. Missing export instructions fail visibly instead of producing an incomplete bundle.

Public documentation stores edited specifications and decisions rather than raw conversation transcripts or personal environment details. This supersedes the original verbatim-prompt preservation policy. Existing drawings and private data are unchanged. Cleanup uses normal commits and does not rewrite published history. Dated pass reports were folded into the current records on 2026-09-30: requirements into `SKETCHCODED_REQUESTS.md`, decisions here, verification into the `PROGRESS.md` milestones and open guide work into `CATALOG.md`.

## Curated public example · 2026-09-28

The site exporter omits isolated planned frames that have no drawing, delegated page, entry role, pin or authored connection. It keeps all authored routes and detail references, and filters the accompanying ideas, layout and assets to the included frames. This is a publication projection; the local project and backlog are preserved. The optional `--include-planned` switch exports the complete snapshot. No frame IDs or account-specific rules are embedded in the exporter.

## Words on the board, waiting pins and the public example · 2026-09-30

Yarn labels are placed, not just drawn at the curve's middle (`src/boardNotes.ts`, mirrored in the public demo): a label slides along its own yarn from the middle, and a label with no clear spot shows as a mark with its words on hover or focus. Placement uses the board's type sizes at the current zoom and never moves a frame. A way back (Back or Close) is a small ↶ mark in its frame's footer, the size of the footer's other buttons, with its words floating above it on hover or focus; clicking it in the app opens the way back. Words for ways back under each frame made the board busy, so they were replaced on 2026-10-01.

The "Leave it up to the AI" post-it never covers a title. On an undrawn frame it is part of the frame's own words, which keep left of the column where waiting pins sit; on a drawn frame it sits on the drawing below the tape. Below 80% zoom, where its handwriting would read under 16 screen pixels, it becomes a small square in the frame's top-right corner.

A provisional pin on a frame that has a drawing is still at a placeholder, so Test flow (in the app and the public demo) lists it beside the drawing as not placed yet, as it does for pins missing from a mobile drawing. The user places it in the screen editor; the review warns until then.

The public site serves a 404 page for unknown addresses instead of the homepage, and its hero image is a screenshot of the example board in the current app.

The public example opens on the board's saved viewport (its zoom and position when the author left it in the app), anchored to the board's top-left corner, instead of fitting every frame; Fit still shows the whole board. The author chooses the opening view by arranging and zooming the board, so a sprawling board can open close enough to read its yarn labels.

Starting Test flow away from an entry (in the app, or by clicking a frame in the public example) arrives the way a visitor would: along the shortest authored route from an entry, replayed with the usual navigation rules (`arrive` in `shared/navigation.ts`, mirrored in the demo). The route only sets up history, so Back and Close on that screen return where they really lead; it is not part of the test's trail, rewind stops at the start, and Test flow names the screens it arrived through. A screen that no entry reaches still starts on its own, so a missing route is not hidden.
