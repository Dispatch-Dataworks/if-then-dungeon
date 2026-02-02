# Blood (Modifier)

**ID:** `MOD_BLOOD`  
**Category:** Enemy Modifier  
**Theme:** slaughter

## Visual description
Wet crimson stains and ritual paint; leaves slick blood tiles as it moves (theme).

## What this is
A modifier is applied on top of a base enemy to create “named” variants (e.g., **Goblin Knight (Iron)**). Modifiers:
- adjust spawn cost
- alter resistances/status effects
- may change decision cadence or sensor interactions

## Cost impact
- Adds **+2** skull(s) to the base enemy’s cost (campaign tuning).

## Behavior and effects
Becomes more aggressive; hazards punish careless movement.

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
