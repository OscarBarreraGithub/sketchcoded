# Sketchcoded

**Ideas, connected.** Draw the screens of the app you're imagining, pin them to a board, tie them together with yarn, and hand your agent a plan it can build from. It runs on your computer; your sketches never leave it. No account, no API key.

![A Sketchcoded board](docs/screenshots/board.png)

The [guide](https://sketchcoded.com/guide) covers everything in detail, and [the example](https://sketchcoded.com/demo) is the board this project was planned on.

## Run it

Requires Node.js 22.12 or later.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5173 and stop the server with Ctrl+C when you are done. For the built app, run `npm run build` and then `npm start`.

- `--port 0` picks a free port: `npm run dev -- --port 0`.
- `--data-dir "./my boards"` keeps boards somewhere else. By default they are in `.drawcode/` inside this checkout, which Git ignores.

The server listens on 127.0.0.1 only. Run one server per data directory.

## What you do

1. **Bring your sketches.** Drop image files into the library, or connect a folder to keep watching it.
2. **Plan, if you like.** List what each screen should do before you draw it; planned frames wait on the board.
3. **Pin and connect.** Click a screen to open it, add a pin where something happens, and tie yarn to the screen it leads to. A yarn's color is its category: main path, branch, detour or way back.
4. **Leave pages to the AI.** A frame wearing the post-it becomes a standard page built from its plan; draw only the pages you care about.
5. **Check it.** **Review flow** finds dead ends and missing ways back. **Test flow** lets you click through the sketches.
6. **Hand it over.** Every view has a **Tell the agent** button that copies a short prompt. Your agent reads the live board from the running app and writes back to it. **Export project** saves a `.sketchcoded.zip` with the board, its drawings, `flow.md` and the agent's instructions.

## Your rules

`docs/BUILD_CHECKLIST.md` is the list of requirements an agent checks before calling work done: text you can read without zooming in, nothing overlapping, zoom that works all the way in, and more. Edit it to make it yours. `docs/skills/` holds the instructions agents follow. The app serves both and includes them in every export.

## Your files

Boards save automatically, and each save keeps the previous version as a `.bak` next to it. To move boards to another computer, export them and use **Import project** there.

## Development

```sh
npm test               # unit and API tests
npm run build          # type check and build
npx playwright install chromium
npm run test:ui        # browser tests, on an isolated server at port 5174
npm run format:check
```

The browser tests include real browser zoom at 125% to 250%. `AGENTS.md` has the conventions for agents working on this repository.

## License

The code is MIT licensed; see [LICENSE](LICENSE). The hand-drawn logo in `public/brand/` and `public/favicon.svg` is the author's own and is not covered by it.
