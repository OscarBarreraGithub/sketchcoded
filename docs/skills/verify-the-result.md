# Verify the result

The full user checklist at `/api/checklist.md` (or `BUILD-CHECKLIST.md` in an export) is a completion requirement for both workflows below. Read every item. This is agent-led verification, not a claim that Review flow detects visual defects.

## When working on a board

Open the affected views in the running app after the final write. Inspect the board, changed pins and notes, Plan/outline as relevant, and walk affected journeys in Test flow. For every affected frame left to the AI, inspect the actual standard page that Test flow renders, including fields, cards, long copy, dialogs, branches and ways back. Do not assume a frame is usable merely because it has `leftToAi: true`.

When creating a board, check all its frames and rendered pages. When changing one subject, inspect that subject and the views and routes it affects. Do not redesign the user’s drawings or invent routes to satisfy a check. An undrawn frame not left to the AI stays open backlog.

## When building a site or app from a board

Read `project.json`, `flow.md`, this skill and the full checklist. Implement the drawings and authored navigation; for delegated frames, use the standard-page outline in `flow.md`. Open the built result and check every page, state, dialog and route you implemented. Test real interactions and narrow windows as well as screenshots. Carry incomplete planned frames forward as open items.

## Browser acceptance

Use actual browser tab zoom at 125%, 150%, 200% and 250%, at both 1440×900 and 1280×720 window sizes. A smaller CSS viewport is useful for finding bugs but is not the final zoom check. Inspect each affected view at every size and zoom. Check the whole checklist, including:

- No overlapping, clipped or unreadable text, labels, controls or pins. Text is at least 12 screen pixels or deliberately steps aside on a distant canvas.
- Dialog and panel size stays stable when selection, tab or content changes. Long notes remain readable.
- Controls stay reachable, click targets are at least 44px and fields at least 48px. The main workspace retains useful room at high zoom.
- The shell fits the window. Panels scroll inside it with visible scrollbars and “More below” hints until the end. The document does not scroll.
- Canvas pan and zoom keep content in reach. Test extremes, selection, returning to the overview and switching views.
- Authored Back, Dismiss and reset work as specified; Rewind test remains a separate testing aid. Plain-language conditions are chosen by the tester, not executed or proved.

Measure bounding boxes, overflow and control sizes, and inspect screenshots for collisions that measurements miss. Run the relevant build, tests and formatting checks when changing code. A text-only task does not require launching a browser unless it changes rendered content.

## Finish honestly

Record what you tested, sizes and zooms, results, and remaining failures. Correct defects within the authorized scope. If the app renderer blocks a board task, report the exact defect and affected view; do not hide it by accepting a graph finding or claiming verification passed. A corrective board write after verification is allowed when needed: reread the latest revision, warn the user, write the correction and verify again.

Review flow checks references and structural navigation. It does not inspect pixels, evaluate prose conditions, implement application backends or replace these browser checks. Stop task-owned servers and browsers before handing back unless the user asked to keep them running.
