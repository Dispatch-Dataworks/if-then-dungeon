# Bone Spikes

**ID:** `T_BONE_SPIKES`  
**Category:** Trap  
**Map symbol:** `k`  
**Theme:** crypt / ossuary

## Visual description
Jagged bones protruding from cracked stone; visually distinct from metal spikes.

## Trigger
- **Step onto tile**

## Effect
- **2 damage**
- Traps are never “instant kill”, but can be lethal if they reduce HP to 0.

## Telegraphed state
- The player must be able to recognize this trap at a glance.
- If timed/cycling, show **one tick of warning** before an unsafe phase (animation + UI).

## How it behaves (deterministic)
Same mechanics as Spikes; used for theme variety.

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
