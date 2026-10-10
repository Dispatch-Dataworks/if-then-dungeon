# Bone Pile

**ID:** `O_BONE_PILE`  
**Category:** Obstruction / Terrain  
**Theme:** ossuary

## Visual description
A mound of bones that clatters when brushed. Ominous but stylized.

## Core rule
Low mound: does not block sight, and **A_JUMP_FWD** can leap over it.

| Property | Value |
|---|---|
| Map symbol | `&` |
| Blocks movement | Yes |
| Blocks line of sight | No |
| Can be jumped over (**A_JUMP_FWD**) | Yes, if the landing tile is open |
| Used in levels | 10, 11, 12, 23 |

## Movement interaction
- The hero and enemies **cannot enter** this tile.
- A blocked move fails and still uses the loop. **S_WALL_AHEAD** and **S_BLOCKED_AHEAD** are true when this tile is directly ahead.
- Hero default behaviors that rotate when blocked use clockwise preference (counter-clockwise while **cursed**).

## Line-of-sight interaction
- Does **not** block line of sight: units can see and shoot across it.

## Teaching notes
Adds horror flavor and hiding spots for small enemies.

## Level design uses
- Corridors and chokepoints
- Safe pockets vs forced hazard routes
- LoS puzzles for ranged units

## JSON knobs
- blocksMovement (bool)
- blocksLoS (bool)
- jumpable (bool)
