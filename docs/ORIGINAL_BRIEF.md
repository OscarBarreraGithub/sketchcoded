# Original product brief

Product scope established on 2026-09-07. This edited specification preserves the original requirements; later refinements are recorded in [SKETCHCODED_REQUESTS.md](SKETCHCODED_REQUESTS.md).

## Purpose

Build a local visual tool for designing interfaces and their navigation from rough sketches. The result should be useful both as a playable prototype and as a structured specification for a future implementation agent.

## Sketch library and board

Users draw screens on paper, a whiteboard or any other medium, then bring image files from their computer into a library. Support importing images and connecting a local folder.

Images can be dragged onto a flexible bulletin board and arranged freely. A brief tack animation reinforces the physical-board metaphor. Each screen requires a title displayed on a paper label. Panning and zooming should make both the overall plan and individual drawings easy to inspect.

## Pins and connections

Opening a screen allows the user to place a pin over an interface element and describe its intended behavior. On the board, yarn connects that pin to another screen. Selecting the yarn opens an editor for the branch summary, conditions, detailed logic and data needed by the destination.

One pin can have several outgoing connections. For example, selecting a recent conversation might open its chat screen or a blocked-user view, depending on the condition. A screen can represent a reusable view whose content depends on supplied data.

## Structured specification

Represent screens, pins and transitions as a versioned graph. Preserve the natural-language intent beside explicit references and navigation semantics. Presentation on the board is separate from application behavior. The exported graph, images and readable specification should provide the context a future agent needs.

## Structural review

Detect missing routes, unreachable screens and possible one-way navigation. Handle intentional exceptions through individual review with a recorded reason: a login screen, for example, may deliberately prevent a return after authentication. A screen's label alone must not suppress a finding.

Checks must state their limits. Structural reachability does not prove that a natural-language condition can occur, nor that every branch is covered. Significant changes should invalidate related acceptances so they can be reviewed again.

## Test flow

Provide an interactive preview built from the sketches. Clicking a pin follows its connection. When a pin has multiple branches, show their summaries and conditions so the user can choose a scenario. Keep simulator rewind separate from navigation authored into the app.

## Scope and continuity

Deliver the local designer, graph, review and preview first. Defer the integrated agentic generation and review workflow; the initial product must preserve enough information to support it later. Record progress, significant decisions and verification evidence so development can continue across sessions.
