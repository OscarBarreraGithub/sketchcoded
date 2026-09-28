# Sketchcoded usability pass — 2026-09-08

Historical acceptance record for the Sketchcoded rename and usability improvements. Current product status is in `PROGRESS.md`.

## Requested changes

- [x] Rename the product to Sketchcoded without disrupting existing saved projects.
- [x] Fix clipping and awkward layout when the browser is zoomed in.
- [x] Add an understandable text/directory outline alongside the visual board, without overwhelming yarns.
- [x] Simplify board movement and add a draggable zoom slider.
- [x] Make every control easy to click; use consistent field sizes and readable text.
- [x] Remove awkward nested scrolling for long form text; clarify the data/info field.
- [x] Support pins linking to detail/zoomed-in sketches, distinct from app navigation.
- [x] Explain what Review flow checks and what the user does with its findings.
- [x] Make screenshot usage obvious, with a way to locate its existing placements.
- [x] Verify real browser zoom, layout, outline navigation, detail semantics, legacy persistence and exports.

## Implementation choices

- Retain the established tactile visual style. Use one scroll area per dialog, auto-growing text areas, explicit 48px field heights, and at least 44px primary control targets.
- A text outline lists each screen once, with expandable pins and destinations. Shared destinations and loops are links to existing entries, so cycles never generate an infinite nested tree.
- A detail pin references a sketch without adding an app transition or advancing preview history. Dedicated detail sketches are excluded from app reachability/dead-end checks, while missing references and accidental navigation to details are still diagnosed.
- Keep `.drawcode/` and existing client/storage identifiers for compatibility. Update displayed branding, package metadata and new export filenames. Old project ZIPs continue to import.
- Verify actual Chromium tab zoom with an isolated test extension, alongside regular UI tests.

## Verification evidence

- `npm run build`: TypeScript and production build pass.
- `npm test`: **49** domain, navigation, storage and API checks pass, including legacy project parsing, detail separation, reference cycles, deletion repair and acceptance stability.
- `npm run test:ui`: **13** browser workflows pass. The review and native-zoom cases also passed after the final review typography adjustment. Original folder import, graph editing, preview, undo, persistence, review decisions and export/import remain covered. New checks cover outline destinations and search, preservation of panned/zoomed views, detail intake from the outline and board attachment, nested detail preview, ZIP round trips, screenshot usage filtering, and slider/scroll navigation.
- Actual Chromium browser zoom: 125%, 150%, 200% and 250%, checking horizontal bounds, 48px uniform dropdowns, growing long screen and connection notes, visible close/save controls, review access, library drawer and board slider. Native zoom screenshots use CDP capture without viewport overrides.
- Visual inspection: updated board, outline, screen/pin editors, connection form, review panel, preview, plus library and editor at 390px. Walkthrough reported no browser runtime errors. Reviewed original brief alongside this checklist; the future agentic workflow remains deferred.
- `npm run format:check` and `git diff --check` pass. The verification server was stopped after the checks.
- User projects and original image files were preserved. The app name changed without a storage migration.
