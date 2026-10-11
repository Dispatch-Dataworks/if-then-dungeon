# Lantern (Modifier)

**ID:** `MOD_LANTERN`  
**JSON key:** `lantern` (used in `levels.json`)  
**Category:** Enemy Modifier  
**Theme:** light / revealing

## Visual description
Carries a swinging iron lantern with a warm golden flame that lights the tiles around it.

## What this is
A modifier is applied on top of a base enemy to create “named” variants (e.g., **Goblin Knight (Iron)**). Modifiers:
- adjust spawn cost
- alter resistances/status effects
- may change decision cadence or sensor interactions

## Cost impact
- Adds **+1** to the base enemy’s spawn cost in Pressure (`levels.json` → `enemies.modifierCostAdders`). Stat and behavior changes are in `enemies.json` → `modifiers`.

## Behavior and effects
**Optional (post-v0.1).** Reveals illusion walls near it and ignores smoke. A counter-modifier for Rotwood and Mirror Halls: it also lights the way for the player.

## Telegraphed cues
- The modifier must be obvious from the sprite/portrait and an **info card** on the enemy side.
- Teach mode should explain the modifier the first time it appears.

## Interactions
- Status effects should remain deterministic under the seed.
- Modifiers should not introduce new mechanics before the campaign introduces them.

## JSON knobs
- `costAdd`
- `resistances`
- `statusOnHit`
- `visibilityModifiers` (smoke, fog)
- `aiCadenceAdjust`
