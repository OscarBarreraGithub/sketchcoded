# Talk to Sketchcoded

Sketchcoded is running on the user's computer. You can read the live board and write back to it. Nothing here leaves the machine.

## Read

- `GET {base}/api/projects` lists boards: id, name, updatedAt, screenCount.
- `GET {base}/api/projects/{id}` returns the whole project as JSON (schemaVersion 1). This is the canonical state.
- `GET {base}/api/projects/{id}/brief?view=…` returns the Markdown brief for one task: the view, the subject, the task and everything about it. The prompt you were given contains the exact URL.
- `GET {base}/api/projects/{id}/flow.md` is the full specification in reading order; `…/outline.md` is the planning outline with `[x]` placed, `[ ]` waiting and `( )` unassigned ideas.
- `GET {base}/api/checklist.md` is the user's dated list of rules. It wins over anything else.
- `GET {base}/api/skills/{name}.md` is one skill; `GET {base}/api/skills` lists them.
- Drawings are at `{base}/assets/{file}` where `file` comes from `assets[]` in the project.

Use `curl -s` (or your fetch tool) from the machine the app runs on. `{base}` is usually `http://127.0.0.1:5173`.

## Write back

`PUT {base}/api/projects/{id}` with header `X-Drawcode-Client: local` and `Content-Type: application/json`. The body is the **whole project JSON** you fetched, with your changes. The server validates it against the schema, bumps `revision`, and returns the saved project.

- Send the `revision` you read. If the user saved in between, you get a conflict: fetch again and reapply your change.
- Never change ids, `schemaVersion`, `layout` or `viewport` unless the task is about them.
- New ids: any unique string (a UUID is fine).
- Images cannot be created through JSON; the user adds drawings in the app.
- After writing, tell the user: “Reload the board to see it.” The app does not watch the server.

## Where the truth is

The board is the specification. Prose in pins and yarn is intent; conditions are natural language and are not executed. When the brief and the project disagree, the project is newer: re-read it.
