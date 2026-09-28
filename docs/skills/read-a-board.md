# Read a board

A board is a `project.json`. `flow.md` says the same thing in reading order. Read the brief for your task first; it already holds the relevant slice.

## Codes

Frames are `P1, P2, …`, sketches `S1, S2, …`, ideas `I1, I2, …` (the `code` field). A pin is named by its frame and number: “P3 pin 2” is the second pin listed on frame P3. Use these codes when you talk to the user; they see the same codes in the app. Never change or reuse a code. Preserve `codeCounters`, which stores the highest issued P/S/I numbers even after deletion; omit `code` only for new items so the server can allocate it.

## Screens (frames)

- `title`, `purpose` (what it is for), `role`: `screen`, `auth` (login or onboarding), `modal` (dialog or overlay), `terminal` (intentional ending), `detail` (an enlarged sketch, not an app page).
- `entry: true` means the app can start here.
- `assetId` is the web drawing; `mobileAssetId` an optional mobile drawing of the same screen. `assetId: null` means a **planned frame**: no drawing yet. Planned frames are backlog, not spec, unless `leftToAi: true`. A planned frame may already carry provisional pins and their yarn, so the flow is tied before it is drawn.
- `leftToAi: true` is the “Leave it up to the AI” post-it: build a standard, conventional page from title, purpose, ideas and yarn. No drawing expected. Sketchcoded already builds that page itself, and the user can walk it in Test flow, so `flow.md` lists it under “Standard page”: its main action, top-bar links, cards and fields. Build what that outline says, with the frame's own words.

## Pins

A pin describes content or an interaction on a drawing. `x`, `y` are fractions of the web image (0..1 from the top left); `mobile: {x, y}` the position on the mobile drawing. `provisional: true` means the position is a placeholder: the pin was written before its frame had a drawing (a planned frame can carry pins and real yarn); the user places it once the drawing arrives. `title` and `description` are the intent in the user's words. `kind`: `interaction` (default), `detail` (opens a closer look, never navigation), `annotation` (content or a local action that stays on this screen; no yarn, not a way onward), `link` (leaves the app for the first URL in its description; no yarn, no destination frame). `color` is the yarn's category, one of red, gold, blue, olive, violet, teal; `colorLabels` names them on this board (by default red is the main path, gold a branch, blue a detour, olive the way back). The user filters the board to one category at a time, so keep colors meaningful.

## Yarn (transitions)

A transition belongs to a pin (`pinId`) and goes to `target` (a screen id) or, for history kinds, to `null`. `navigation`: `push` (open and keep history), `replace`, `reset` (start fresh), `modal`, `back`, `dismiss`. `summary` is the label on the yarn and the option in Test flow. `condition` (when), `logic` (what happens), `context` (data needed) are prose. `fallback: true` marks the branch taken when no condition applies. Never invent routes that are not drawn.

## Ideas (the plan)

`ideas[]` is the functionality backlog. `screenId` says which frame an idea belongs on, `leadsTo` where it goes, `pinId` that it became a pin (it stays in the plan, greyed, so nothing lands on two pages). Statuses: pool (no screen), assigned (screen, no pin), placed (pin).

## Findings and decisions

`analyze` produces findings with a `rule`, `severity` (error, warning, review), `subjects` (ids) and a `fingerprint`. `reviews[]` holds accepted findings with the user's reason. An accepted finding is a decision, not a proof; a stale one needs another look.

## Verification

Read `verify-the-result.md`. Structural findings do not check appearance. Agents inspect rendered boards and delegated pages when authoring, and the finished site when building. Use the user’s full general checklist in both cases. Board-reading instructions formerly in that checklist are preserved below; this file is their current home.

## Presentation only

`layout` (positions and widths on the cork) and `viewport` are how the board looks, not what the app is.

## Superseded checklist wording

The following wording formerly lived in the general checklist. It is preserved as history; the sections above are current. The planned-frame rule has the explicit exception for frames left to the AI.

### Former board-reading rules

- [ ] `project.json` is the specification. `flow.md` is the same content in reading order. Pins are the interactions; their descriptions are the intent, written by the user or their agent. Use the words as written.
- [ ] A screen’s drawing is the layout to build. Where a screen has a web drawing and a mobile drawing, both are the same screen; each pin has a position on each.
- [ ] Yarn is the navigation. Honor the authored kind: open (push), replace, start fresh (reset), open as dialog (modal), go back, dismiss. Never invent a route that is not drawn. Back and Dismiss use real history; if a screen can be reached without the history they need, the review says so and the user’s accepted reason explains what to do.
- [ ] Conditions on yarn are plain language. Implement them as described. Where they overlap or leave a case out, do not guess silently: build the fallback the user marked, and list the ambiguity.
- [ ] A **link pin** leaves the app for a web address written in its description. Build it as a plain link. Never a screen, never a frame, never a route.
- [ ] A **detail reference** shows a closer look without changing the screen. It is never navigation and never a way back.
- [ ] Planned frames (no drawing yet) and unplaced ideas are the backlog, not the spec. Do not build them; do not drop them either. Carry them forward as open items.
- [ ] Accepted review findings are decisions with reasons. Respect them. Open findings are the user’s to resolve, not yours to paper over.
- [ ] **A frame can be left to the AI.** A frame wearing the “Leave it up to the AI” post-it needs no drawing: build a standard, conventional page for it from its title, purpose, ideas and the yarn in and out. Everything else on the board is the user’s vision and is built as drawn.
