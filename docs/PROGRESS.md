# Product progress and handoff

Updated 2026-09-28. This is the current status; dated review reports retain their original observations and explain the follow-up fixes.

## Current state

The local screenshot flow designer, structural review and interactive preview are implemented. Later passes added planning, mobile drawings, provisional pins, agent handoff, delegated standard pages, thread categories and a six-panel tutorial. The integrated model generation/review workflow remains deferred.

The separate public site is available at [sketchcoded.com](https://sketchcoded.com), with a [guide](https://sketchcoded.com/guide) and [read-only demo](https://sketchcoded.com/demo). The official demo uses the authored Sketchcoded board and its original hand drawings. Undrawn frames in that example are unfinished design work, not necessarily missing application features.

## Start here

1. Read `AGENTS.md`, `ORIGINAL_BRIEF.md`, `SKETCHCODED_REQUESTS.md`, `DECISIONS.md` and `BUILD_CHECKLIST.md` before changing the product.
2. Follow the repository README for setup, configuration, storage and recovery. Node 22.12 or later and npm are required; no account or API key is needed. The checkout can live anywhere.
3. Run `npm ci`, then `npm run dev`. Use `-- --port 0` to choose an available port, and open the address printed by the server. Keep only one server per data directory.
4. Preserve `.drawcode/` or the configured data directory. A fresh installation creates the Little chat sample; it does not need any maintainer's private boards. Use isolated data for tests.
5. Use the active board's plan and generated outline when discussing its requirements. Only update an existing product-planning board when that work is authorized. Keep `FUNCTIONALITY.md` current independently of local data.
6. The companion site is the separate `sketchcoded-site` repository. It can be cloned anywhere. Its README describes configuration, example regeneration and deployment to the intended account. A fork uses its own hosting project.
7. Stop task servers and test browsers, including their child processes, before handing back unless asked to keep them running.

## Implemented scope

- Local file/folder intake, immutable image snapshots, watched folders and New/Used library sections.
- A pannable, zoomable board with named and resizable frames, pins, branching yarn, thread filtering and an outline alternative.
- A planning backlog with assignments, placed markers and copyable text; planned frames and provisional pins before drawing.
- Web and mobile drawings of the same screen, with shared navigation and separate pin positions.
- Interaction, link, detail and content/local-action pins with distinct semantics.
- Structural diagnostics, reasoned exceptions, evidence invalidation and explicit checker limits.
- Test flow with branches, authored history, dialogs, generated standard pages and independent test rewind.
- Autosave, atomic backups, revision conflicts, undo/redo and portable export/import with the checklist and skills.
- Generated agent prompts and live briefs in every work view; three board-build levels and safe refresh after agent writes.
- Six tutorial panels with practice state separate from saved boards.
- Public guide and read-only example, with external links, layouts and history matching the app.

See `FUNCTIONALITY.md` for the feature catalogue and `GRAPH.md` for model semantics.

## Milestones

| Date          | Result                                                                      | Verification at that milestone                                                         |
| ------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 2026-09-07    | Initial local designer, graph, review, preview and export                   | Build, 40 domain/storage/API tests, 9 browser workflows, formatting                    |
| 2026-09-08    | Branding, outline, detail references, controls and browser zoom             | Build, 49 tests, 13 browser workflows, native zoom and formatting; `USABILITY_PASS.md` |
| 2026-09-25    | Planning, two layouts, link pins, workstation and separate public site      | Build, 66 tests, 16 browser workflows and formatting; `PLANNING_PASS.md`               |
| 2026-09-26–27 | Live agent handoff, codes, provisional pins, generated pages and categories | Subsequent regression coverage is included in the review follow-up below               |
| 2026-09-28    | Review fixes, tutorial, agent verification and public-demo alignment        | Build, 102 unit/API tests, 32 browser workflows and formatting; `REVIEW_2026-09-28.md` |

The review follow-up verified actual Chromium tab zoom at 125%, 150%, 200% and 250% at 1440×900 and 1280×720. It covered tutorial panels, workspace size and bounded generated pages. Evidence includes `screenshots/review-2026-09-28-zoom-fixed.png`. Public homepage, guide, demo navigation and the projects link were checked after deployment. No DNS changes were needed.

## Portability and documentation follow-up · 2026-09-28

Changes in this pass:

- Cross-platform startup with explicit port and storage options, plus existing environment-variable support.
- Repository-relative static assets, checklist and skills, so launching elsewhere does not lose required resources.
- Complete exports that fail visibly if required instructions are missing.
- Setup, migration and fork-hosting instructions without personal machine or signed-in-account assumptions.
- Edited requirements and decision records in place of raw conversation transcripts and stale personal handoffs.
- Portability regressions and a CI matrix for supported operating systems.

Verification:

- `npm run build`, all **105** unit/API tests, all **32** browser workflows, formatting and diff checks pass locally.
- A separate checkout in a directory containing spaces installed with `npm ci`, built and passed its 104-test snapshot without private data. A built-app startup check confirmed static resources and default storage from an unrelated directory.
- Portability regressions launch from another directory with an available port and a storage path containing spaces, fetch all agent instructions and export a complete bundle. Missing required instructions cause a visible export failure.
- The [app CI matrix](https://github.com/OscarBarreraGithub/sketchcoded/actions/runs/36489045475) passed all six combinations of macOS, Linux and Windows with Node 22.12 and 24: clean installation, build, all 105 tests and formatting. `.gitattributes` keeps checkout line endings consistent across platforms.
- The [site CI matrix](https://github.com/OscarBarreraGithub/sketchcoded-site/actions/runs/36489091375) passed the same six platform/version combinations for exporter regressions and public-file staging.
- Homepage and guide passed 16 checks across both laptop sizes and all four native zoom levels. Long commands wrap, and the scroll hint has a reserved rail. Fork configuration updates setup commands, prompts and public links together. No browser runtime errors were reported.
- The site now supports board selection by ID and preserves the old example after failed downloads. Deployment stages an explicit list of public files, excluding repository notes and maintenance tools.
- The [published site](https://sketchcoded.com) and [deployment](https://81fb7ac8.sketchcoded.pages.dev) were checked for the updated guide, setup instructions, projects link, original drawings and deployment exclusions. No DNS records changed.
- Private application data and authored drawings were preserved. Task servers and temporary browsers were stopped; the fresh-install checkout and temporary test artifacts were removed.

## Deliberate limits

- Input uses image files on the computer; phone capture is not implemented.
- One local server owns each data directory. Hosted collaboration, authentication and cloud sync are not implemented.
- No model runs inside Sketchcoded. Prose conditions are not executed or proved; generated standard pages are navigable prototypes without a backend.
- Visual verification belongs to the acting agent and the test workflow. Review flow does not inspect pixels.
- Source-folder connections are machine-specific user data. Portable ZIPs omit those paths; reconnect a folder after moving machines if ongoing refresh is needed.
- Public-document cleanup does not erase earlier Git commits.
