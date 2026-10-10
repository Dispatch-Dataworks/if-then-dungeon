# Iron Bars

**ID:** `O_IRON_BARS`  
**Category:** Obstruction / Terrain  
**Theme:** cells / prison

## Visual description
Vertical iron bars bolted into stone, with a rusty lock plate.

## Core rule
See-through: archers can shoot through bars and the hero can see enemies behind them, but nobody can walk through. Great for teaching that **S_ENEMY_VISIBLE** does not mean "reachable".

| Property | Value |
|---|---|
| Map symbol | `\|` |
| Blocks movement | Yes |
| Blocks line of sight | No |
| Can be jumped over (**A_JUMP_FWD**) | No |
| Used in levels | 3, 4, 5, 7, 9, 14, 16, 17, 18, 22, 24 |

## Movement interaction
- The hero and enemies **cannot enter** this tile.
- A blocked move fails and still uses the loop. **S_WALL_AHEAD** and **S_BLOCKED_AHEAD** are true when this tile is directly ahead.
- Hero default behaviors that rotate when blocked use clockwise preference (counter-clockwise while **cursed**).

## Line-of-sight interaction
- Does **not** block line of sight: units can see and shoot across it.

## Teaching notes
Teaches a key line-of-sight edge case: an enemy can be visible (and shoot you) while being unreachable.

## Level design uses
- Corridors and chokepoints
- Safe pockets vs forced hazard routes
- LoS puzzles for ranged units

## JSON knobs
- blocksMovement (bool)
- blocksLoS (bool)
- jumpable (bool)
