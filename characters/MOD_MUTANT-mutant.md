# Mutant (Modifier)

**ID:** `MOD_MUTANT`  
**JSON key:** `mutant` (used in `levels.json`)  
**Category:** Enemy Modifier  
**Theme:** unstable growth

## Visual description
Lopsided muscles, an extra glowing eye and crackling green veins. Comic-grotesque rather than gory.

## What this is
A modifier is applied on top of a base enemy to create “named” variants (e.g., **Goblin Knight (Iron)**). Modifiers:
- adjust spawn cost
- alter resistances/status effects
- may change decision cadence or sensor interactions

## Cost impact
- Adds **+2** to the base enemy’s spawn cost in Pressure (`levels.json` → `enemies.modifierCostAdders`). Stat and behavior changes are in `enemies.json` → `modifiers`.

## Behavior and effects
**Optional (post-v0.1).** +3 HP and +1 damage. Changes stats rather than adding statuses, so it is a good late-game "bigger version" of a familiar enemy.

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
