# Smoke Vents

**ID:** `T_SMOKE_VENTS`  
**Category:** Trap  
**Map symbol:** `m`  
**Theme:** forge / vents

## Visual description
Dark smoke pouring from floor grates; pulses can be animated.

## Trigger
- **End tick while inside smoke**

## Effect
- **1 damage per tick (light) + visibility penalty**
- Traps are never “instant kill”, but can be lethal if they reduce HP to 0.

## Telegraphed state
- The player must be able to recognize this trap at a glance.
- If timed/cycling, show **one tick of warning** before an unsafe phase (animation + UI).

## How it behaves (deterministic)
Visibility penalty impacts some sensors (tunable).

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
