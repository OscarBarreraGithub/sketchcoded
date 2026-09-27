# Build rules

These apply to anything built from a Sketchcoded board and to Sketchcoded itself. The authority is the user's checklist at `/api/checklist.md` (also `BUILD-CHECKLIST.md` in every export); this is the short form. The checklist is general: it holds what the user wants from every app. What they asked for one project lives with that project (a board's backlog and accepted findings), never in the checklist.

- **Nothing grows or shrinks because of what was clicked.** Dialogs, panels and callouts keep a fixed size; content scrolls inside them. Selecting a different item never moves the rest of the page.
- **Nothing overlaps.** Labels, pins, frames, buttons and text keep clear of each other. Leave room to breathe.
- **Good control when zoomed in.** Test real browser zoom at 125%, 150%, 200% and 250% on a laptop window. Every view must work at every zoom.
- **The page never scrolls; panels do.** The shell fits the window; lists, dialogs and side panels scroll inside themselves.
- **When something is off screen, say so.** Every scrolling region keeps a visible scrollbar and a “more below” signal until the end.
- **A canvas never pans out of sight of its content.** It stops at the last item plus padding.
- **All text is easily legible.** Nothing under 12px on screen. Canvas text keeps 12 screen pixels at any zoom or steps aside.
- **Make it obvious what is clickable** and which option is selected.
- **Click targets ≥ 44px, fields ≥ 48px tall.** Long notes readable without a nested scrollbar.
- **Order of work:** logic and placement first, window resizing second, mobile third. Mobile is a stacked version of the same screen.
- **Links out are pins** with the address in their description: a plain link, never a screen or a route.
- **A frame left to the AI** gets a standard, conventional page from its title, purpose, ideas and yarn. `flow.md` gives that page's outline under “Standard page”, the same one the user clicked through in Test flow; build that. Everything else is built as drawn.
- **Every screen has a way onward or is a deliberate ending.** Do not ship a page a person cannot leave.
- **Planned frames and unplaced ideas are backlog**, not spec: carry them forward, do not build or drop them.
- **Accepted findings are decisions with reasons.** Respect them; leave open findings to the user.
