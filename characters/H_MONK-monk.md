# Monk

**ID:** `H_MONK`  
**Category:** Hero  
**Theme:** disciplined striker

## Visual description
A calm fighter in wraps and light armor, carrying a staff or bare hands. No franchise-specific markings.

## Identity and learning role
Tempo and timing hero; teaches rhythm with timed vents and push plates.

## Core rules
- **No diagonal movement**
- **One action per tick**
- **Speed** changes how many tiles a move action covers (does not add extra actions)

## Default behavior (when the active row does not trigger and no ELSE exists)
Advance steadily; clockwise-open preference is stronger (more consistent wall-following).

## Hero Attack (effect of the `A_HERO_ATTACK` card)
**Focused Strike (Hero Attack):** Melee strike with a deterministic chance to **Stun (1 loop)**.

## Baseline stats (tunable)
- HP: **9**
- Armor: **1**
- Speed tiles per move action: **1**
- Sight range: **3**

## Upgrade seeds (early tree ideas)
- **Vent Mastery:** Reduces damage taken from timed vents once per turn.
- **Push Plate Resist:** Improves resistance to forced movement.
- **Discipline:** Stun chance increases slightly; remains deterministic.

## Typical card synergies
- Sensors that matter: **S_ENEMY_ADJACENT**, **S_ENEMY_VISIBLE**, **S_HAZARD_AHEAD** (L7+), **S_TRAP_AHEAD** (L16+), **S_BLOCKED_AHEAD**.
- Actions that matter: **A_MOVE_FWD**, **A_TURN_L** / **A_TURN_R**, **A_WAIT** / **A_HOLD**, **A_JUMP_FWD** (L3+), **A_HERO_ATTACK**.

## Balance knobs (for JSON)
- Base HP/Armor
- Attack damage + status chance (deterministic)
- Sight rules (LoS vs arc scan)
- Default behavior parameters (rotation preference, “safe tile” scoring)

## Design notes / tips
- Great for levels where timing patterns matter.
- Teaches how deterministic “chance” works under a seed.
