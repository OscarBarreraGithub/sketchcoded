# Graph contract, version 1

`shared/model.ts` is the executable schema. Every export includes its JSON Schema as `schema.json`. The JSON project is canonical; `flow.md` supplies a convenient reading order for future agents and human reviewers.

## Records

| Record     | Purpose                                                                                                                                                                                                                                                     |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Project    | Schema version, stable ID, name, storage revision, timestamps, graph arrays, presentation, and decisions.                                                                                                                                                   |
| Asset      | Stable ID, immutable content-addressed WebP filename, dimensions, original filename, import timestamp, and an optional local source path. Source paths are removed on export.                                                                               |
| Screen     | Stable ID, asset reference, title, purpose, explicit entry flag, and role (`screen`, `auth`, `modal`, `terminal`, `detail`). Represents a view, potentially reusable for many records.                                                                      |
| Pin        | Stable ID, owning screen, normalized `x/y` from the image’s top-left, short name, free-text intent, optional `kind` (`interaction` or `detail`), and optional `detailTarget` screen ID. Its position is anchored to the image, not the rendered board size. |
| Transition | Stable ID, source pin, target screen or dynamic history destination, summary, condition, detailed logic, context passed, fallback flag, navigation kind, and yarn color.                                                                                    |
| Layout     | Map from screen IDs to world-space position and display width. No routing semantics.                                                                                                                                                                        |
| Viewport   | Pan and zoom, independent of graph semantics.                                                                                                                                                                                                               |
| Review     | Finding identity, evidence fingerprint, reason, author, and acceptance timestamp.                                                                                                                                                                           |

Transitions form a **directed multigraph**. Several transitions may share the same source pin and destination. Each interaction should be read with _all_ of its outgoing transitions, not as independent pairs of screenshots.

A selected chat is modeled as context on a transition to a reusable conversation screen, not as a separate screen node for every user. `context` is a human-written description of values such as `conversationId`; the preview does not create application data or execute bindings.

## Navigation semantics

`push` appends a page frame. `replace` swaps the current frame and preserves whether it is a modal root. `reset` discards the entire stack. `modal` appends a modal root whose previous frame is its caller.

`back` and `dismiss` must have `target: null`. Back pops one frame. Dismiss removes the most recent modal root and everything above it, returning to its actual caller. It works with nested dialogs. An action without the required caller is explicitly unavailable in preview.

Starting at a screen in preview creates fresh history. Selecting a non-entry screen is a deliberate testing convenience, labeled as a test entry. The preview’s separate rewind uses saved simulator snapshots and is never interpreted as an authored return route.

## Detail references

A pin with `kind: "detail"` and `detailTarget: "screen-id"` points to an enlarged or supporting illustration. Missing `kind` means `interaction`, preserving existing version-1 projects without rewriting them. The optional fields extend version 1; exports include the current full JSON Schema. A dedicated illustration has screen `role: "detail"` and cannot be an app entry. A detail pin may also reference an existing app screen as an illustration while that screen retains its normal navigation role.

References form a separate relation from `transitions`. They never make an app screen reachable, satisfy a return path, or add a preview history frame. Dedicated detail screens are excluded from app entry, reachability, and dead-end checks. A missing/unattached reference still produces a finding. Reference cycles that cannot be reached from any app sketch also produce a warning. Supporting illustrations do not invalidate navigation acceptance by changing app topology. A reference mixed with app transitions, an invalid/self target, or a detail marked as an entry produces an unwaivable error. Deleting a detail target clears attached pins’ target IDs and leaves a repairable missing-reference finding.

The UI marks an otherwise unused regular target as `detail` when attached. It preserves an entry or already connected screen’s role. Reference browsing can follow further detail pins with its own Back controls, without changing app history. It does not silently change that role back when detached; the author can reuse the illustration or change its type. The outline groups detail sketches separately and exports describe their illustrative purpose explicitly.

## Automated review

The checker operates on the explicit graph, not on guesses about drawn controls or natural-language business rules.

**Definite errors:** duplicate IDs, missing asset references, missing board positions, orphan pins/connections, missing targets, and fixed targets attached to dynamic history actions. These cannot be waived.

**Structural warnings:** missing entries/titles/pin intent, disconnected pins, screens unreachable from every declared entry, screens without outgoing interactions, ambiguous branch summaries, and multiple default fallbacks. Some can be intentional, so the UI permits reasoned acknowledgment.

**Semantic review:** conditions written in prose, one-way transitions without an evident structural return, entry/arrival contexts that may lack history, and terminal screens missing an explanation. The checker never infers an exception from a title such as “Login.”

Reachability starts from all explicitly declared entries and treats forward conditional edges as **possible**. Dynamic history actions do not make a new screen reachable. Return-path checks allow indirect forward routes. A directly available authored Back can return from a push/modal destination; an authored Dismiss can return from a modal destination. A reset does not gain a return path from a Back button.

A documented terminal screen is treated as an intentional end. Merely selecting the terminal role without explaining its purpose surfaces a review concern and the potential dead end.

### What a clean review does and does not mean

A clean structural review means there are no _open findings under these rules_. It does not prove that the app is complete or runnable. In particular:

- Natural-language conditions may overlap, omit a case, or be impossible. A fallback label records intent, not a tested predicate.
- A structural cycle can still be unavailable for a particular authentication state, selected record, or permission context. Conditional branches require semantic review even when a return path exists.
- History checks conservatively inspect authored arrival contexts. They do not exhaustively enumerate every possible runtime stack. Indirect returns through history and complicated modal/replace sequences can require a reasoned review decision.
- A modal screen can have different callers. Dismiss uses the caller from the chosen preview path.
- Separate entry points can represent signed-out, signed-in, deep-link, or external launch contexts, but those runtime prerequisites still need implementation logic.
- Inline errors, loading, empty states, and external effects can be described in screen/pin/transition prose. They are not separately simulated unless represented as screens and connections.

## Acceptance and invalidation

Each finding has a stable identity derived from its rule and subject IDs, plus a deterministic fingerprint of the evidence for that rule. The fingerprint uses noncryptographic content hashing; it is an invalidation key, not a signature or security boundary.

An acceptance needs a nonempty reason. Review metadata is separate from graph content and is excluded from its own evidence to avoid self-invalidating decisions. Branch review depends on the interaction description and branch semantics. Reachability and return-route review include topology evidence; their scope is intentionally conservative because a change elsewhere may create or remove an indirect path. Layout coordinates, viewport changes, and yarn colors do not invalidate navigation decisions.

If current evidence differs, the finding is marked **changed / review again**, its old reason remains visible, and it counts as open. A removed finding’s saved decision remains in resolved history. An acceptance records human intent rather than modifying the graph or adding a fictitious reverse edge.

Future agents can read the same graph and findings and propose decisions with their own attribution. No agent invocation, approval bypass, or executable natural-language evaluation is implemented in this version.

## Storage and portability

The server assigns monotonically increasing project revisions. It serializes saves per project, rejects stale revisions, writes to a temporary file, copies the previous file to `.bak`, then renames the temporary file. The client debounces edits and serializes saves so a late response cannot replace newer in-memory work.

A bundle is imported as a new project ID. The schema, graph references, asset hashes, and asset dimensions are validated. Files are read from fixed expected archive paths; arbitrary archive paths are never extracted to the filesystem. Imported projects start with disconnected source folders and retain their portable snapshots.
