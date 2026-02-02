# Conveyor

**ID:** `M_CONVEYOR`  
**Category:** Board Mechanic  
**Theme:** factory / dungeon machinery

## Visual description
Stone or metal belt with directional arrows.

## What it does
At tick end (after actions), forced move 1 tile in conveyor direction if open. If blocked, no forced move.

## When it resolves
- Resolves at a defined timing point in the tick order (recommendation):
  1) hero action
  2) pickups
  3) trap triggers
  4) enemy actions
  5) mechanic forced movement / cadence
- Exact ordering is fixed per level (campaign-wide standard recommended).

## Telegraphed cues
- Must be obvious via tile art (arrows, glow, vent steam).
- Timed mechanics must show state one tick early.

## Teaching notes
Teaches ordering: even if a rule moves you safely, conveyors can reposition you.

## JSON knobs
- cadence/cycle arrays
- force direction
- damage/effects
- affected entities (hero only vs all)
