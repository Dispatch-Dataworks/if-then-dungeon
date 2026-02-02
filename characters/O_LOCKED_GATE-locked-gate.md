# Locked Gate

**ID:** `O_LOCKED_GATE`  
**Category:** Obstruction / Terrain  
**Theme:** fortress

## Visual description
A heavy wooden gate reinforced with iron bands, shut tight.

## Core rule
Blocks movement. In v0.1, cannot be opened; later could be opened with keys or actions.

## Movement interaction
- The hero and enemies **cannot enter** this tile in v0.1.
- When movement is blocked:
  - hero uses clockwise rotation to nearest open direction (per hero default / rules)
  - enemies follow their own deterministic blocked handling

## Line-of-sight interaction
- Default: blocks LoS unless otherwise specified in the level’s tile rules.

## Teaching notes
Useful as a puzzle constraint (route planning).

## Level design uses
- Corridors and chokepoints
- Safe pockets vs forced hazard routes
- LoS puzzles for ranged units

## JSON knobs
- blocksMovement (bool)
- blocksLoS (bool)
- hazardOnContact (optional; not used in v0.1)
