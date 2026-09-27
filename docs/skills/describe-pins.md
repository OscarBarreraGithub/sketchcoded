# Describe pins

The user draws and places pins; you write down what each pin is. Work on the frame in your brief only.

1. Read the brief: the frame's purpose, its pins (title, description, position), its ideas and its findings. Look at the drawing at the given URL to see what each pin sits on.
2. For each pin without a description (or with a placeholder), find the idea it came from: `ideas[]` with `pinId` equal to the pin, or an assigned idea whose title matches. Use the idea's words.
3. Write the pin: `title` in two to five words naming the element (“Search field”, “Sign out”); `description` saying what happens when it is used and any condition, in plain language. If the idea has a URL, the pin is `kind: "link"` with the address in the description and no yarn.
4. Tie the yarn the idea points to (`leadsTo`): add a transition `{ id, pinId, target, summary, condition, logic, context, fallback: false, navigation, color }`. Use `modal` when the destination is a dialog, otherwise `push`. `summary` is the short label. Do not invent destinations the plan does not name; list them as questions instead.
5. Set `color` when the board's `colorLabels` give the colors a meaning; otherwise leave it.
6. Keep positions (`x`, `y`, `mobile`) exactly as the user placed them.
7. Write back the whole project through the API once, at the end (skill: talk-to-sketchcoded, which also says when to warn the user); the open board refreshes itself when the user has nothing unsaved. Then list what you wrote and what is still open, one line per pin.

Never place a pin on a drawing: only the user does that. A planned frame (no drawing) may carry **provisional pins** (`provisional: true`, placeholder positions down its right side) so its yarn exists before the drawing; the user places them when the drawing arrives (skill: start-a-board). Describe those like any other pin.
