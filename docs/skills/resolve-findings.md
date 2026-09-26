# Resolve findings

Review flow lists structural findings about the board. Each has a `rule` (the part of its id before the colon), a severity (error, warning, review), `subjects` (the ids it is about), a detail sentence and a `fingerprint`.

- **Errors** are broken references: a pin or yarn pointing at something missing, an image missing from the project, a link pin with yarn, a mobile drawing that is gone. Fix the board.
- **Warnings** are gaps: dead ends, unreachable screens, pins without yarn, missing titles or intent, a planned frame waiting for a drawing, a pin not yet placed on the mobile drawing, a link pin without an address. Fix what is a real gap. Do not pretend a path exists.
- **Review** findings ask for judgment: possible one-way paths, history steps whose context is uncertain, overlapping natural-language conditions, several fallbacks. Either fix the board or propose the reason to accept.
- **Accepting**: add to `reviews[]` `{ issueId, fingerprint, reason, author, acceptedAt }` with the fingerprint from the brief. The reason is one sentence in the user's voice (“After signing in there is no way back by design”). Accepted findings are decisions, not proofs; when the evidence changes they become stale and need another look.
- Never accept on the user's behalf without proposing the reason first, unless the brief says to.

Write back through the API (skill: talk-to-sketchcoded) and tell the user to reload.
