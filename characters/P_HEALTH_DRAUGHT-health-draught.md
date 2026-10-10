# Health Draught

**ID:** `P_HEALTH_DRAUGHT`  
**Category:** Pickup  
**Map symbol:** `!`  
**Theme:** alchemy / healing

## Visual description
A small corked flask of glowing red liquid wrapped in twine, sitting on a tiny rune-etched stand.

## Effect
- **Restore 3 HP** (up to max HP).
- First appears in **Level 2**. Also dropped by defeated enemies (seeded chance; see `enemies.json` → `combat.drops`).

## How it is collected
- **Automatic** when the hero ends a move on the tile or passes within 1 orthogonal tile (no diagonals, no pickup action).
- Collected during step 5 of each loop (after the hero acts, before traps resolve).
- Deterministic: drops and pickups replay identically on a retry.

## Teaching notes
A reason to take a detour. Placing it next to a hazard asks the player to weigh risk against reward.

## JSON knobs
- `content.pickups.P_HEALTH_DRAUGHT` in `levels.json`
