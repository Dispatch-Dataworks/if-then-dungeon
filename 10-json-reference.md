# JSON reference (v0.1)

This section documents the expected structure and includes the latest example objects used during design.

## File layout (recommended)
- `rules.json` — global rules and formulas
- `cards.json` — card catalog (IDs → type/rarity/engineKey/params)
- `levels.json` — campaign plan + level definitions + base decks
- `heroes.json` — hero catalog (defaults, stats, upgrades)
- `enemies.json` — enemy catalog (stats, behavior keys, tags, on-hit statuses, modifier effects). Spawn costs stay in `levels.json`.
- `themes.json` — per-theme summary, accent palette, art notes, audio mood and obstacle set

## Level deck model
A level can define its deck as:
- base deck + adjustments, or
- inherit from previous resolved deck + adjustments

Adjustment record:
- `{ "id": "<CARD_ID>", "add": <int> }`

## Pressure spend cap
Default is formula:
- `"formula": "6 + levelNumber"`
Levels may include:
- `"pressureSpendCapOverride": 12`

## Key constraints to enforce
- No cards appear in a level deck before they are introduced.
- Final 3 levels introduce nothing new (22–24).
- At least 1 valid row required to roll.
- All rows must be valid to roll.
- Deterministic retry: restore deck state + pressure + RNG seeds.

## Latest example objects

## Content sections in levels.json
`levels.json` → `content` holds the shared definitions every level refers to:
- `traps`, `mechanics`, `obstacles`, `pickups` — tuning values per ID
- `statuses` — every status and buff, with its rule text (see `07-traps-and-board-mechanics.md` → *Status effects*)
- `boardEffects` — blood tiles and corpses
- `mapLegend` — the character set used by level maps

## Level maps
Each level has a `board`:
```json
"board": {
  "heroFacing": "E",
  "map": [
    "#########",
    "#@..#..A#",
    "#.#.#.#.#",
    "#.#...#.#",
    "#.###.#B#",
    "#C....#X#",
    "#########"
  ],
  "pushPlateDirections": ["S", "W", "E"]
}
```
- One string per row, all the same length. `(0,0)` is the top-left; y grows downward.
- `@` hero start, `X` exit, `A`–`E` spawn points `SP_A`–`SP_E`, `.` floor.
- Obstacles, traps, mechanics and pickups use the symbols in `content.mapLegend`. Conveyors use arrows (`>` `<` `^` `v`) for their direction.
- Push plates (`P`) take their push direction from `pushPlateDirections`, in reading order (left to right, top to bottom).
- `pushPlateDirections` is only present on levels with push plates.

The content tests (`npm run validate`) check every map: rectangular, closed by obstacles on the border, exactly one `@` and `X`, the exit and every spawn point reachable on foot, and the symbols used match the level's `traps`, `mechanics`, `obstacles` and `spawnPoints` lists.

## Examples
The JSON files in the repository root are the source of truth; read them directly rather than copying examples from this document.
