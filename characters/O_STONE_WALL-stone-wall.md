# Stone Wall

**ID:** `O_STONE_WALL`  
**Category:** Obstruction / Terrain  
**Theme:** ruins / dungeons

## Visual description
A solid stone block wall, cracked and mossy. Fully opaque and impassable.

## Core rule
Blocks movement and line-of-sight. Not interactable in v0.1.

## Movement interaction
- The hero and enemies **cannot enter** this tile in v0.1.
- When movement is blocked:
  - hero uses clockwise rotation to nearest open direction (per hero default / rules)
  - enemies follow their own deterministic blocked handling

## Line-of-sight interaction
- Default: blocks LoS unless otherwise specified in the level’s tile rules.

## Teaching notes
Creates corridors and chokepoints; encourages turn/rotate logic.

## Level design uses
- Corridors and chokepoints
- Safe pockets vs forced hazard routes
- LoS puzzles for ranged units

## JSON knobs
- blocksMovement (bool)
- blocksLoS (bool)
- hazardOnContact (optional; not used in v0.1)
