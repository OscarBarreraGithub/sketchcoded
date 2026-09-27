# Talk to Sketchcoded

Sketchcoded is running on the user's computer. You can read the live board and write back to it. Nothing here leaves the machine.

## Read

- `GET {base}/api/projects` lists boards: id, name, updatedAt, screenCount.
- `GET {base}/api/projects/{id}` returns the whole project as JSON (schemaVersion 1). This is the canonical state.
- `GET {base}/api/projects/{id}/brief?view=…` returns the Markdown brief for one task: the view, the subject, the task and everything about it. The prompt you were given contains the exact URL.
- `GET {base}/api/projects/{id}/flow.md` is the full specification in reading order; `…/outline.md` is the planning outline with `[x]` placed, `[ ]` waiting and `( )` unassigned ideas.
- `GET {base}/api/checklist.md` is the user's general rules, the ones that hold for everything they build. It wins over anything else. What the user decided for this board in particular is in the board itself: its backlog, its pins' words and its accepted findings. Do not carry one board's decisions into another.
- `GET {base}/api/skills/{name}.md` is one skill; `GET {base}/api/skills` lists them.
- Drawings are at `{base}/assets/{file}` where `file` comes from `assets[]` in the project.

Use `curl -s` (or your fetch tool) from the machine the app runs on. `{base}` is usually `http://127.0.0.1:5173`.

## Create a board

`POST {base}/api/projects` with header `X-Drawcode-Client: local` and body `{"name": "<project name>"}` returns the new board (note its `id`). What to write into it, at which level, is the skill start-a-board. A board is one project: name it after the codebase or product it describes. All boards live in the running app's data folder, side by side; the user switches between them in the Boards menu. To keep a copy inside a codebase, the user exports a ZIP from the app (or you read `GET {base}/api/projects/{id}` and `flow.md`).

## Write back

`PUT {base}/api/projects/{id}` with header `X-Drawcode-Client: local` and `Content-Type: application/json`. The body is the **whole project JSON** you fetched, with your changes. The server validates it against the schema, bumps `revision`, and returns the saved project.

- Send the `revision` you read. If the user saved in between, you get a conflict: fetch again and reapply your change.
- Never change ids, codes (`code` on frames, sketches and ideas), `schemaVersion`, `layout` or `viewport` unless the task is about them. New frames, sketches and ideas may be sent without a `code`; the server assigns the next one.
- New ids: letters, digits, `-` and `_` only, at most 100 characters (a UUID is fine). Anything else fails validation for the whole `PUT`.
- Images cannot be created through JSON; the user adds drawings in the app.
- **Write once, at the end of the task**, not after every small change. The browser autosaves the user's edits a moment after they make them, with the revision it last saw; every `PUT` of yours moves that revision, so an edit the user makes between your write and their reload is refused as a conflict. Before you write, say so: “I am about to update the board; please pause editing until it refreshes.” The open board picks up your change within a few seconds when the user has nothing unsaved (panning and zooming do not count), and says “Updated from your agent”; if they were mid-edit, it asks them to take the newer copy or export their work first. After writing, confirm: “Done. The board should have refreshed; reload if not.”

## Where the truth is

The board is the specification. Prose in pins and yarn is intent; conditions are natural language and are not executed. When the brief and the project disagree, the project is newer: re-read it.
