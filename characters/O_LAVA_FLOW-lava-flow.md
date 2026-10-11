# Lava Flow

**ID:** `O_LAVA_FLOW`  
**Category:** Obstruction / Terrain  
**Theme:** fire caverns

## Visual description
Glowing orange lava channel with heat shimmer. Clearly lethal-looking.

## Core rule
See-through and jumpable: **A_JUMP_FWD** clears a 1-tile flow. Walking in is never allowed, so it is never an instant kill.

| Property | Value |
|---|---|
| Map symbol | `L` |
| Blocks movement | Yes |
| Blocks line of sight | No |
| Can be jumped over (**A_JUMP_FWD**) | Yes, if the landing tile is open |
| Used in levels | 7, 8, 9 |

## Movement interaction
- The hero and enemies **cannot enter** this tile.
- A blocked move fails and still uses the loop. **S_WALL_AHEAD** and **S_BLOCKED_AHEAD** are true when this tile is directly ahead.
- Hero default behaviors that rotate when blocked use clockwise preference (counter-clockwise while **cursed**).

## Line-of-sight interaction
- Does **not** block line of sight: units can see and shoot across it.

## Teaching notes
Matches early teaching examples (lava hazards) while keeping rules simple.

## Level design uses
- Corridors and chokepoints
- Safe pockets vs forced hazard routes
- LoS puzzles for ranged units

## JSON knobs
- blocksMovement (bool)
- blocksLoS (bool)
- jumpable (bool)
