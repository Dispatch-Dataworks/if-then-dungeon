# Bleed Vines

**ID:** `T_BLEED_VINES`  
**Category:** Trap  
**Theme:** blood arena (introduced in Level 16)

## Visual description
Thorned crimson vines coiled across the tile, with dark red sap beading on the barbs; shown as a thorny ring around the tile.

## Trigger
- **Step onto tile**

## Effect
- **2 damage + bleed**
- Traps are never “instant kill”, but can be lethal if they reduce HP to 0.

## Telegraphed state
- The player must be able to recognize this trap at a glance.
- If timed/cycling, show **one tick of warning** before an unsafe phase (animation + UI).

## How it behaves (deterministic)
Applies the `bleed` status on step. Bleed's ongoing effect (damage per tick, duration, stacking) is not yet defined in the spec; tune it in JSON.

## Movement interaction
- Stepping rules:
  - No diagonal movement.
  - Trigger timing is consistent (on step vs end-of-tick).

## Counterplay
- Sensors: **S_TRAP_AHEAD** (introduced alongside this trap in L16), **S_HAZARD_AHEAD**.
- Actions: **A_CAUTERIZE** (cleanses all bleed), **A_SHAKE_IT_OFF** (cleanses 1 stack of bleed or poison).

## Teaching notes
- First appearance should be paired with a short teach panel:
  - what triggers it
  - how to avoid it (sensor + rule ordering)

## JSON knobs
- damage
- statusApplied (type, duration)
- zoneRadius / region
- timingCycle (if applicable)
