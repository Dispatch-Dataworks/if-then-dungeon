# Rubble Pile

**ID:** `O_RUBBLE_PILE`  
**Category:** Obstruction / Terrain  
**Theme:** collapsed rooms

## Visual description
A heap of broken stone and beams. Clearly impassable but visually distinct from walls.

## Core rule
Solid like a wall but visually distinct; used to break up corridors.

| Property | Value |
|---|---|
| Map symbol | `%` |
| Blocks movement | Yes |
| Blocks line of sight | Yes |
| Can be jumped over (**A_JUMP_FWD**) | No |
| Used in levels | 2, 3, 6, 8, 9, 18 |

## Movement interaction
- The hero and enemies **cannot enter** this tile.
- A blocked move fails and still uses the loop. **S_WALL_AHEAD** and **S_BLOCKED_AHEAD** are true when this tile is directly ahead.
- Hero default behaviors that rotate when blocked use clockwise preference (counter-clockwise while **cursed**).

## Line-of-sight interaction
- Blocks line of sight: enemies behind it are not visible and ranged attacks cannot pass.

## Teaching notes
Pairs well with hazards placed on the only alternate route.

## Level design uses
- Corridors and chokepoints
- Safe pockets vs forced hazard routes
- LoS puzzles for ranged units

## JSON knobs
- blocksMovement (bool)
- blocksLoS (bool)
- jumpable (bool)
