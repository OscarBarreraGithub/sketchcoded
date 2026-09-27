# Connect screens

Yarn is navigation. Fill in a yarn so a builder and Test flow both understand it.

- `summary`: the label on the yarn and the option in Test flow. Short, specific, at most about 40 characters (“Signed in”, “Open settings”).
- `navigation`: `push` opens the destination and keeps history; `replace` swaps the current screen; `reset` starts fresh (after signing out, for example); `modal` opens the destination as a dialog over the current screen; `back` returns to the actual previous screen; `dismiss` closes the current dialog. `back` and `dismiss` have `target: null`.
- `condition` (when does this happen), `logic` (what happens along the way), `context` (what data or information is needed): plain language. They are read by people and builders; nothing executes them.
- `fallback: true`: exactly one branch per pin when its conditions do not cover every case. Two fallbacks on one pin is a finding.
- A `link` pin never has yarn. A `detail` pin is not navigation.
- Keep the navigation kind the user chose unless the brief says otherwise. Do not add a destination screen that is not on the board; ask.
- **A way back, or a reason.** Before you leave a screen with no route out, either tie one (a `back` pin, or a link onward) or make it `role: "terminal"` with a purpose saying why it ends there. One-way trips are fine when they are the point (after signing in, after a reset); say so in the review rather than leaving it silent.
- **Colors need labels.** Use a single color unless `colorLabels` gives the colors meaning on this board; if you introduce one, set its label too.

Write back through the API once, at the end (skill: talk-to-sketchcoded, which also says when to warn the user); the open board refreshes itself when the user has nothing unsaved.
