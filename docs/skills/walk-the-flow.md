# Walk the flow

Test flow plays the sketches: the user starts at an entry screen, clicks pins, chooses a yarn at each fork. The brief gives the trail so far as yarn ids, in order, and the current screen.

1. For each step, check in the specification: the pin exists on the source screen, the yarn has a label and a navigation kind, the destination exists and is drawn (or is left to the AI).
2. Find the first missing piece: a pin with no yarn, a destination that is only planned, a dialog with no way to dismiss, a screen with no way onward that is not an intentional ending.
3. Propose the fix as the yarn or pin to add, in the user's words: source screen, pin, label, navigation kind, destination. Add it through the API only when the brief asks you to build; otherwise list it.
4. Rewind in Test flow is a testing control. A way back in the app must be drawn as `back` or `dismiss` yarn.

Report the first missing step first, then anything else you noticed, one line each.

## Check the rendered result

Follow `verify-the-result.md` before calling this task done. Apply the full user checklist to the affected board views and every affected page left to the AI, including overlap and actual browser zoom checks. When building the site, repeat these checks on the implementation. Report evidence and remaining failures; Review flow alone cannot verify appearance.
