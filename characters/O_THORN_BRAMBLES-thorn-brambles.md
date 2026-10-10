# Thorn Brambles

**ID:** `O_THORN_BRAMBLES`  
**Category:** Obstruction / Terrain  
**Theme:** overgrown ruins

## Visual description
Dense brambles with thorns and red berries; looks painful to cross.

## Core rule
Solid and opaque; the Rotwood equivalent of a wall.

| Property | Value |
|---|---|
| Map symbol | `*` |
| Blocks movement | Yes |
| Blocks line of sight | Yes |
| Can be jumped over (**A_JUMP_FWD**) | No |
| Used in levels | 19, 20, 21, 24 |

## Movement interaction
- The hero and enemies **cannot enter** this tile.
- A blocked move fails and still uses the loop. **S_WALL_AHEAD** and **S_BLOCKED_AHEAD** are true when this tile is directly ahead.
- Hero default behaviors that rotate when blocked use clockwise preference (counter-clockwise while **cursed**).

## Line-of-sight interaction
- Blocks line of sight: enemies behind it are not visible and ranged attacks cannot pass.

## Teaching notes
Good for creating soft-looking but functionally hard boundaries.

## Level design uses
- Corridors and chokepoints
- Safe pockets vs forced hazard routes
- LoS puzzles for ranged units

## JSON knobs
- blocksMovement (bool)
- blocksLoS (bool)
- jumpable (bool)
