# Water Channel

**ID:** `O_WATER_CHANNEL`  
**Category:** Obstruction / Terrain  
**Theme:** sewers

## Visual description
A shallow dark channel with ripples and slime along the edges.

## Core rule
See-through and jumpable: **A_JUMP_FWD** clears a 1-tile channel.

| Property | Value |
|---|---|
| Map symbol | `~` |
| Blocks movement | Yes |
| Blocks line of sight | No |
| Can be jumped over (**A_JUMP_FWD**) | Yes, if the landing tile is open |
| Used in levels | 4, 5, 6, 19, 20, 21 |

## Movement interaction
- The hero and enemies **cannot enter** this tile.
- A blocked move fails and still uses the loop. **S_WALL_AHEAD** and **S_BLOCKED_AHEAD** are true when this tile is directly ahead.
- Hero default behaviors that rotate when blocked use clockwise preference (counter-clockwise while **cursed**).

## Line-of-sight interaction
- Does **not** block line of sight: units can see and shoot across it.

## Teaching notes
Helps teach that not all boundaries are 'walls' visually.

## Level design uses
- Corridors and chokepoints
- Safe pockets vs forced hazard routes
- LoS puzzles for ranged units

## JSON knobs
- blocksMovement (bool)
- blocksLoS (bool)
- jumpable (bool)
