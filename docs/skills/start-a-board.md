# Start a board

A new board (or an empty one) is written at one of three levels. The user picks the level in the handoff dialog; the brief names it (“Build: …”) and lists the exact shapes to write. Read the project you are working in, or ask the user for two lines about it, before writing anything.

## The three levels

- **Just the list.** Ideas only, in the pool: `ideas[]` with `screenId: null`, `pinId: null`, `leadsTo: null`. Each idea is one thing to draw or connect; its `detail` starts with the screen it belongs on (“Home: …”). No screens, no pins, no transitions. The user makes the frames and ties the strings from this list.
- **Frames and strings** (the default). Planned frames (`assetId: null`, a `layout` position each) with their ideas assigned (`screenId`) and, for every idea that opens another screen, a **provisional pin** on its frame with the yarn already tied to the destination. Nothing is drawn; the flow is complete before the first drawing, so a later change of mind is a tweak, not a rebuild.
- **Built out.** Frames and strings, then `leftToAi: true` on every frame: a whole site of standard pages, tied together. The user takes the post-it off the one or two frames they want to draw themselves and leaves the rest to the AI.

## Provisional pins

A pin on a frame without a drawing carries `provisional: true` and a placeholder position: `x: 0.86` and a slot down the right side of the card (`y` 0.12, 0.28, 0.44, 0.60, 0.76, 0.92). Its title and description come from the idea; set the idea's `pinId` to it. The pin's transition is real (`push`, or `modal` when the destination is a dialog; `summary` the idea title, short; `fallback: false`; `color: "red"`). When the user drops a drawing on the frame, the app asks them to place each provisional pin; placing clears the flag and the yarn follows. Never attach a drawing and never place a pin on a drawing yourself.

## Write for the builder, not for yourself

Everything in the board is read later by the agent that builds the app, and by the user. Keep your own process out of it.

- **Purpose** says what the screen is for and what someone does there, in one to three sentences. No stage numbers, priorities, build order, disclaimers (“not authorization to build”) or notes to yourself. Those belong in your own project's notes, not in the board.
- **An idea is one thing on a screen**: a control, a section, a behavior. Titled as the user would say it, in a few words; the detail says what it does. Not a checklist, not a layout contract, not a rule that applies to every screen: the user's general rules already live in the checklist, and restating them as ideas duplicates them.
- **Frame titles** are what the user would call the page. **Entry** is true only for real ways into the app. **Role**: `screen`, `auth` for sign-in and onboarding, `modal` for a dialog, `terminal` for an intentional ending.
- **Layout**: `{x, y, width: 360}` on a grid, 450 apart across and 380 apart down, one row per theme, the entry frame first. A planned card is a 2:1 box under its tape; leave the room.
- Ids are yours to choose (letters, digits, `-`, `_`); codes (`F1`, `I1`) are assigned by the server, so leave `code` out of new things.

Create the board with `POST {base}/api/projects` (header `X-Drawcode-Client: local`, body `{"name": "<project name>"}`), fill it with one `PUT` at the end (skill: talk-to-sketchcoded), and tell the user the board's name.
