# Thorn Brambles

**ID:** `O_THORN_BRAMBLES`  
**Category:** Obstruction / Terrain  
**Theme:** overgrown ruins

## Visual description
Dense brambles with thorns and red berries; looks painful to cross.

## Core rule
In v0.1, impassable. Later could become passable with damage or a 'cut' action.

## Movement interaction
- The hero and enemies **cannot enter** this tile in v0.1.
- When movement is blocked:
  - hero uses clockwise rotation to nearest open direction (per hero default / rules)
  - enemies follow their own deterministic blocked handling

## Line-of-sight interaction
- Default: blocks LoS unless otherwise specified in the level’s tile rules.

## Teaching notes
Good for creating soft-looking but functionally hard boundaries.

## Level design uses
- Corridors and chokepoints
- Safe pockets vs forced hazard routes
- LoS puzzles for ranged units

## JSON knobs
- blocksMovement (bool)
- blocksLoS (bool)
- hazardOnContact (optional; not used in v0.1)
