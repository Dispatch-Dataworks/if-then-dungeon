# Archer

**ID:** `H_ARCHER`  
**Category:** Hero  
**Theme:** ranged scout

## Visual description
A hooded traveler with a compact bow, a quiver of blunt-fletched arrows, and light boots. Reads as fantasy archer without resembling any specific game character.

## Identity and learning role
Ranged control that teaches line-of-sight reasoning and defensive movement.

## Core rules
- **No diagonal movement**
- **One action per tick**
- **Speed** changes how many tiles a move action covers (does not add extra actions)

## Default behavior (when the active row does not trigger and no ELSE exists)
**Scan 180° forward arc**, then **move 1** toward a safe open tile (prefers tiles **not adjacent** to an enemy). If no safe option, Wait.

## Hero Attack (effect of the `A_HERO_ATTACK` card)
**Arrow (Hero Attack):** Ranged shot in **line-of-sight** up to **3 tiles** (2 damage). Fragile (8 HP, no armor), but can strike before contact.

## Baseline stats (tunable)
- HP: **8**
- Armor: **0**
- Speed tiles per move action: **1**
- Sight range: **5**

## Upgrade seeds (early tree ideas)
- **Quickdraw:** Increase Hero Attack range to **4** (cap).
- **Pinning Shot:** On hit, apply **Snare (1 loop)** to the target.
- **Evasion:** Reduce the first melee hit per turn (light mitigation; not full dodge).

## Typical card synergies
- Sensors that matter: **S_ENEMY_ADJACENT**, **S_ENEMY_VISIBLE**, **S_HAZARD_AHEAD** (L7+), **S_TRAP_AHEAD** (L16+), **S_BLOCKED_AHEAD**.
- Actions that matter: **A_MOVE_FWD**, **A_TURN_L** / **A_TURN_R**, **A_WAIT** / **A_HOLD**, **A_JUMP_FWD** (L3+), **A_HERO_ATTACK**.

## Balance knobs (for JSON)
- Base HP/Armor
- Attack damage + status chance (deterministic)
- Sight rules (LoS vs arc scan)
- Default behavior parameters (rotation preference, “safe tile” scoring)

## Design notes / tips
- Encourages kids to think about LoS sensors and obstacle interactions.
- Strong when rules include: IF ENEMY_IN_LOS THEN HERO_ATTACK ELSE MOVE.
