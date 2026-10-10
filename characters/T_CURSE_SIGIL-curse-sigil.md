# Curse Sigil

**ID:** `T_CURSE_SIGIL`  
**Category:** Trap  
**Map symbol:** `c`  
**Theme:** ritual chamber

## Visual description
A carved rune circle that glows faintly; whispers in audio layer.

## Trigger
- **Step onto tile**

## Effect
- **2 damage + cursed status**
- Traps are never “instant kill”, but can be lethal if they reduce HP to 0.

## Telegraphed state
- The player must be able to recognize this trap at a glance.
- If timed/cycling, show **one tick of warning** before an unsafe phase (animation + UI).

## How it behaves (deterministic)
Applies a deterministic cursed status that can affect defaults later.

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
