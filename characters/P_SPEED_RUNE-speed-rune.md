# Speed Rune

**ID:** `P_SPEED_RUNE`  
**Category:** Pickup  
**Map symbol:** `?`  
**Theme:** wind / motion runes

## Visual description
A flat stone disc with a swirling golden rune that leaves a short light trail when it spins.

## Effect
- **+1 tile per move action for the rest of the turn** (still exactly 1 action per loop).
- First appears in **Level 8**. Also dropped by defeated enemies (seeded chance; see `enemies.json` → `combat.drops`).

## How it is collected
- **Automatic** when the hero ends a move on the tile or passes within 1 orthogonal tile (no diagonals, no pickup action).
- Collected during step 5 of each loop (after the hero acts, before traps resolve).
- Deterministic: drops and pickups replay identically on a retry.

## Teaching notes
Reinforces that speed changes distance, not the number of actions, and that more tiles per move can carry you into hazards faster.

## JSON knobs
- `content.pickups.P_SPEED_RUNE` in `levels.json`
