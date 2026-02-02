# Poison Fog

**ID:** `T_POISON_FOG`  
**Category:** Trap  
**Theme:** sewers / alchemy labs

## Visual description
Low green haze that fills regions; thicker toward the center.

## Trigger
- **End tick while inside fog**

## Effect
- **1 damage per tick + optional poison stack**
- Traps are never “instant kill”, but can be lethal if they reduce HP to 0.

## Telegraphed state
- The player must be able to recognize this trap at a glance.
- If timed/cycling, show **one tick of warning** before an unsafe phase (animation + UI).

## How it behaves (deterministic)
Damage applies at tick end; encourages planning around zones.

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
