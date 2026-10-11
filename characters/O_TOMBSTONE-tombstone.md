# Tombstone

**ID:** `O_TOMBSTONE`  
**Category:** Obstruction / Terrain  
**Theme:** graveyard

## Visual description
A crooked headstone and disturbed soil. Adds eerie tone without gore.

## Core rule
Solid; gives cover from ranged enemies in catacombs and chapels.

| Property | Value |
|---|---|
| Map symbol | `+` |
| Blocks movement | Yes |
| Blocks line of sight | Yes |
| Can be jumped over (**A_JUMP_FWD**) | No |
| Used in levels | 10, 11, 12, 13, 14, 15, 23 |

## Movement interaction
- The hero and enemies **cannot enter** this tile.
- A blocked move fails and still uses the loop. **S_WALL_AHEAD** and **S_BLOCKED_AHEAD** are true when this tile is directly ahead.
- Hero default behaviors that rotate when blocked use clockwise preference (counter-clockwise while **cursed**).

## Line-of-sight interaction
- Blocks line of sight: enemies behind it are not visible and ranged attacks cannot pass.

## Teaching notes
Creates cover behavior for ranged enemies.

## Level design uses
- Corridors and chokepoints
- Safe pockets vs forced hazard routes
- LoS puzzles for ranged units

## JSON knobs
- blocksMovement (bool)
- blocksLoS (bool)
- jumpable (bool)
