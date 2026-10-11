# Armor Shard

**ID:** `P_ARMOR_SHARD`  
**Category:** Pickup  
**Map symbol:** `$`  
**Theme:** forged metal / runes

## Visual description
A jagged plate of dark iron with a single glowing cyan rune, floating slightly above the floor.

## Effect
- **+1 armor for the rest of the level** (at most +2 from shards).
- First appears in **Level 5**. Also dropped by defeated enemies (seeded chance; see `enemies.json` → `combat.drops`).

## How it is collected
- **Automatic** when the hero ends a move on the tile or passes within 1 orthogonal tile (no diagonals, no pickup action).
- Collected during step 5 of each loop (after the hero acts, before traps resolve).
- Deterministic: drops and pickups replay identically on a retry.

## Teaching notes
Armor reduces each hit by its value (minimum 1 damage), so players can see the numbers change.

## JSON knobs
- `content.pickups.P_ARMOR_SHARD` in `levels.json`
