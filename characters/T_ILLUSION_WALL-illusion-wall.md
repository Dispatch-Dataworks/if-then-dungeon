# Illusion Wall

**ID:** `T_ILLUSION_WALL`  
**Category:** Trap  
**Theme:** arcane rooms

## Visual description
A shimmering air gap that looks like a corridor until it ripples on impact.

## Trigger
- **Attempt to move into tile believed open**

## Effect
- **2 damage + reveal**
- Traps are never “instant kill”, but can be lethal if they reduce HP to 0.

## Telegraphed state
- The player must be able to recognize this trap at a glance.
- If timed/cycling, show **one tick of warning** before an unsafe phase (animation + UI).

## How it behaves (deterministic)
After the first impact, tile becomes visibly blocked for the rest of the level.

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
