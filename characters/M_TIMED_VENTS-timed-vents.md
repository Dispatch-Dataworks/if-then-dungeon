# Timed Vents

**ID:** `M_TIMED_VENTS`  
**Category:** Board Mechanic  
**Map symbol:** `e`  
**Theme:** industrial / vents

## Visual description
Floor grates that cycle between safe and harmful phases.

## What it does
At tick end, if vents are ON and the hero/enemy is in the region, apply damage/effect. Cycle example: [2 off, 2 on].

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
Used to teach cadence timers and planning ahead. Telegraphed by clear ON/OFF animation.

## JSON knobs
- cadence/cycle arrays
- force direction
- damage/effects
- affected entities (hero only vs all)
