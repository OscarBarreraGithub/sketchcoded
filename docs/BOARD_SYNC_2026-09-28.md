# Board record update · 2026-09-28

The review follow-up replaced stale current specification text. Earlier wording remains here as superseded history; the live board carries current intent. The user’s drawings, placements, layout and yarn were preserved.

## I6

Superseded: Thumbnails of every image with Used counts, a search box, a used/unused filter, and a way to locate placements.

Current: Thumbnails in New and Used sections, with Used counts, search and a way to locate placements.

## I12

Superseded: Dashed threads show ideas that lead somewhere but are not pins yet.

Current: Planned connections are listed in Plan and the text outline. The board draws only real yarn; ideas can wait until they are made into pins.

## I18

Superseded: Click a card or its paper title.

Current: Click a card to pick out its threads. Open it with its tape title, arrow or a double-click.

## I36

Superseded: The drawing shows a toggle that swaps the image between web and mobile. The current build shows both side by side. Decide which.

Current: The Web / Mobile toggle swaps between drawings of the same screen; the pins keep a position on each.

## I15

Superseded: Saved, saving, unsaved or needs attention beside the board name; a leave warning while unsaved.

Current: Saved, saving, unsaved or needs attention beside the board name. Returning to Your boards saves pending edits first; failed saves keep recovery controls open. An arriving agent refresh never overwrites an edit made during the request.

## I63

Superseded: SKETCH CODE. Prompts make apps. Sketching makes your vision. (Alternate: Telling an AI what you want gets you an app. Showing it gets you your vision.)

Current: Sketchcoded. Ideas, connected.

## I65

Superseded: Tell your AI: “I want to set up github.com/…/sketchcode. Make sure to…”. On mobile this block sits below the example frame.

Current: A setup prompt for https://github.com/OscarBarreraGithub/sketchcoded, with requirements and the local address. On mobile this block sits below the example frame.

## I68

Superseded: Rephrase. Opens the guide: autochecks, .md setup, GitHub.

Current: Opens the guide: setup, controls, agent handoff, recovery, structural Review flow and the full checklist agents verify when working on the board or building its site.

## I69

Superseded: Opens the repository in a new tab: https://github.com/OscarBarreraGithub/sketchcoded (address to confirm once the repo is public).

Current: Opens the repository in a new tab: https://github.com/OscarBarreraGithub/sketchcoded

## I70

Superseded: Opens the science-with-agents project page: https://sketchcoded.com/projects/science-with-agents (placeholder until that page exists).

Current: Opens Science with Agents in a new tab: https://sciencewithagents.com

## I86

Superseded: Five or six panels that teach the app, opened from the landing page: the board, pins and yarn, the plan, Review flow, Test flow, and Tell the agent. Not built yet; the user asked to keep it as a to-do.

Current: Six interactive panels opened from the app landing page: planning, provisional pins, branches, review decisions, Test flow and Tell the agent. Practice controls do not change a board.

## I84

Superseded: One button per view (board, screen editor, connection editor, plan, ideas panel, outline, review, test flow) copies a prompt naming exactly what you are looking at, with the brief the running app serves for it (/api/projects/:id/brief), the skills (/api/skills) and the rules (/api/checklist.md). The agent reads the live board and writes back through the local API.

Current: One button per view (board, screen editor, connection editor, plan, ideas panel, outline, review, test flow) copies a prompt naming exactly what you are looking at, with the brief the running app serves for it (/api/projects/:id/brief), the skills (/api/skills) and the rules (/api/checklist.md). The agent reads the live board and writes back through the local API. Every brief requires verify-the-result: inspect the affected rendered board and delegated pages, then the finished site when building it, against the full general checklist. Report checks and remaining failures.

## P6

Superseded: One frame up close: web and mobile drawings side by side, pins, layouts, and the ideas planned for it.

Current: One frame up close: switch between web and mobile drawings, describe pins, place them on each layout and manage the ideas planned for it.

## P12

Superseded: Read more. Explains the autochecks (no overlapping or small text, browser zoom issues), setting up from the .md file structure, and points to GitHub too.

Current: Read more: setup, everyday controls, agent handoff and recovery. Review flow checks the graph. Agents inspect the rendered board and pages left to the AI, and check the finished site when building it, against the full checklist including text overlap and browser zoom.

## Content and local actions

The following existing pins have no yarn and describe content or local behavior. Their kind changed to annotation; no routes were invented.

- pin-landing-title
- pin-landing-setup
- pin-landing-copy
- pin-landing-local
- pin-board-sections
- pin-idea-18
- pin-idea-17
- pin-board-ideas-panel
- pin-board-name
- pin-idea-22
- pin-idea-25
- pin-idea-20
- pin-board-home-marker
- pin-board-resize
- pin-board-space
- pin-idea-46
- pin-editor-pins-list
- pin-editor-highlight
- pin-editor-colors
- pin-editor-fields
- pin-idea-45
- pin-idea-53

Added I98–I101: Threads categories, stable codes, content/local-action pins and the guide’s agent-verification explanation.
