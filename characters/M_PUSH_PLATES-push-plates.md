# Push Plates

**ID:** `M_PUSH_PLATES`  
**Category:** Board Mechanic  
**Map symbol:** `P`  
**Theme:** trapped corridors

## Visual description
A pressure plate with carved arrow indicating push direction.

## What it does
When stepped on, pushes hero 1 tile in plate direction if open. If blocked, no movement. Trigger is deterministic.

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
Great for teaching why 'blocked' outcomes still consume ticks and why default behavior matters.

## JSON knobs
- cadence/cycle arrays
- force direction
- damage/effects
- affected entities (hero only vs all)
