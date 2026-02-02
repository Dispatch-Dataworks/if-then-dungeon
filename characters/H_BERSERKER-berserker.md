# Berserker

**ID:** `H_BERSERKER`  
**Category:** Hero  
**Theme:** rage warrior

## Visual description
A wild-eyed warrior with heavy axe or cleaver, wrapped forearms, and scarred armor. Looks gritty but still PG-13.

## Identity and learning role
Aggressive chaser that teaches risk vs reward and controlled randomness in outcomes.

## Core rules
- **No diagonal movement**
- **One action per tick**
- **Speed** changes how many tiles a move action covers (does not add extra actions)

## Default behavior (when the active row does not trigger and no ELSE exists)
If an enemy is visible: **Move toward nearest visible enemy**. Otherwise move forward.

## Hero Attack (effect of the `A_HERO_ATTACK` card)
**Heavy Strike (Hero Attack):** Melee strike with higher base damage and a small chance to apply **Bleed** (deterministic via seed).

## Baseline stats (tunable)
- HP: **11**
- Armor: **0**
- Speed tiles per move action: **1**
- Sight range: **3**

## Upgrade seeds (early tree ideas)
- **Rage Meter:** After taking damage, gain a temporary damage bonus for the next Hero Attack.
- **Blood Resistance:** Reduce damage from bleed/blood tiles.
- **Unstoppable:** Once per turn, ignore a snare/slow effect when moving.

## Typical card synergies
- Sensors that matter: **ENEMY_ADJACENT**, **ENEMY_IN_LOS**, **TILE_IS_HAZARD_AHEAD**, **TILE_IS_TRAP_AHEAD**, **PATH_BLOCKED** (as those become available).
- Actions that matter: **MOVE_FORWARD**, **TURN_LEFT/RIGHT**, **WAIT/HOLD**, **JUMP** (later), **HERO_ATTACK**.

## Balance knobs (for JSON)
- Base HP/Armor
- Attack damage + status chance (deterministic)
- Sight rules (LoS vs arc scan)
- Default behavior parameters (rotation preference, “safe tile” scoring)

## Design notes / tips
- Teaches why defensive rules (hazard avoidance) should come before chase rules.
- Great mid-campaign unlock once kids understand trap patterns.
