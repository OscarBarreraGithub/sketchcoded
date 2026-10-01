# Build checklist

General requirements for every project built with these instructions. Each rule applies every time,
to every app, so the rules carry no dates and name no product. Read this before building and
check each item against the result. Add general preferences here as clear requirements; never
delete one, mark it superseded. Product requests and instructions for a particular tool belong
in that project’s own records and guides. Projects share this checklist, not their histories.

## Layout and interaction (every screen, every view, every zoom)

- [ ] **Nothing grows or shrinks because of what was clicked.** Dialogs, panels and callouts keep a fixed size; their content scrolls inside. Selecting a different pin, tab or option never changes the size of the surrounding frame or moves the rest of the page.
- [ ] **Good control when zoomed in.** Test real browser zoom at 125%, 150%, 200% and 250% in a laptop-sized window (1440×900 and 1280×720). Text stays readable, controls stay reachable, nothing overflows its container, and the main work area stays usable. Zoom must work, every time.
- [ ] **Zoom works all the way in.** After the 125% to 250% checks, keep stepping real browser zoom up to the browser's maximum (500%) in both window sizes. Nothing breaks: the page never scrolls, every control stays reachable (a crowded toolbar scrolls sideways, a dialog becomes one scrolling column with its main content first), nothing overlaps, and a scrolling region still says there is more.
- [ ] **Every view works at every zoom.** Not only the main screen: every editor, list, side panel, secondary view and dialog must be usable at those zooms. Check each one after any layout change.
- [ ] **When something is off screen, the user must know.** Every scrolling region keeps a visible scrollbar and shows a clear “more below” or “more above” signal until the end is reached, in a real zoomed browser and not only in an emulated viewport. Never rely on an invisible overlay scrollbar.
- [ ] **The page never scrolls; panels do.** The app shell always fits the window, at every width and height, including short zoomed windows. Only columns, dialogs, side panels and list views scroll, each inside itself. A canvas or work area is the size of its region, never of its content.
- [ ] **A canvas never pans out of sight of its content.** Panning stops at the outermost item plus padding, so the last item in view is whole with room beside it, never cut off at the edge. When everything fits in view, it floats inside that padding. Something is always on the canvas.
- [ ] ~~**All text is easily legible.** No text on screen under 12px, including eyebrows, badges, captions, footers and hints. Text that lives on a zoomable canvas keeps at least 12 screen pixels at any canvas zoom, or steps aside when the canvas is zoomed far out. Text that grows to stay legible must never change the size of the item it sits on: items on a canvas keep a fixed size in canvas units, and text that no longer fits hides or trims. Check at browser zoom too.~~ Superseded by “Text is comfortable to read without zooming in”.
- [ ] **Text is comfortable to read without zooming in.** If the user would reach for browser zoom to read something, it is too small. At 100% browser zoom, anything a person reads (body text, help, hints, labels, buttons, fields, captions, footers, eyebrows) is at least 15px, and nothing, not even a badge or a count, is under 14px. Text on a zoomable canvas keeps those sizes in screen pixels at the zoom the user actually works at, or steps aside when the canvas is zoomed far out. Text that grows to stay legible never changes the size of the item it sits on: items on a canvas keep a fixed size in canvas units, and text that no longer fits hides or trims.
- [ ] **Look for what is too small.** After any visual change, measure every view instead of judging it by eye: list every piece of text under the minimum and every click target under 44px, at 100% browser zoom and, on a canvas, at the zoom the user works at (including the view they saved). Fix what the list finds. A small visible mark may keep a larger invisible click area. Exempt only a link inside a sentence or a decorative miniature, and say so.
- [ ] **Nothing overlaps.** Labels, pins, frames, buttons and text keep clear of each other. Leave room to breathe. When there are more labels than fit without collision (a canvas, a map, a graph, a chart), show them on demand rather than all at once: a small marker in place, the full label on hover, on selection, or past a zoom level. Selecting something shows its own labels and quiets the rest.
- [ ] **Make it obvious what is clickable** and which option is selected: the active tab is filled, the primary action is unmistakable.
- [ ] Click targets are at least 44px and form fields at least 48px tall. Long notes stay readable without a tiny inner scrollbar.
- [ ] Order of work on any screen: first the logic and the placement of every element, second the behavior when the window resizes, third the mobile appearance.
- [ ] Mobile is a stacked version of the same screen; the drawing says what goes below what.
- [ ] No text-heavy summaries where a picture is expected. A card summarizes; the detail lives one click away.
- [ ] **Back never goes in circles.** Going to a screen that is already in the history takes the history back to it: after A → B → C → B → C, Back leads to B and then A, never around the loop again (C → B → C → B → A).
- [ ] **Back is always within reach.** It works the same way everywhere, is easy to find even after scrolling down, and history starts over at the home screen, so nobody has to press Back again and again.
- [ ] **Every click does something visible.** Clicking an item opens it, shows what it is, or says why not. A click that only highlights reads as broken; a click with no response is a bug.
- [ ] **Fit before scrolling.** When what was just opened can fit in the window, fit it; scrolling is for what cannot.
- [ ] **The work area gets the space.** The main area fills the window to its bottom edge. Toolbars stay compact, and secondary controls (a back link, a status, a setup button) take little room or become a small mark. Avoid piles of boxes and cards inside cards.
- [ ] **Content grows; clicks don't.** An empty container starts compact and grows with its content up to the window, then each part scrolls inside itself. A text field grows as you type, up to a limit, then scrolls, and long text can open in a full editor that closes without sending. This growth comes from content, never from a click elsewhere.
- [ ] **Notes are notepads.** A list or note the user writes is a multi-line notepad that uses the height of the screen, never a one-line field that scrolls sideways.
- [ ] **Things stay where people left them.** Filtering, highlighting and selecting dim or nudge items in place; nothing jumps far or disappears, so nobody loses track of where something is. Keep motion simple.
- [ ] **A canvas opens readable,** on the view the user arranged and at a zoom where its labels can be read, never on a fit-everything view too far out to read.
- [ ] **Moving around is direct.** Scrolling or a slider zooms and dragging pans; no switching between hand and pointer tools, and not only + and − buttons.
- [ ] **Every filter has “show all”,** and its categories are named and added in the same menu. Use the smallest set of categories that makes sense.
- [ ] **Show what is used.** Items already used are greyed but readable, never hidden, so nothing is used twice.
- [ ] **Confirm what happened.** An action says it worked (“Copied”), and anything a button copies can also be selected and copied by hand.
- [ ] **Saved means edited.** The save status changes only on real edits; moving around or zooming is not an edit.
- [ ] **Never lose what someone types.** Save continuously, keep earlier versions, and never let one device or tab overwrite another's text.
- [ ] **Input is never blocked.** While work runs, people can still type, send and steer.
- [ ] **Show progress.** When something loads or refreshes, show a small progress indicator.
- [ ] **Calm motion.** Ambient animation is slow, quiet and cheap to run, and keeps going rather than stopping after a few seconds. A tap gets a lively response without a stray outline; the keyboard focus ring stays.
- [ ] **Forms are even.** Fields in one form share one size; none is skinny or hard to hit.
- [ ] **Dropdowns look like buttons.** A selector or popup trigger is a full-size, clearly clickable button, not a thin bubble.
- [ ] **Enlarge before removing.** When something people like is too small, make it bigger; remove a small control only if it is not needed.
- [ ] **One visual language.** One kind of thing looks one way everywhere; no second notation for the same link.
- [ ] **Familiar patterns for familiar jobs.** A chat works like the chat apps people know, a gallery like a phone's home screen; invent only where nothing standard fits.
- [ ] **The logo goes home.** The top-left logo returns to the start page, and the start page puts its main actions (create, open) in the middle.
- [ ] **A complex picture has a plain view.** A graph or map has an outline or text view that can be skimmed and pasted into a chat, and an overview that does not overwhelm.
- [ ] **Design before functionality.** Settle the drawn design first, starting from the main screen and working backwards, then build what is behind it.

## What goes on a page

- [ ] **Every part earns its place.** If a page, section or control has no obvious purpose, or nobody would use it, remove it instead of explaining it.
- [ ] **One of each.** One button per destination, one place for each task and one for each setting; no duplicate links, guides or help.
- [ ] **Build what was asked.** Add no features, bars or links that were not drawn or requested.
- [ ] **Nothing empty ships.** No blank pages, empty prompts or placeholder features. While building, an unfinished part may hold one line saying what will go there; before release, leave it out and record it as future work.
- [ ] **When something is removed, every mention goes with it,** so no text points at a feature that is gone.
- [ ] **People get the summary.** Show the current state first. Logs, raw history and long completed lists stay available to agents, and in the interface at most as a searchable, paged view, rendered in bounded pieces so nothing freezes. In a feed, tool calls and finished steps collapse into a row that opens.
- [ ] **Show what needs the user.** What needs their input is prominent when they arrive, apart from background work.
- [ ] **Their own things only.** A person's lists show what they made; automated or background items are hidden or marked, and every category label is accurate.
- [ ] **Most important first.** Sections and options run from most to least important or capable, so the order explains itself.
- [ ] **One item per line.** Several name–value pairs go on separate lines, not run together.
- [ ] **Numbers for people.** Round sensibly, with no long decimals; a title that explains itself beats an extra explanatory line. A meter shows what is left rather than what is used.
- [ ] **Settings show their value.** A setting shows its actual current value, never “uses default”. Every setting has a sensible default, starts from the owner's recommended defaults and can always be reverted to them; say in a few words when a choice can wait.
- [ ] **Direct controls.** Prefer a live control, such as a slider, to a complicated form. Don't ask for input that is always the same or that people give somewhere else anyway.
- [ ] **Maintenance stays out of sight.** Backups and recovery run in the background or through the agent, not as unexplained buttons.
- [ ] **No needless sign-ins.** Question every sign-in, sign-up and pairing step and keep only those that protect something real. Keep network and pairing security strict; skip protections against unlikely threats that only add friction.
- [ ] **Everyday use is one step.** The app opens like any app; nobody juggles links or ports.
- [ ] **A link out is a link.** An outside site is a link, with the service's familiar logo, never a page inside the app.
- [ ] **Pages without a drawing match the drawn ones.** A page the agent designs freely keeps the same standards, style and colors.
- [ ] **A setup guide is a series of steps,** each with a prompt to copy and paste.
- [ ] **Public examples stay focused.** Leave out parts that add no information, return to a set view on reload, and make the place to start obvious.

## Copy and content

- [ ] Preserve authored product copy unless rewriting is requested; when it is, show the revised copy.

- [ ] **Write direct, specific product copy.** Do not invent cute or whimsical labels, slogans, subtitles, inspirational phrases, or vague promises of companionship or reassurance. Every heading, label and supporting line must identify something, explain an action or communicate a concrete benefit. Omit decorative subtitles and filler that add no useful information. Apply this to new work; do not rewrite existing sites without a request.

- [ ] Keep public repository documentation concise and edited. Record requirements and decisions instead of raw conversation transcripts; correct grammar and spelling and omit personal environment details.

- [ ] **No cute slogans, anywhere.** Slogans, taglines and all-caps eyebrow lines an agent added go wherever they are found, not only in new work; copy the user wrote stays.
- [ ] **Labels that say something.** A label repeated on every item, or a title that lists field names, says nothing. Spell out acronyms, and use real names (the actual model names) rather than invented tiers.
- [ ] **Honest copy.** Say what a thing cannot do, and check that no line can be read as describing the very thing the product stands against.
- [ ] **Plain names.** A product name is approachable and short, one word if possible, never jargon.
- [ ] **Short, stable codes.** Give every item a code people and agents can use to name it exactly, and make sure codes don't resemble something familiar and unrelated (P1, not F1, which reads as a function key).

## Portability

- [ ] Support new machines, users and accounts without source edits for local paths or credentials. Provide documented configuration for environment-specific values and portable setup commands. Keep private data and credentials out of version control.

## Phones

- [ ] **Test the phone too.** Run the overlap, text and zoom checks at phone sizes, portrait and landscape (for example 390×844 and 915×412), not only on laptops.
- [ ] **The keyboard never moves the page.** Opening the phone keyboard never makes the page jump; the input stays just above the keyboard and nothing floats over it.
- [ ] **Little sticky chrome.** Headers and status bars don't follow the scroll on a phone, and there are no bottom bars nobody asked for.

## Repository and release

- [ ] **Ship the repository clean.** No stale docs, dead code, unused backends, test litter, sample data nobody would use, or LLM walls of text in the README. The user's requests may appear, edited.
- [ ] **MIT by default.** A public repository ships with the MIT license unless told otherwise; the owner's drawings and logo stay theirs.
- [ ] **One logo, everywhere.** The owner's original logo, never a pixelated copy, is the favicon, the app icon and the phone icon, and it is in the repository so collaborators get it.
- [ ] **Setup works for a newcomer.** The setup prompt and instructions are complete and tell a setup agent what it needs to know.
- [ ] **Nothing that changes is hard-coded.** Values that change or retire (model names, versions, providers) live in one central place, default to the latest, can be overridden by the user, and are read live from the vendor where possible, so a rename never breaks anything.
- [ ] **Product, site and docs agree,** and new pages reuse the existing design.
- [ ] **Keep a list of what it can do,** in plain words, updated as features land, so a site or guide can be written from it.
- [ ] **Built to be customized.** Others can change any part of their copy, and later updates can still be ported into it by their agent.
- [ ] **A deploy never mixes old and new.** Pages refer to their stylesheets, scripts and images by a fingerprint of their content, so a browser holding yesterday's copies fetches the new ones, and every image has a size of its own, so a page that loads without its styles still looks right. Test in Chromium, WebKit (Safari) and Firefox, not only one browser.
- [ ] **Match a design by porting it.** To match an existing site, find its real, deployed source and port it exactly rather than recreating it.

## Process, for any agent working with the user

- [ ] **The agent checks what it makes.** When an agent constructs a site from a design, or works on the design itself, including pages whose design is left to the AI, the full checklist must pass before that work is called done. Inspect the rendered result, including overlapping text and zoom control. This belongs in the agent’s instructions; a structural check alone does not verify appearance or usability.
- [ ] **Show what was checked.** Record the views, window sizes and real browser zoom levels tested, the results and any remaining failures. Fix failures within the task’s scope. Say what is blocked or unverified; do not claim it passed.

- [ ] Start servers and browsers only while using them; stop them before handing back, and check that their children and listeners are gone. Never point tests at the user’s data.
- [ ] Verify before saying done: run the project’s build, its tests (including real browser zoom where there is a screen) and its format check, record the results, and do not mark done what was not verified.
- [ ] **Measure before fixing a zoom report.** Reproduce it at laptop sizes (1440×900 and 1280×720 at 125%, 150%, 200% and 250%) with screenshots and numbers (page scroll, panel scroll, hint present), then fix, then measure again. Emulated viewports find layout bugs; the real tab-zoom test confirms them.
- [ ] Write things down the day they are said, so nothing is lost across a compaction: a general preference here, a project request in that project’s record, a decision with its reason where the project keeps decisions.
- [ ] The final message to the user restates the address of anything running and anything they need to do next.
- [ ] **Every request is a checklist item.** Keep every prompt. Before calling work done, re-read the requests, including earlier removals, and check each one against the result.
- [ ] **Turn a ramble into a list.** Write every point of a long request down, asides included, and work until each one is met.
- [ ] **Ask once, then act.** Ask clarifying questions at the start; afterwards decide, write the big decisions down to raise later, and don't get blocked. Before a large build, list the decisions that are the user's and flag missing functionality.
- [ ] **Answer the question asked.** When the user asks a question or says “plan first”, answer or plan and change nothing.
- [ ] **Look before asking.** Find things yourself before asking for them; when you do ask, say why, and explain any term the user hasn't seen.
- [ ] **Do all of it.** Every part of a request gets done, never a stand-in such as a label instead of the feature. Done means the user never later finds something unbuilt.
- [ ] **Use the user's own work** for examples and demos, never something the agent made in its place.
- [ ] **Drafts are complete.** An agent's first draft of a structure is full and connected, so the user fine-tunes rather than starts over. The user makes the creative decisions; the agent writes things down.
- [ ] **Don't over-engineer.** Build the few things that matter, the simplest way that works. When the user flags over-engineering, stop and list everything across the project that needs simplifying.
- [ ] **One catch means a sweep.** When the user catches one instance of a problem, check the whole project for the same pattern and fix every case.
- [ ] **Turn each bug into a check.** Add an automated check or an instruction so it cannot come back, and ask whether the lesson belongs in these general rules.
- [ ] **Verify by using it.** Use every feature end to end the way a person would, on a phone when phones are supported; type checks are not testing. Show the user rather than ask them to test: simulate the phone, run a local copy.
- [ ] **Never break what worked without saying so.** If a feature is removed or gets worse, say so and why.
- [ ] **Leave the user's arrangement alone.** Never rearrange their layout or move their items unless asked; make only the requested edits.
- [ ] **Say what you are doing.** The user can always tell what the agent is doing and why; explain unrequested work before doing it.
- [ ] **Don't stall silently.** If stuck for more than about ten minutes, or if input is needed, say so at once and say exactly what is needed; keep working on everything that isn't blocked.
- [ ] **Reviews are bounded.** Plans and reviews stay small; after two rounds the lead decides and records the decision for the user to review later. Substantial work gets an independent reviewer, and instructions are tested by an agent other than the one that wrote them.
- [ ] **Short, plain reports.** Status summaries are a few plain sentences for someone near the project, with no commit references, and say exactly where changes were made. Keep a running list of current work and next steps that survives a compaction, split into what the agent will do and what needs the user.
- [ ] **Offer a few strong options.** Generate many privately and show only the best few, together using every idea the user gave.
- [ ] **Handoff prompts are short.** A prompt that hands work to an agent is a few lines pointing to a file with the full context.
- [ ] **Polish before showing.** Hand work over for feedback only once it is polished.
- [ ] **Budgets are hard limits.** A stated usage budget is a ceiling. Estimate time realistically, and pause or raise a job that keeps overrunning rather than let it drain the allowance; hitting a limit pauses work and never deletes it.
- [ ] **Tests earn their time.** Keep tests and validation proportionate and fast, and know how long they take.
- [ ] **Write down what drawings say.** When given drawings or notes, record every piece of functionality they mention, even if the task was only to file them.
- [ ] **Fan out when coverage matters.** When everything must be covered, or you are unsure, use parallel agents.
- [ ] Keep this checklist general and undated. It is for every app, not for one; a rule that only makes sense for one product is a project request, not a rule.
