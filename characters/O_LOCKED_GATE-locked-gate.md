# Locked Gate

**ID:** `O_LOCKED_GATE`  
**Category:** Obstruction / Terrain  
**Theme:** fortress

## Visual description
A heavy wooden gate reinforced with iron bands, shut tight.

## Core rule
Solid. Signals "not this way" in chapels and catacombs (keys may open gates in a later version).

| Property | Value |
|---|---|
| Map symbol | `=` |
| Blocks movement | Yes |
| Blocks line of sight | Yes |
| Can be jumped over (**A_JUMP_FWD**) | No |
| Used in levels | 12, 13, 14, 15 |

## Movement interaction
- The hero and enemies **cannot enter** this tile.
- A blocked move fails and still uses the loop. **S_WALL_AHEAD** and **S_BLOCKED_AHEAD** are true when this tile is directly ahead.
- Hero default behaviors that rotate when blocked use clockwise preference (counter-clockwise while **cursed**).

## Line-of-sight interaction
- Blocks line of sight: enemies behind it are not visible and ranged attacks cannot pass.

## Teaching notes
Useful as a puzzle constraint (route planning).

## Level design uses
- Corridors and chokepoints
- Safe pockets vs forced hazard routes
- LoS puzzles for ranged units

## JSON knobs
- blocksMovement (bool)
- blocksLoS (bool)
- jumpable (bool)
