# Pit

**ID:** `T_PIT`  
**Category:** Trap  
**Theme:** ruins / caves

## Visual description
A collapsing floor panel with a dark drop beneath; edges crumble when approached.

## Trigger
- **Step onto tile**

## Effect
- **4 damage + optional stun 1 tick**
- Traps are never “instant kill”, but can be lethal if they reduce HP to 0.

## Telegraphed state
- The player must be able to recognize this trap at a glance.
- If timed/cycling, show **one tick of warning** before an unsafe phase (animation + UI).

## How it behaves (deterministic)
Telegraph with cracked texture; deterministic collapse on step.

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
