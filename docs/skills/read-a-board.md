# Read a board

A board is a `project.json`. `flow.md` says the same thing in reading order. Read the brief for your task first; it already holds the relevant slice.

## Codes

Frames are `P1, P2, …`, sketches `S1, S2, …`, ideas `I1, I2, …` (the `code` field). A pin is named by its frame and number: “P3 pin 2” is the second pin listed on frame P3. Use these codes when you talk to the user; they see the same codes in the app. Never change or reuse a code.

## Screens (frames)

- `title`, `purpose` (what it is for), `role`: `screen`, `auth` (login or onboarding), `modal` (dialog or overlay), `terminal` (intentional ending), `detail` (an enlarged sketch, not an app page).
- `entry: true` means the app can start here.
- `assetId` is the web drawing; `mobileAssetId` an optional mobile drawing of the same screen. `assetId: null` means a **planned frame**: no drawing yet. Planned frames are backlog, not spec, unless `leftToAi: true`. A planned frame may already carry provisional pins and their yarn, so the flow is tied before it is drawn.
- `leftToAi: true` is the “Leave it up to the AI” post-it: build a standard, conventional page from title, purpose, ideas and yarn. No drawing expected. Sketchcoded already builds that page itself, and the user can walk it in Test flow, so `flow.md` lists it under “Standard page”: its main action, top-bar links, cards and fields. Build what that outline says, with the frame's own words.

## Pins

A pin is an interaction on a drawing. `x`, `y` are fractions of the web image (0..1 from the top left); `mobile: {x, y}` the position on the mobile drawing. `provisional: true` means the position is a placeholder: the pin was written before its frame had a drawing (a planned frame can carry pins and real yarn); the user places it once the drawing arrives. `title` and `description` are the intent in the user's words. `kind`: `interaction` (default), `detail` (opens a closer look, never navigation), `link` (leaves the app for the first URL in its description; no yarn, no destination frame). `color` is the yarn's category, one of red, gold, blue, olive, violet, teal; `colorLabels` names them on this board (by default red is the main path, gold a branch, blue a detour, olive the way back). The user filters the board to one category at a time, so keep colors meaningful.

## Yarn (transitions)

A transition belongs to a pin (`pinId`) and goes to `target` (a screen id) or, for history kinds, to `null`. `navigation`: `push` (open and keep history), `replace`, `reset` (start fresh), `modal`, `back`, `dismiss`. `summary` is the label on the yarn and the option in Test flow. `condition` (when), `logic` (what happens), `context` (data needed) are prose. `fallback: true` marks the branch taken when no condition applies. Never invent routes that are not drawn.

## Ideas (the plan)

`ideas[]` is the functionality backlog. `screenId` says which frame an idea belongs on, `leadsTo` where it goes, `pinId` that it became a pin (it stays in the plan, greyed, so nothing lands on two pages). Statuses: pool (no screen), assigned (screen, no pin), placed (pin).

## Findings and decisions

`analyze` produces findings with a `rule`, `severity` (error, warning, review), `subjects` (ids) and a `fingerprint`. `reviews[]` holds accepted findings with the user's reason. An accepted finding is a decision, not a proof; a stale one needs another look.

## Presentation only

`layout` (positions and widths on the cork) and `viewport` are how the board looks, not what the app is.
