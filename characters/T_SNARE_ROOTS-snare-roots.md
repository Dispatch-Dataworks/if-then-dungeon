# Snare Roots

**ID:** `T_SNARE_ROOTS`  
**Category:** Trap  
**Map symbol:** `n`  
**Theme:** webbed/roots

## Visual description
Root tendrils grab the ankle; shown as looping roots around the tile.

## Trigger
- **Step onto tile**

## Effect
- **1 damage + snare_root (reduces movement)**
- Traps are never “instant kill”, but can be lethal if they reduce HP to 0.

## Telegraphed state
- The player must be able to recognize this trap at a glance.
- If timed/cycling, show **one tick of warning** before an unsafe phase (animation + UI).

## How it behaves (deterministic)
Snare reduces movement effectiveness; does not add extra actions.

## Movement interaction
- Stepping rules:
  - No diagonal movement.
  - Trigger timing is consistent (on step vs end-of-tick).

## Teaching notes
- First appearance should be paired with a short teach panel:
  - what triggers it
  - how to avoid it (sensor + rule ordering)

## JSON knobs
- damage
- statusApplied (type, duration)
- zoneRadius / region
- timingCycle (if applicable)
