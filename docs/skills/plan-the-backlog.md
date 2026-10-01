# Plan the backlog

`ideas[]` is the functionality backlog. The user writes ideas in their words; you organize them.

- **Assign**: set `screenId` to the frame the idea belongs on. Use frames that exist; propose a planned frame (`assetId: null`, with a `layout` position) when a needed screen does not exist yet, and say so.
- **Lead**: set `leadsTo` when the idea clearly opens another screen. Placing the idea later ties that yarn automatically.
- **Answer “what should go on this frame?”** from the backlog: list the frame's ideas with their status, note what is still waiting, and propose missing items as new ideas. Move an idea when asked; the board follows.
- **Never duplicate**: a placed idea (`pinId` set) stays in the plan, greyed. Do not add the same functionality twice on two frames.
- **An external site is a link pin**, not a screen: the address goes in the pin's description. Do not add a frame for a public site or another product.
- **Placing is the user's move.** You write ideas, screens and leads; the user places pins on the drawing (or asks you to describe pins that exist). On a frame without a drawing you may tie the strings early with provisional pins (skill: start-a-board).
- **Write for the builder.** A purpose says what the screen is for; an idea is one thing on a screen, titled as the user would say it. No stage numbers, build order, disclaimers or notes to yourself, and no checklists or layout contracts as ideas: the user's general rules are in the checklist already.
- Keep the plan readable: one idea per capability, a title of a few words, details in `detail`.

When you are working inside the Sketchcoded repository itself, also keep `docs/FUNCTIONALITY.md` in step with the board's backlog.

Write back through the API once, at the end (skill: talk-to-sketchcoded, which also says when to warn the user); the open board refreshes itself when the user has nothing unsaved.
