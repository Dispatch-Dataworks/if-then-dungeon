# Bleed Vines

**ID:** `T_BLEED_VINES`  
**Category:** Trap  
**Map symbol:** `b`  
**Theme:** blood arena (introduced in Level 16)

## Visual description
Thorned crimson vines coiled across the tile, with dark red sap beading on the barbs; shown as a thorny ring around the tile.

## Trigger
- **Step onto tile**

## Effect
- **2 damage + 2 bleed stacks**
- Traps are never “instant kill”, but can be lethal if they reduce HP to 0.

## Telegraphed state
- The player must be able to recognize this trap at a glance.
- If timed/cycling, show **one tick of warning** before an unsafe phase (animation + UI).

## How it behaves (deterministic)
Applies 2 stacks of `bleed` on step (max 3). At the end of each loop the bearer loses 1 stack, and takes 1 damage only if they **moved** that loop. Waiting it out is safe, so `IF S_BLEEDING THEN A_WAIT` is a valid (if slow) answer; **A_CAUTERIZE** clears it instantly. See *Status effects* in `07-traps-and-board-mechanics.md`.

## Movement interaction
- Stepping rules:
  - No diagonal movement.
  - Trigger timing is consistent (on step vs end-of-tick).

## Counterplay
- Sensors: **S_TRAP_AHEAD** and **S_BLEEDING** (both introduced alongside this trap in L16), **S_HAZARD_AHEAD**.
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
