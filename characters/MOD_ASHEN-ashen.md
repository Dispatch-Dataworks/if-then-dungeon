# Ashen (Modifier)

**ID:** `MOD_ASHEN`  
**JSON key:** `ashen` (used in `levels.json`)  
**Category:** Enemy Modifier  
**Theme:** smoke / soot

## Visual description
Soot-blackened skin, drifting embers, and a trailing haze of grey smoke that blurs its outline.

## What this is
A modifier is applied on top of a base enemy to create “named” variants (e.g., **Goblin Knight (Iron)**). Modifiers:
- adjust spawn cost
- alter resistances/status effects
- may change decision cadence or sensor interactions

## Cost impact
- Adds **+1** to the base enemy’s spawn cost in Pressure (`levels.json` → `enemies.modifierCostAdders`). Stat and behavior changes are in `enemies.json` → `modifiers`.

## Behavior and effects
Smoke synergy: harder to detect, or reduces the hero’s visibility (exact rule to be tuned; see `06-enemies-and-modifiers.md`).

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
