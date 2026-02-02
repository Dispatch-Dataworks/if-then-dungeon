# Rubble Pile

**ID:** `O_RUBBLE_PILE`  
**Category:** Obstruction / Terrain  
**Theme:** collapsed rooms

## Visual description
A heap of broken stone and beams. Clearly impassable but visually distinct from walls.

## Core rule
Blocks movement; may reduce safe tile options and create forced detours.

## Movement interaction
- The hero and enemies **cannot enter** this tile in v0.1.
- When movement is blocked:
  - hero uses clockwise rotation to nearest open direction (per hero default / rules)
  - enemies follow their own deterministic blocked handling

## Line-of-sight interaction
- Default: blocks LoS unless otherwise specified in the level’s tile rules.

## Teaching notes
Pairs well with hazards placed on the only alternate route.

## Level design uses
- Corridors and chokepoints
- Safe pockets vs forced hazard routes
- LoS puzzles for ranged units

## JSON knobs
- blocksMovement (bool)
- blocksLoS (bool)
- hazardOnContact (optional; not used in v0.1)
