# Working on Sketchcoded

Read `docs/ORIGINAL_BRIEF.md`, `docs/PROGRESS.md`, and `docs/DECISIONS.md` before changing the product. Read `docs/USABILITY_PASS.md` for the latest user feedback and acceptance checks. The original brief is preserved verbatim. Keep the progress file and significant decisions current when the implementation changes.

This is a local screenshot flow designer. The later LLM generation/review workflow is not implemented yet. Keep screen/pin intent and natural-language branch rules intact; do not pretend to execute or prove prose conditions. Keep test rewind distinct from authored navigation.

- `shared/model.ts`: executable versioned project schema.
- `shared/graph.ts`: structural diagnostics and acceptance invalidation.
- `shared/navigation.ts`: preview history semantics.
- `server/`: image snapshots, local persistence, import/export, API.
- `src/`: React application and interaction components.

Run `npm run dev` for localhost:5173. `npm test` covers graph/navigation/storage. `npm run build` checks types and builds the frontend. `npm run test:ui` tests the built app on an isolated localhost:5174 server; build first. `npm run format:check` checks formatting.

Preserve `.drawcode/` user data. It is ignored by Git. Do not point tests at a user's production data directory. Do not run multiple app servers against the same data directory. Keep `docs/ORIGINAL_BRIEF.md` out of formatting changes.

Keep click targets at least 44px, fields at least 48px, and long notes readable without nested text scrolling. Preserve the board/outline alternatives and test zoomed browser layouts after layout changes. Detail references are illustrations, separate from app transitions; never count them as reachability or return paths. The Sketchcoded rename deliberately retains the `.drawcode/` storage path and legacy protocol keys.
