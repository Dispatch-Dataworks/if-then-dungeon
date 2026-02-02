# Battlemage

**ID:** `H_BATTLEMAGE`  
**Category:** Hero  
**Theme:** armored caster

## Visual description
A lightly armored mage with a short staff and rune-etched bracer, wearing practical travel gear rather than ornate wizard robes.

## Identity and learning role
Hybrid that teaches status effects, ranged targeting, and spacing rules.

## Core rules
- **No diagonal movement**
- **One action per tick**
- **Speed** changes how many tiles a move action covers (does not add extra actions)

## Default behavior (when the active row does not trigger and no ELSE exists)
Prefer distance: if enemy adjacent, **step aside**; else move forward cautiously.

## Hero Attack (effect of the `A_HERO_ATTACK` card)
**Arc Bolt (Hero Attack):** Ranged bolt that hits the first enemy in LoS; can apply **Mark** (deterministic) that improves allied targeting later.

## Baseline stats (tunable)
- HP: **9**
- Armor: **1**
- Speed tiles per move action: **1**
- Sight range: **4**

## Upgrade seeds (early tree ideas)
- **Illumination:** Reveals illusion walls sooner or reduces illusion damage once per turn.
- **Wardbreaker:** Improves damage vs armored/iron-mod enemies.
- **Curse Mitigation:** Reduces duration of cursed/fear effects.

## Typical card synergies
- Sensors that matter: **ENEMY_ADJACENT**, **ENEMY_IN_LOS**, **TILE_IS_HAZARD_AHEAD**, **TILE_IS_TRAP_AHEAD**, **PATH_BLOCKED** (as those become available).
- Actions that matter: **MOVE_FORWARD**, **TURN_LEFT/RIGHT**, **WAIT/HOLD**, **JUMP** (later), **HERO_ATTACK**.

## Balance knobs (for JSON)
- Base HP/Armor
- Attack damage + status chance (deterministic)
- Sight rules (LoS vs arc scan)
- Default behavior parameters (rotation preference, “safe tile” scoring)

## Design notes / tips
- Pairs with sensors: ENEMY_IN_LOS, TILE_IS_ILLUSION, STATUS_IS_CURSED.
- Good for levels introducing illusion walls and curse sigils.
