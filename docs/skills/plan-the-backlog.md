# Plan the backlog

`ideas[]` is the functionality backlog. The user writes ideas in their words; you organize them.

- **Assign**: set `screenId` to the frame the idea belongs on. Use frames that exist; propose a planned frame (`assetId: null`, with a `layout` position) when a needed screen does not exist yet, and say so.
- **Lead**: set `leadsTo` when the idea clearly opens another screen. Placing the idea later ties that yarn automatically.
- **Answer “what should go on this frame?”** from the backlog: list the frame's ideas with their status, note what is still waiting, and propose missing items as new ideas. Move an idea when asked; the board follows.
- **Never duplicate**: a placed idea (`pinId` set) stays in the plan, greyed. Do not add the same functionality twice on two frames.
- **Placing is the user's move.** You write ideas, screens and leads; the user places pins on the drawing (or asks you to describe pins that exist).
- Keep the plan readable: one idea per capability, a title of a few words, details in `detail`.

When you are working inside the Sketchcoded repository itself, also keep `docs/FUNCTIONALITY.md` in step with the board's backlog.

Write back through the API once, at the end (skill: talk-to-sketchcoded, which also says when to warn the user); the open board refreshes itself when the user has nothing unsaved.
