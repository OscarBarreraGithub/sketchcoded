# Product progress and handoff

Last updated: 2026-09-07 (America/New_York)

## Current state

- The workspace was empty and was not a Git repository when inspected.
- No applicable AGENTS.md was found in the workspace or its ancestor directories.
- The original request is saved in [ORIGINAL_BRIEF.md](ORIGINAL_BRIEF.md).
- The user authorized autonomous completion and delegated development decisions. An active goal tracks completion of the full brief.
- The application is implemented and running at http://127.0.0.1:5173. The complete acceptance and verification pass has finished.
- Major implementation choices are recorded in [DECISIONS.md](DECISIONS.md).

## Objective

Build and verify every in-scope item in the original brief: a useful local screenshot flow designer with a tactile bulletin board, annotated interaction pins, branching yarn connections, reviewable graph diagnostics, and a sketch-based interactive preview. Leave the agentic generation/review workflow for later.

## Implemented defaults

- A desktop-oriented localhost web application with a small local server and React/TypeScript frontend. Single-user and local persistence for the first version.
- Connect a local screenshot folder to the library; also support importing individual image files. Keep saved boards usable if source files move. Source-image updates must not silently invalidate pin placement.
- Persist projects and image assets on disk. Support a versioned, readable JSON graph export with referenced images for future LLM use.
- Keep the tactile cork, paper, pins, and yarn visual treatment functional: images remain legible, connections remain selectable, and zoom/pan remains easy.
- Use a small bundled chat example so authoring, conditional routing, diagnostics, and preview can be tested without waiting for user images.
- No hosted deployment, accounts, collaboration, or LLM provider integration in this first version.

## Acceptance checklist

### Repository and continuity

- [x] Save the original prompt as Markdown.
- [x] Create a durable progress and handoff document.
- [x] Initialize the repository and runnable app.
- [x] Document setup, persistence, data format, and known limitations.
- [x] At each milestone, review work against the original brief and update this file with evidence and the next action.

### Library and board

- [x] Connect a local screenshot folder and display image thumbnails in a panel.
- [x] Import images by file selection/drop; handle unsupported or missing files visibly.
- [x] Drag library images onto a spacious, pannable workspace and reposition them.
- [x] Animate placement with decorative tacks; respect reduced motion.
- [x] Require a screen title and show it on a paper label; allow renaming.
- [x] Offer clear zoom in/out, reset, and fit controls.
- [x] Save and reload screens, board layout, annotations, edges, and images.

### Pins and yarn

- [x] Open a screen to place, edit, move, and delete pins on the image.
- [x] Give each pin a high-level description of the intended interaction.
- [x] Return to the board and connect a pin to a destination screen using yarn.
- [x] Allow one pin to have multiple outgoing connections.
- [x] Select a yarn to edit its short branch summary and detailed behavior/conditions.
- [x] Support deleting or reconnecting connections without orphaning graph references.
- [x] Preserve pins consistently across display zoom using normalized image coordinates.

### Graph and checks

- [x] Define a versioned graph with stable identifiers for screens, pins, and transitions; separate layout from behavior.
- [x] Preserve free-text intent and logic, structured branch summaries, entry screens, and navigation semantics without claiming to execute natural-language conditions.
- [x] Provide graph and asset export suitable for later LLM consumption.
- [x] Detect broken references, missing required descriptions, unconnected pins, unreachable screens, possible dead ends, and return-path concerns.
- [x] Distinguish definite structural errors from potential navigation concerns and semantic questions requiring review.
- [x] Handle login/onboarding, terminal screens, alternate entry points, dialogs, history, and conditional branches without requiring a reverse edge for every transition.
- [x] Offer issue-by-issue acceptance of intentional exceptions with a saved reason; never silently dismiss a concern based only on a screen name.
- [x] Invalidate accepted exceptions when the relevant evidence changes; keep decisions scoped to individual findings.
- [x] Include meaningful tests for graph integrity, reachability, conditional caveats, navigation/history, and exception lifecycle.

### Interactive sketch preview

- [x] Enter preview from a chosen entry screen and show the sketch with clickable pins.
- [x] Follow a single connection directly.
- [x] For multiple outgoing connections, show a chooser with branch summaries and conditions, then follow the selected branch.
- [x] Show helpful behavior for pins with no destination.
- [x] Support restart/exit and intentional navigation/history semantics.
- [x] Clearly distinguish preview-player controls from navigation authored in the app so preview does not hide missing escape routes.
- [x] Verify a complete chat example with normal and blocked-user branches, including return paths and intentional one-way login.

## Graph-review design notes

A directed multigraph is the baseline: screens are nodes; pins are screen-local interaction anchors; transitions connect pins to destination screens. Multiple transitions may share a pin and destination. A screen can represent a reusable view such as a conversation; transitions may describe selected data/context without creating a separate node for each user.

Do not enforce strong connectivity or require a reciprocal edge for every transition. There can be an indirect return path, an authored history-back action, dismissal to a caller, an intentional terminal state, or a context-changing transition such as authentication. A history reset after login may be correct. Multiple entry screens can also be legitimate.

Structural reachability is not proof of runtime reachability when guards are written in natural language. Treat conditional edges as possible paths and surface uncertainty. Similarly, a graph cycle does not guarantee that a return route is available in every state. Flag missing branch summaries/fallback decisions for review without claiming free-text branches are exhaustive or mutually exclusive.

Separate stored review decisions from graph content. Each accepted concern needs its rule, subjects, relevant evidence signature, reason, and attribution. Show accepted issues and reopen them if the relevant graph context changes. Acknowledgment records an intentional decision; it does not invent missing logic.

The preview should let the user choose among natural-language branches and show the chosen branch. It should not silently evaluate conditions. Preview rewind is a testing aid; it is not evidence that the designed app has working back navigation.

## Verification approach

- Test graph algorithms and exception invalidation using focused fixtures, including intentional one-way login, unreachable nodes, blocked branches, legitimate terminal screens, and indirect return paths.
- Verify folder import, durable saves, image placement, pin editing, yarn editing, branching, diagnostics, and preview through the running UI.
- Inspect the rendered board and image editor at normal and small viewport sizes; check zoom/pan, keyboard dismissal, focus, and reduced motion.
- Run the project’s type/build checks and relevant tests. Record actual results here; do not mark an item complete based only on a plan or implementation claim.

## Next action

The original in-scope vision is complete. The app is running at http://127.0.0.1:5173 with the Little chat example. No implementation work remains for the original brief. Future work should start from user feedback or the separately deferred agentic workflow, using docs/GRAPH.md as the data contract.

## Final verification evidence

- **Build:** `npm run build` passed TypeScript checking and the production Vite build.
- **Logic, storage, and API:** `npm test` passed **40 tests** across graph diagnostics, acceptance invalidation, authored history, dialog dismissal, deletion integrity, image snapshots, atomic saves/backups, conflicting revisions, bundle round trips, and localhost API boundaries.
- **Browser:** `npm run test:ui` passed **9 workflows** against an isolated production server:
  1. Login, allowed and blocked chat branches, authored Back, restart, absent-history feedback, and independent test rewind.
  2. Real local-folder connection, drag placement, titles, pin/yarn authoring, source-image refresh with immutable existing screens, save/reload, screen deletion and undo.
  3. Intentional login acknowledgment, persistent reason, logic edit, and automatic reopening of changed evidence.
  4. Project export and import through the interface.
  5. Board dragging, zoom, fit, keyboard undo, and dialog dismissal/focus.
  6. A 700px viewport with reduced motion, authoring access, and branching preview.
  7. Pin movement and description, yarn reconnection, pin deletion, and restoration of all branches with undo.
  8. Individual file imports, visible corrupt-image notes, and honest preview feedback for an unconnected pin.
  9. Two-tab save conflicts, protection of the server version, and exporting the unsaved version for recovery.
- **Formatting:** `npm run format:check` passed. The original brief is excluded from automatic formatting.
- **Visual review:** Inspected the finished board, screen/pin editor, connection editor, issue review, branching preview, and compact editor. Final screenshots are in `docs/screenshots/`. The visual walkthrough reported **zero browser runtime errors**.
- **Original brief review:** Completed after setup, after the main implementation, and at final acceptance. Every in-scope checklist item above is satisfied. The separate future agentic workflow remains intentionally deferred.

## Handoff

- Run: `npm install` then `npm run dev`; use the existing http://127.0.0.1:5173 process while it is running.
- User guide and recovery: `README.md`.
- Important delegated choices: `docs/DECISIONS.md`.
- Portable format and checker limits: `docs/GRAPH.md`.
- Continued development instructions: `AGENTS.md`.
- User data: `.drawcode/projects/` and `.drawcode/assets/`, ignored by Git.
- Browser verification data: `.drawcode/ui-tests/`, separate from the user's boards.
- The demo intentionally starts with three review concerns so users can try the acceptance flow. These are sample design questions, not application test failures.
