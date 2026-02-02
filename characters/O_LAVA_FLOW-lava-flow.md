# Lava Flow

**ID:** `O_LAVA_FLOW`  
**Category:** Obstruction / Terrain  
**Theme:** fire caverns

## Visual description
Glowing orange lava channel with heat shimmer. Clearly lethal-looking.

## Core rule
In v0.1, treat as **impassable** (obstruction). Later can be passable with heavy damage or special boots.

## Movement interaction
- The hero and enemies **cannot enter** this tile in v0.1.
- When movement is blocked:
  - hero uses clockwise rotation to nearest open direction (per hero default / rules)
  - enemies follow their own deterministic blocked handling

## Line-of-sight interaction
- Default: blocks LoS unless otherwise specified in the level’s tile rules.

## Teaching notes
Matches early teaching examples (lava hazards) while keeping rules simple.

## Level design uses
- Corridors and chokepoints
- Safe pockets vs forced hazard routes
- LoS puzzles for ranged units

## JSON knobs
- blocksMovement (bool)
- blocksLoS (bool)
- hazardOnContact (optional; not used in v0.1)
