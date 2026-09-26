# Resolve findings

Review flow lists structural findings about the board. Each has a `rule` (the part of its id before the colon), a severity (error, warning, review), `subjects` (the ids it is about), a detail sentence and a `fingerprint`.

- **Errors** mean the board cannot be built as it stands: references to things that are missing (a pin's screen, a yarn's target, an image, a mobile drawing), duplicate ids, a frame without a position, yarn on a link pin, a history yarn with a target, a detail sketch used as an entry or as navigation. Fix the board.
- **Warnings** are gaps: dead ends, unreachable screens, pins without yarn or without intent, missing titles, a planned frame waiting for a drawing, a pin not yet placed on the mobile drawing, a link pin without an address, several fallbacks on one pin, an intentional ending without a reason. Fix what is a real gap. Do not pretend a path exists.
- **Review** findings ask for judgment: possible one-way paths, history steps whose context is uncertain, natural-language conditions that overlap or leave a case out, duplicate branch labels. Either fix the board or propose the reason to accept.
- The exact rule is the part of the finding's id before the colon (for example `dead-end`, `unconnected-pin`, `one-way`); the brief lists each finding with its rule, severity, detail and fingerprint, and the frames and yarn it is about.
- **Accepting**: add to `reviews[]` `{ issueId, fingerprint, reason, author, acceptedAt }` with the fingerprint from the brief. The reason is one sentence in the user's voice (“After signing in there is no way back by design”). Accepted findings are decisions, not proofs; when the evidence changes they become stale and need another look.
- Never accept on the user's behalf without proposing the reason first, unless the brief says to.

Write back through the API once, at the end (skill: talk-to-sketchcoded, which also says when to warn the user); the open board refreshes itself when the user has nothing unsaved.
