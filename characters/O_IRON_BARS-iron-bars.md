# Iron Bars

**ID:** `O_IRON_BARS`  
**Category:** Obstruction / Terrain  
**Theme:** cells / prison

## Visual description
Vertical iron bars bolted into stone, with a rusty lock plate.

## Core rule
Blocks movement; may or may not block LoS (tunable). In v0.1, treat as blocking movement and LoS.

## Movement interaction
- The hero and enemies **cannot enter** this tile in v0.1.
- When movement is blocked:
  - hero uses clockwise rotation to nearest open direction (per hero default / rules)
  - enemies follow their own deterministic blocked handling

## Line-of-sight interaction
- Default: blocks LoS unless otherwise specified in the level’s tile rules.

## Teaching notes
Good for teaching LoS edge cases later if made LoS-passable.

## Level design uses
- Corridors and chokepoints
- Safe pockets vs forced hazard routes
- LoS puzzles for ranged units

## JSON knobs
- blocksMovement (bool)
- blocksLoS (bool)
- hazardOnContact (optional; not used in v0.1)
