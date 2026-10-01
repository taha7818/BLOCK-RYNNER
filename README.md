# BLOCK-RYNNER: Riftbound

A dependency-free canvas platformer built for GitHub Pages. Riftbound preserves the original game's run, jump, stomp, coin and synth-audio identity while expanding it into a 100-level campaign.

## Run locally

From this directory:

```sh
npm test
npm run serve
```

Then open `http://localhost:8080`.

## Controls

- `A` / `D` or arrow keys: move
- `Space`, `W`, or up arrow: jump / double jump
- `Shift`: sprint
- `X` or tap/click the canvas: fire during boss battles
- `Escape`: pause

Touch controls appear on coarse-pointer devices.

## Architecture

- `js/levels.js` deterministically builds and exports all 100 level configurations. Each seed has a unique route, platform distribution, hazards and enemy encounters.
- `js/dimensions.js` defines ten world palettes and physics rules.
- `js/bosses.js` contains the ten guardian definitions and their attack state machine.
- `js/player.js` and `js/enemies.js` isolate physics and behavior.
- `js/save.js` owns versioned localStorage persistence.
- `js/shop.js`, `js/ui.js`, and `js/audio.js` own their respective systems.
- `js/game.js` coordinates gameplay and canvas rendering.

No build step or server-side routing is required. Copy this folder to a repository root and enable GitHub Pages from the desired branch.
