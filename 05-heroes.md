# Heroes (classes)

Heroes differ in:
- **Default behavior** (when active row condition is false and no ELSE)
- **Hero Attack** behavior (polymorphic `A_HERO_ATTACK` card)
- **Base stats** (HP, armor, sight, speed)
- **Upgrade tree** (unlocks with progress)

Rules:
- No diagonal movement.
- One action per tick (even with speed upgrades; speed affects tiles moved, not number of actions).
- No multiple attacks in one tick. Damage can increase via upgrades.

## Unlock strategy
- Start with **4 heroes**.
- Advanced heroes unlock as the player clears higher levels.
- Each advanced hero unlocks just **before the theme it is best at**, so a new hero arrives with a reason to try it:

| Unlocks after clearing | Hero | Why then |
|---|---|---|
| Level 3 | Alchemist | Sewer Vermin brings poison fog |
| Level 6 | Monk | Ash Foundry brings vents and conveyors |
| Level 9 | Cleric | Catacombs bring the undead |
| Level 12 | Battlemage | Cursed Chapel brings curses and fear |
| Level 15 | Sentinel, Berserker | Blood Arena brings armor and bleed |
| Level 18 | Ranger, Hunter | Rotwood brings snares and blood trails |

- Each hero has 3 upgrades that unlock after clearing 2, 4 and 6 levels **with that hero**, which rewards switching heroes.
- All numbers (stats, attack damage and range, upgrade effects) are in `heroes.json`.
- No hero has exclusive card types; some cards change effect per hero (Hero Attack, some utility cards).

---

## Starter heroes (available from the start)

### 1) H_SWORDSMAN — Swordsman
**Fantasy**: balanced frontline.
- Default behavior: **move forward 1** (if blocked, rotate clockwise to nearest open and move if possible; otherwise wait)
- Hero Attack: **Slash**
  - attacks the tile in front (melee)
  - medium damage; bonus damage vs “swarm” tagged enemies
- Base stats:
  - HP: 10
  - Speed: 1 tile
  - Armor: 1
  - Sight: 3 (line)
- Early upgrades:
  - Cleave: hit 2 targets in a line (still 1 attack action)
  - Parry: 1-time damage reduction per turn
  - Heavy Boots: resist push plates 1 time per turn

### 2) H_ARCHER — Archer
**Fantasy**: ranged control.
- Default behavior: **scan 180° forward arc**, then **move 1** toward safest open tile (prefer away from adjacent enemy)
- Hero Attack: **Arrow**
  - ranged attack in line-of-sight up to 3 tiles
  - lower damage than swordsman, but can hit before contact
- Base stats:
  - HP: 8
  - Speed: 1
  - Armor: 0
  - Sight: 5
- Early upgrades:
  - Quickdraw: +1 range (max 4)
  - Pinning Shot: applies snare 1 loop
  - Evasion: first melee hit per turn reduced

### 3) H_SHIELDBEARER — Shieldbearer
**Fantasy**: defensive tank.
- Default behavior: **hold position** if enemy visible; else move forward 1
- Hero Attack: **Shield Bash**
  - melee hit + optional pushback 1 tile (if open)
- Base stats:
  - HP: 12
  - Speed: 1
  - Armor: 2
  - Sight: 3
- Early upgrades:
  - Fortify: gain ranged resist buff when you Wait/Hold
  - Bulwark: ignore first trap damage per turn (does not negate status)
  - Bash Mastery: more reliable pushback (still 1 action)

### 4) H_ROGUE — Rogue
**Fantasy**: fast, tricky.
- Default behavior: **sidestep** if hazard ahead; else move forward 1
- Hero Attack: **Stab**
  - melee; bonus damage if enemy is unaware (not facing hero) or slowed
- Base stats:
  - HP: 7
  - Speed: 2 tiles (move actions move 2 if both tiles open; still 1 action)
  - Armor: 0
  - Sight: 4
- Early upgrades:
  - Smoke Step: ignore smoke visibility penalty
  - Trap Sense: +1 tile hazard detection (sensor range upgrade; not a new card)
  - Backstab: higher bonus damage criteria

---

## Advanced heroes (unlock later)

### 5) H_BERSERKER — Berserker
- Default behavior: move toward nearest visible enemy (if none, move forward)
- Hero Attack: heavy strike (slow windup flavor; same mechanics)
- Upgrades: rage meter, bleed resistance

### 6) H_BATTLEMAGE — Battlemage
- Default behavior: prefer distance; step aside if enemy adjacent
- Hero Attack: arc bolt (hits first enemy in LoS; can apply “mark”)
- Upgrades: illumination synergy, curse mitigation

### 7) H_RANGER — Ranger
- Default behavior: kite: move away if enemy within 2 else forward
- Hero Attack: volley (still 1 attack; can target nearest enemy even around corners if “marked” by sensors)
- Upgrades: trap interaction, snare control

### 8) H_CLERIC — Cleric
- Default behavior: move cautiously; avoid cursed tiles if visible
- Hero Attack: smite (bonus vs undead tags)
- Upgrades: cleanse bonuses, ward duration improvements

### 9) H_ALCHEMIST — Alchemist
- Default behavior: wait when safe; step aside when threatened
- Hero Attack: throw vial (ranged; splash on a tile)
- Upgrades: poison/fog resistance, burn cleanse

### 10) H_HUNTER — Hunter
- Default behavior: track: move toward blood trail / nearest enemy visible
- Hero Attack: execute (bonus damage vs low HP enemies)
- Upgrades: blood mechanic synergy

### 11) H_MONK — Monk
- Default behavior: move forward; turns are more “fluid” (clockwise open preference)
- Hero Attack: strike (can stun 1 loop on chance; deterministic)
- Upgrades: vent timing mastery, push plate resist

### 12) H_SENTINEL — Sentinel
- Default behavior: hold if enemy visible; else advance
- Hero Attack: spear thrust (2-tile reach)
- Upgrades: iron armor pierce, crowd control

---

## Hero stats and upgrades (data model)
Each hero can be represented as JSON:
- baseStats: hp, armor, speedTiles, sightRange
- defaults: defaultBehaviorKey + params
- heroAttack: heroAttackKey + params
- upgrades: list of unlocks by milestone

Upgrades should modify:
- numbers (HP, armor, speed tiles)
- behavior parameters (default scan angle)
- hero attack parameters (range/damage/status chance)
- resistances (smoke, fear, push)
