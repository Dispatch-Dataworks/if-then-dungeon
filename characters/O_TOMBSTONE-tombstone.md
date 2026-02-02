# Tombstone

**ID:** `O_TOMBSTONE`  
**Category:** Obstruction / Terrain  
**Theme:** graveyard

## Visual description
A crooked headstone and disturbed soil. Adds eerie tone without gore.

## Core rule
Blocks movement. Blocks LoS partially (tunable). In v0.1, treat as blocking LoS.

## Movement interaction
- The hero and enemies **cannot enter** this tile in v0.1.
- When movement is blocked:
  - hero uses clockwise rotation to nearest open direction (per hero default / rules)
  - enemies follow their own deterministic blocked handling

## Line-of-sight interaction
- Default: blocks LoS unless otherwise specified in the level’s tile rules.

## Teaching notes
Creates cover behavior for ranged enemies.

## Level design uses
- Corridors and chokepoints
- Safe pockets vs forced hazard routes
- LoS puzzles for ranged units

## JSON knobs
- blocksMovement (bool)
- blocksLoS (bool)
- hazardOnContact (optional; not used in v0.1)
