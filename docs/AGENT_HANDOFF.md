# Handing a task to the agent

Rule (2026-09-26): every view can hand its task to the agent. Wherever the user works, one button, **Tell the agent**, copies a generated prompt to the clipboard and shows it for manual copying and editing. The prompt names the view, the exact subject and where the instructions are, and points the agent at the running app's local API so it reads the current state instead of asking.

Nothing is hand-written. Three registries in `shared/agent.ts` generate everything:

## Views

A **view id** names where the user is. Each view has a label and the skills its task needs.

| View id             | Label             | Where the button is                                                                                                                  | Subject the prompt names                                            |
| ------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| `board`             | Board             | View toolbar, beside Sketch library (Board tab only); an icon in every frame's footer on the cork                                    | the whole board; one frame (as `screen-editor`)                     |
| `screen-editor`     | Screen editor     | Editor toolbar, beside Add a pin; the Detail view's actions                                                                          | the frame; the selected pin; the layout; the idea being placed      |
| `connection-editor` | Connection editor | Dialog actions, beside Cancel                                                                                                        | the yarn (or a new yarn from its pin)                               |
| `plan`              | Plan              | Plan header beside Copy as text; each frame's folder; each idea card; the Ideas panel                                                | the whole plan; one frame's ideas; one idea                         |
| `outline`           | App outline       | Outline header beside Expand screens; each screen's actions                                                                          | the whole outline; one screen                                       |
| `review`            | Review flow       | Review heading; inside each finding                                                                                                  | all open findings; one finding                                      |
| `test-flow`         | Test flow         | Footer, beside Rewind test                                                                                                           | the current screen and the trail of yarn taken                      |
| `library`           | Sketch library    | Library heading, beside the import button (icon)                                                                                     | the sketches, used and unused, and the frames still waiting         |
| `boards`            | Boards            | The landing page's Start a board, and the Boards menu, “New board with your agent”; its brief is `/api/brief?view=boards` (no board) | a new board for another project: create it and write its first plan |

Every brief additionally requires `verify-the-result`: the agent checks the rendered board and delegated pages while authoring, and the finished site while implementing. The full checklist must pass; the report names tested views, window sizes, real browser zooms and any remaining failures. Structural Review flow is a separate check.

## Codes

Everything the user and the agent talk about has a short code, given once and never reused: frames **P1, P2, …**, sketches **S1, S2, …**, ideas **I1, I2, …**. A pin is named by its frame and its number on that frame, **P3 pin 2**, which is what the board and the editor show. Codes are stored in the project (`code` on screens, assets and ideas; `withCodes()` in `shared/model.ts` assigns missing ones on the server and in the app) and appear on the frame footers, the library, the outline, the plan folders and idea cards, the editor title, Test flow, the yarn editor, `flow.md`, the planning outline, and at the front of every prompt and brief.

## Context

A **context** is `{ view, screen?, pin?, layout?, transition?, idea?, finding?, trail? }` (`contextSchema`). It is what the button knows about what the user is looking at. The same context is the query string of the brief URL, so the agent can fetch exactly that.

## Skills

A **skill** is one instruction document in `docs/skills/<id>.md`, served at `/api/skills/<id>.md`, listed at `/api/skills`, and shipped in every export under `skills/`.

| Skill id              | What it covers                                                          | Used by                         |
| --------------------- | ----------------------------------------------------------------------- | ------------------------------- |
| `talk-to-sketchcoded` | Read the live board and write back through the local API                | every view                      |
| `read-a-board`        | What screens, pins, yarn, ideas and findings mean                       | every view                      |
| `verify-the-result`   | Rendered acceptance and evidence at both stages                         | every brief and exported builds |
| `build-rules`         | The user's layout and interaction rules (short form of the checklist)   | board, screen editor            |
| `start-a-board`       | The three build levels for a new board and how to write for the builder | boards                          |
| `describe-pins`       | Write what each pin does, from the plan, and tie its yarn               | screen editor                   |
| `connect-screens`     | Yarn: navigation kinds, conditions, fallbacks, history                  | connection editor               |
| `plan-the-backlog`    | Ideas: assign, move, answer what belongs on a frame                     | plan, outline, library, boards  |
| `resolve-findings`    | What each review rule means; fix the board or accept with a reason      | review                          |
| `walk-the-flow`       | Follow a Test flow trail and find the first missing step                | test flow                       |

## What the agent reads from the running app

All `GET`, all local only, all Markdown unless noted:

- `/api/projects/:id/brief?view=…&screen=…&pin=…&layout=…&transition=…&idea=…&finding=…&trail=a,b` — the brief for one task: the task, the skills to read, the frame (drawings, pins, yarn, ideas, findings) or the yarn, the plan, the outline, the findings, or the trail.
- `/api/projects/:id/flow.md` and `/api/projects/:id/outline.md` — the whole documents.
- `/api/checklist.md` — the configured general build requirements. They take precedence. A project's own requests are in its board, not here.
- `/api/skills` (JSON) and `/api/skills/:id.md`.
- `/api/projects/:id` (JSON) — the canonical project; `PUT` it back with `X-Drawcode-Client: local` to change the board (see `talk-to-sketchcoded`). The open board checks for changes every few seconds and on focus; when it has nothing unsaved (or only moved its viewport) it takes the newer copy and says “Updated from your agent”. Real unsaved edits still get the conflict banner, now with “Take the newer copy”. The agent writes once at the end and warns the user to pause editing until then.
- `/assets/<file>` — the drawings.

## The prompt

```
Sketchcoded task · P1 pin 2 “Read more” on “Home” (pin-landing-guide) · Screen editor · board “Sketchcoded”
Read this brief first and follow it; it holds the task, the skills to use and my rules: http://127.0.0.1:5173/api/projects/<id>/brief?view=screen-editor&screen=home&pin=<pin>&layout=web
Anything I add below this line is part of the task.
```

Three lines, and only the address changes from view to view. The brief (`agentBrief`) is the instruction file: the task (`defaultTask`, aware of the state of the subject: a pin that is described but has no yarn gets a different task from an undescribed one, a link pin from a detail pin, a planned frame from one left to the AI), the skills to read, the user's rules, and the slice of the board the view is about. There is no task box: the user types what they want under the prompt in their agent's chat, and the brief says that text is part of the task.

## Build levels for a new board

The Boards view (landing page and Boards menu) and an empty board carry a `mode` chosen in the dialog with a three-position switch; the brief address carries it (`/api/brief?view=boards&mode=frames`) and the brief lists the exact shapes to write.

| Level                        | `mode`   | The agent writes                                                                                                                                           |
| ---------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Just the list                | `list`   | Ideas in the pool (`screenId: null`), each detail starting with the screen it belongs on. No frames, no strings.                                           |
| Frames and strings (default) | `frames` | Planned frames with layout, ideas assigned, and for every idea that leads somewhere a provisional pin (`provisional: true`, slot positions) with its yarn. |
| Built out                    | `built`  | Frames and strings, then `leftToAi: true` on every frame; the user takes the post-it off the frames they draw themselves.                                  |

The skill `start-a-board` holds the levels and the writing rules for the builder (purposes without stage notes or disclaimers; ideas that are things on a screen, not checklists).

## Adding a view or a skill

1. Add the id to `viewIds` or `skillIds` in `shared/agent.ts`; give it a label and skills, a subject in `describeSubject`, a task in `defaultTask`, and a section in `agentBrief`.
2. For a skill, write `docs/skills/<id>.md` starting with `# <title>`.
3. Place `<TellAgent project={project} context={{ view, … }} />` where the user works in that view.
4. `tests/agent.test.ts` checks the registries against the files; `tests/e2e/agent.spec.ts` clicks every button, reads the clipboard and fetches every brief.

## Reviewer's checklist

- Every view in the table has its button where the table says, and the prompt names the right subject.
- Every brief URL in a prompt returns Markdown with `## The task`.
- Every skill in the registry has a file, and the export contains `skills/`.
- The help dialog, `README.md`, `docs/FUNCTIONALITY.md` and the site guide describe the feature the same way.

## Other machines and ports

Use the address in the copied prompt; do not assume port 5173. The brief generates its own links from the running app. Board IDs are local project data, not repository constants. Discover boards through the boards brief or `/api/projects`; never depend on a maintainer board name or ID. See the README for `--port`, `--data-dir` and transfer between machines. The local API needs no hosting account or model key.
