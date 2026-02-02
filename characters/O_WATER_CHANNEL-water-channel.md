# Water Channel

**ID:** `O_WATER_CHANNEL`  
**Category:** Obstruction / Terrain  
**Theme:** sewers

## Visual description
A shallow dark channel with ripples and slime along the edges.

## Core rule
In v0.1, treat as impassable. Later could be slow terrain instead of a wall.

## Movement interaction
- The hero and enemies **cannot enter** this tile in v0.1.
- When movement is blocked:
  - hero uses clockwise rotation to nearest open direction (per hero default / rules)
  - enemies follow their own deterministic blocked handling

## Line-of-sight interaction
- Default: blocks LoS unless otherwise specified in the level’s tile rules.

## Teaching notes
Helps teach that not all boundaries are 'walls' visually.

## Level design uses
- Corridors and chokepoints
- Safe pockets vs forced hazard routes
- LoS puzzles for ranged units

## JSON knobs
- blocksMovement (bool)
- blocksLoS (bool)
- hazardOnContact (optional; not used in v0.1)
