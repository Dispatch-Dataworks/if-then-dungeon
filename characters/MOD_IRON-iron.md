# Iron (Modifier)

**ID:** `MOD_IRON`  
**JSON key:** `iron` (used in `levels.json`)  
**Category:** Enemy Modifier  
**Theme:** armor

## Visual description
Bolted plates, iron masks, heavy gait. Looks engineered.

## What this is
A modifier is applied on top of a base enemy to create “named” variants (e.g., **Goblin Knight (Iron)**). Modifiers:
- adjust spawn cost
- alter resistances/status effects
- may change decision cadence or sensor interactions

## Cost impact
- Adds **+2** to the base enemy’s spawn cost in Pressure (`levels.json` → `enemies.modifierCostAdders`). Stat and behavior changes are in `enemies.json` → `modifiers`.

## Behavior and effects
Reduces incoming damage unless pierced; slower but tougher.

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
