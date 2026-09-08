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
