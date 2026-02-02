# Chasm Edge

**ID:** `O_CHASM_EDGE`  
**Category:** Obstruction / Terrain  
**Theme:** caverns

## Visual description
A black drop-off with broken rock lip. Highly visible 'do not step' boundary.

## Core rule
Impassable boundary tile. In v0.1, treat as a wall boundary (cannot enter).

## Movement interaction
- The hero and enemies **cannot enter** this tile in v0.1.
- When movement is blocked:
  - hero uses clockwise rotation to nearest open direction (per hero default / rules)
  - enemies follow their own deterministic blocked handling

## Line-of-sight interaction
- Default: blocks LoS unless otherwise specified in the level’s tile rules.

## Teaching notes
Supports maze-like layouts and fear-of-falling atmosphere.

## Level design uses
- Corridors and chokepoints
- Safe pockets vs forced hazard routes
- LoS puzzles for ranged units

## JSON knobs
- blocksMovement (bool)
- blocksLoS (bool)
- hazardOnContact (optional; not used in v0.1)
