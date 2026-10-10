# Hunter

**ID:** `H_HUNTER`  
**Category:** Hero  
**Theme:** grim tracker

## Visual description
A hardened tracker with cloak, crossbow or shortbow, and a hooked blade. Slightly darker tone but still PG-13.

## Identity and learning role
Execution specialist; teaches prioritizing weakened targets and reading health thresholds.

## Core rules
- **No diagonal movement**
- **One action per tick**
- **Speed** changes how many tiles a move action covers (does not add extra actions)

## Default behavior (when the active row does not trigger and no ELSE exists)
Track: move toward nearest visible enemy; prefers paths with “blood”/corpse markers (later).

## Hero Attack (effect of the `A_HERO_ATTACK` card)
**Execute (Hero Attack):** Stronger vs low-HP enemies. If target below a threshold, damage scales up.

## Baseline stats (tunable)
- HP: **9**
- Armor: **0**
- Speed tiles per move action: **1**
- Sight range: **4**

## Upgrade seeds (early tree ideas)
- **Blood Sense:** Improves detection of wounded enemies through light concealment.
- **Finisher:** Lowers the execute threshold slightly.
- **Trophy Hunter:** Higher chance for drops/powerups from elite enemies (campaign tuning).

## Typical card synergies
- Sensors that matter: **S_ENEMY_ADJACENT**, **S_ENEMY_VISIBLE**, **S_HAZARD_AHEAD** (L7+), **S_TRAP_AHEAD** (L16+), **S_BLOCKED_AHEAD**.
- Actions that matter: **A_MOVE_FWD**, **A_TURN_L** / **A_TURN_R**, **A_WAIT** / **A_HOLD**, **A_JUMP_FWD** (L3+), **A_HERO_ATTACK**.

## Balance knobs (for JSON)
- Base HP/Armor
- Attack damage + status chance (deterministic)
- Sight rules (LoS vs arc scan)
- Default behavior parameters (rotation preference, “safe tile” scoring)

## Design notes / tips
- Fits darker themes (crypts, ghoul levels).
- Encourages kids to build conditions around enemy state (HP low?).
