# Bone Pile

**ID:** `O_BONE_PILE`  
**Category:** Obstruction / Terrain  
**Theme:** ossuary

## Visual description
A mound of bones that clatters when brushed. Ominous but stylized.

## Core rule
Blocks movement; does not trigger damage by itself.

## Movement interaction
- The hero and enemies **cannot enter** this tile in v0.1.
- When movement is blocked:
  - hero uses clockwise rotation to nearest open direction (per hero default / rules)
  - enemies follow their own deterministic blocked handling

## Line-of-sight interaction
- Default: blocks LoS unless otherwise specified in the level’s tile rules.

## Teaching notes
Adds horror flavor and hiding spots for small enemies.

## Level design uses
- Corridors and chokepoints
- Safe pockets vs forced hazard routes
- LoS puzzles for ranged units

## JSON knobs
- blocksMovement (bool)
- blocksLoS (bool)
- hazardOnContact (optional; not used in v0.1)
