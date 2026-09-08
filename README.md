# Sketchcoded

**Ideas, connected.** A local bulletin board for turning rough UI sketches into a connected, playable app specification.

Bring screenshots or photos of your sketches into a library. Pin them to a board, describe the interactions, and connect them with yarn. Review the flow, play through the sketches, and export a project that a future implementation agent can read.

![Sketchcoded bulletin board](docs/screenshots/board.png)

## Start

Requires Node.js **22.12 or later** and npm.

```sh
npm install
npm run dev
```

Open **http://127.0.0.1:5173**. The first launch creates the **Little chat** example with four screens, conditional chat branches, an intentional one-way login, and authored Back actions. No account, API key, or external service is needed. Fonts and images are served locally.

For the built app:

```sh
npm run build
npm start
```

`PORT=5176 npm run dev` uses a different port. `DRAWCODE_DATA_DIR=/absolute/path npm run dev` chooses a different project storage directory. The server binds to `127.0.0.1`.

## Make a flow

1. **Bring in sketches.** Click **Connect a folder** and enter its absolute path. New and changed images appear every 20 seconds; the refresh button checks immediately. Alternatively import a folder once, choose individual files, or drop files onto the library.
2. **Arrange the board.** Drag a library thumbnail onto the board and give it a required title. Clicking a thumbnail also adds it. Drag cards to move them. Use the zoom controls, **F** to fit, or **Space + drag** to pan. Scroll zooms around the pointer; **Shift + scroll** pans. Drag blank space to pan without changing tools. The zoom slider also works with arrow keys. Browser Cmd/Ctrl zoom remains available.
3. **Describe an interaction.** Click a screen, choose **Add a pin**, and click the sketch. Give the pin a name and a description. Drag an existing pin to move it. Screen details let you set its purpose, type, entry-point status, and board size.
4. **Tie the yarn.** From the pin editor, choose **Connect to a screen**, close to the board, and click the destination. You can also click a numbered board pin and then a card. One pin can have many yarns. Click a yarn or its label to edit the source pin, destination, short summary, condition, detailed logic, and data passed. Back and Dismiss actions are available in the pin editor and appear below the screen on the board.
5. **Review the flow.** Open **Review flow**. Locate an issue, fix it, or accept an intentional concern with a reason. Accepted decisions remain visible, travel with the export, and reopen if relevant evidence changes. Structural errors cannot be waived.
6. **Try the sketches.** Click **Test flow**. A pin with one connection follows it directly; a pin with several connections offers a scenario chooser with descriptions. You choose the condition to simulate. Restart, change the starting screen, or rewind the test. Rewind is explicitly separate from app navigation.

**Read the app as an outline:** switch from **Board** to **App outline** for a searchable directory of screens, pins, and paths. Each screen appears once; shared destinations link to that entry. **Show on board** centers the selected sketch. Switching views preserves your board position.

**Show a closer look:** choose **Detail reference** in a pin’s **Pin purpose** field. Attach a sketch from the dropdown or choose it on the board. A regular sketch with no app connections becomes a detail sketch automatically; a screen already used in the flow keeps its role. Detail references appear as dashed olive threads and are identified in the outline. In Test flow, they open a larger illustration and return to the same app screen without advancing the test or creating a return route. You can also set **Screen type** to **Detail / enlarged sketch** for a dedicated reference.

**Find sketches already used:** each library image shows a **Used** count or **Not used yet**. Expand the count to jump to its placements. Filter the library to used or unused images. On smaller or zoomed browser windows, **Sketch library** opens the library drawer.

**Comfortable editing:** fields have consistent heights, notes expand with their text, and each dialog has one content scrollbar and a visible close button. Narrow and zoomed windows rearrange the interface; short windows allow the page to scroll so controls remain reachable.

**Undo / redo:** toolbar buttons or Cmd/Ctrl+Z / Cmd/Ctrl+Shift+Z. Deleting a screen removes its pins and incident yarns; deleting a pin removes its branches. Both are undoable. The image remains in the library.

**Boards:** the menu beside the Sketchcoded logo opens saved boards, creates a blank board or another chat example, and imports exported projects. Rename a board with its pencil button.

## Navigation that means something

Each connection has an explicit navigation action:

| Action          | Behavior in the preview                                                           |
| --------------- | --------------------------------------------------------------------------------- |
| Open screen     | Push the destination onto app history.                                            |
| Replace current | Replace only the current history entry.                                           |
| Start fresh     | Clear history and open the destination; useful after login.                       |
| Open as dialog  | Remember the actual caller and open a modal frame.                                |
| Go back         | Pop app history; report an unavailable action when no prior frame exists.         |
| Dismiss         | Close the current dialog and any pages nested inside it, returning to its caller. |

Screen types describe intent. A login label does **not** automatically excuse a one-way path. An intentional ending needs an explanation. Alternate entry points are supported. A screen can represent a reusable view, with context such as `conversationId` passed by a connection.

Checks detect broken references, missing images in the graph, missing titles/intent, unconnected pins, missing entries, unreachable screens, dead ends, possible one-way paths, uncertain history contexts, duplicate branch summaries, multiple fallbacks, and natural-language branching that needs review.

A structural return path can be indirect. Conversely, a cycle does not prove that prose conditions permit a return in every state. The checker distinguishes hard structural errors from concerns that need judgment. See [the graph contract](docs/GRAPH.md) for the precise limits.

## Your files and the future workflow

Projects auto-save after a short pause. The status beside the board menu reports whether changes have reached disk. Unsaved edits trigger a browser leave warning. Each save uses an atomic file replacement and keeps the previous version as a backup. Concurrent saves from another tab cause a visible conflict; the app does not overwrite the other tab’s work.

```text
.drawcode/
  projects/<project-id>.json      # Current board and graph
  projects/<project-id>.json.bak  # Previous saved version
  assets/<sha256>.webp           # Immutable image snapshots
```

Source folders are read only. Source changes create new library versions; screens already on the board retain their selected snapshot and pin positions. Moving or deleting source images does not break saved boards. Disconnecting a folder stops refreshing it and keeps the imported images.

**Export project** downloads a `.sketchcoded.zip` containing:

- `project.json`: the versioned canonical graph, layout, library, and review decisions.
- `schema.json`: the JSON Schema for the project format.
- `flow.md`: the same specification organized by screen, pin, branch, and review finding for a human or future agent.
- `review.json`: current findings, acceptance status, and recorded reasons.
- `assets/`: all the project’s normalized image snapshots.
- `READ-ME.md`: a guide to reading the bundle.

The Sketchcoded name keeps the existing `.drawcode/` storage directory and client identifiers so saved boards continue working. Older `.drawcode.zip` bundles still import. Local source-folder paths are omitted. Importing a bundle creates a separate board, validates the graph and image hashes, and never replaces an existing board. Export uses the current in-memory project, so it can rescue unsaved edits after a two-tab conflict while the server is running.

The agentic generation and review workflow is intentionally deferred, as requested in the original brief. No natural-language condition is executed and no code is generated from the board yet.

## Limits and recovery

- Designed primarily for desktop browsers, with a compact layout for smaller windows. Mouse/trackpad authoring is the main interaction; file selection and add buttons provide alternatives to dragging.
- Supported input: PNG, JPEG, WebP, GIF, AVIF, TIFF, and SVG. Animated or multipage images use the first frame/page. Images are oriented correctly, stripped of source metadata, and normalized to WebP at a maximum of 4096 pixels per side. Keep originals if you need their original format or resolution.
- Images: 25 MB each, 40 per upload batch. Folder sync: up to 500 images, 5,000 entries, and eight nested levels per folder; hidden files and symlinks are skipped. The UI reports skipped/unreadable files during manual import or refresh.
- ZIP import: 150 MB compressed / 250 MB expanded. Projects support up to 500 screens, 5,000 pins, 10,000 connections, and 2,000 assets within the 8 MB JSON request limit.
- The local server must be running to save, refresh folders, or export. If it stops, restart it; the visible save-error bar offers retry. Keep the tab open until it reports saved. There is no offline service worker or cloud sync.
- For a two-tab conflict, export the unsaved work, reload the tab, then import that export as a separate board if needed.
- If a project JSON is damaged, stop the server and copy its `.json.bak` over the damaged `.json`, keeping a separate copy of both first. If an asset is missing from `.drawcode/assets`, restore it from a project ZIP or filesystem backup. Source-file deletion alone does not cause this.
- Undo history is session-local. Saved review decisions and their reasons persist; resolved decisions remain available in the review history.
- There is no automatic asset garbage collection. Keeping snapshots avoids losing images that may still be needed by another board or a backup.

## Development and verification

```sh
npm test                  # Graph, navigation, persistence, API, and bundle tests
npm run build             # TypeScript and production build
npx playwright install chromium
npm run test:ui           # Real browser authoring and preview workflows
npm run format:check      # Formatting
```

Browser tests include actual Chromium tab zoom at 125%, 150%, 200%, and 250%, using a test-only extension under `tests/fixtures/zoom-extension/`. The extension is loaded only in an isolated temporary test browser.

Browser tests start an isolated built server on port 5174 and store their boards under `.drawcode/ui-tests/`. Run `npm run build` before them. The application on port 5173 and its projects are kept separate.

The shared graph and navigation code has no React or server dependency. `server/` handles local images and persistence; `src/components/` contains the board, library, editors, review panel, and preview. Original demo sketches are code-authored in `server/demo-art.ts`.

- [Original product brief](docs/ORIGINAL_BRIEF.md)
- [Acceptance and verification checklist](docs/PROGRESS.md)
- [Current usability pass](docs/USABILITY_PASS.md)
- [Development decisions](docs/DECISIONS.md)
- [Graph format and checker semantics](docs/GRAPH.md)

Implementation references: [Vite’s server API](https://vite.dev/guide/api-javascript.html), [React effects](https://react.dev/reference/react/useEffect), and [Sharp’s image operations](https://sharp.pixelplumbing.com/api-operation/).
