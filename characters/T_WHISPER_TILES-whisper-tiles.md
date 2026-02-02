# Whisper Tiles

**ID:** `T_WHISPER_TILES`  
**Category:** Trap  
**Theme:** haunted halls

## Visual description
Stone tiles with faint faces in the grout; subtle moving shadows.

## Trigger
- **Step or remain adjacent**

## Effect
- **1 damage + fear chance**
- Traps are never “instant kill”, but can be lethal if they reduce HP to 0.

## Telegraphed state
- The player must be able to recognize this trap at a glance.
- If timed/cycling, show **one tick of warning** before an unsafe phase (animation + UI).

## How it behaves (deterministic)
Fear chance is seeded; teach that 'chance' repeats on retry.

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
