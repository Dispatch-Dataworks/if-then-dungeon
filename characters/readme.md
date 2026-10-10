# Character sheets

One Markdown sheet per game entity. These are design references for art and implementation; the numbers that the engine uses live in `cards.json` and `levels.json`.

## File naming
`<ID>-<slug>.md`, for example `T_BLEED_VINES-bleed-vines.md`. The ID must match the ID used in the JSON files.

| Prefix | Category | JSON source |
|---|---|---|
| `H_` | Hero | `heroes.json` |
| `E_` | Enemy | `enemies.json` (stats); `levels.json` → `enemies.spawnCostsBase` (cost) |
| `MOD_` | Enemy modifier | `enemies.json` → `modifiers`; cost in `levels.json` → `enemies.modifierCostAdders` (lowercase key, e.g. `MOD_IRON` = `iron`) |
| `T_` | Trap | `levels.json` → `content.traps` |
| `M_` | Board mechanic | `levels.json` → `content.mechanics` |
| `O_` | Obstruction / terrain | `levels.json` → `content.obstacles` |
| `P_` | Pickup | `levels.json` → `content.pickups` |

Modifier sheets carry a `**JSON key:**` line so the two naming styles can't drift apart.

## Required fields
Every sheet starts with (traps, mechanics, obstacles and pickups also list their `**Map symbol:**`):
```
# <Name>

**ID:** `<ID>`
**Category:** <Hero | Enemy | Enemy Modifier | Trap | Board Mechanic | Obstruction / Terrain | Pickup>
```
The placeholder generator (`npm run placeholders`) reads these fields, so keep the format exact.

## Adding a new entity
1. Add it to the JSON (if it is used by levels).
2. Copy a sheet from the same category and fill it in.
3. Run `npm run placeholders` to create its placeholder image in `assets/placeholders/characters/`.
4. Run `npm run validate`. It fails if any hero, enemy, modifier, trap, mechanic, obstacle or pickup has no sheet, or if any card or sheet has no placeholder image.

## Art
Final images replace the placeholders in `assets/placeholders/` (same file name, `<ID>`). The style references are in `branding/` and `Style-guide.md`.
