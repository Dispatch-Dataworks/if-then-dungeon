# Stone Wall

**ID:** `O_STONE_WALL`  
**Category:** Obstruction / Terrain  
**Theme:** ruins / dungeons

## Visual description
A solid stone block wall, cracked and mossy. Fully opaque and impassable.

## Core rule
The basic wall. Triggers **S_WALL_AHEAD** and **S_BLOCKED_AHEAD**.

| Property | Value |
|---|---|
| Map symbol | `#` |
| Blocks movement | Yes |
| Blocks line of sight | Yes |
| Can be jumped over (**A_JUMP_FWD**) | No |
| Used in levels | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24 |

## Movement interaction
- The hero and enemies **cannot enter** this tile.
- A blocked move fails and still uses the loop. **S_WALL_AHEAD** and **S_BLOCKED_AHEAD** are true when this tile is directly ahead.
- Hero default behaviors that rotate when blocked use clockwise preference (counter-clockwise while **cursed**).

## Line-of-sight interaction
- Blocks line of sight: enemies behind it are not visible and ranged attacks cannot pass.

## Teaching notes
Creates corridors and chokepoints; encourages turn/rotate logic.

## Level design uses
- Corridors and chokepoints
- Safe pockets vs forced hazard routes
- LoS puzzles for ranged units

## JSON knobs
- blocksMovement (bool)
- blocksLoS (bool)
- jumpable (bool)
