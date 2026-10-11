# Levels and progression (24 levels)

## Campaign structure
- 24 levels
- 8 themes (3 levels each)
- Each level 1–21 introduces at least one *new* mechanic/enemy/card/modifier.
- Final 3 levels (22–24) introduce **nothing new**; they remix prior systems.

Themes:
1. Ruined Keep (1–3)
2. Sewer Vermin (4–6)
3. Ash Foundry (7–9)
4. Catacombs (10–12)
5. Cursed Chapel (13–15)
6. Blood Arena (16–18)
7. Rotwood (19–21)
8. Mirror Halls (22–24)

Modifier introduction order:
- plague, ashen, hollow, cursed, iron, blood

## Dice size per phase (suggested)
- Levels 1–3: d4
- Levels 4–9: d6
- Levels 10–15: d8
- Levels 16–21: d10
- Levels 22–24: d12

Stored per level as `diceSides` in `levels.json`.

## Pressure spend cap
Default: `6 + levelNumber`. Override per level allowed.

## Level-by-level introduction summary

### 1) Ruined Keep — basics
- L1: Goblin Scout, core move/turn sensors/actions
- L2: Spikes, Goblin Knight, spike sensors, Turn Around action
- L3: Pit, Goblin Archer, Jump + ranged threat sensor

### 2) Sewer Vermin — hazards and speed
- L4: Rat Swarm, Poison Fog, fog sensors, Retreat action
- L5: Hound, Timed Vents, vent sensors, “nearby” sensors
- L6: Plague modifier, Goblin Shaman, Shake It Off cleanse, Poisoned sensor

### 3) Ash Foundry — ELSE and conveyors
- L7: ELSE operator, Hazard Ahead sensor, Step Aside action, Smoke Vents, Conveyor
- L8: Orc Brute + Orc Warden (heavier enemies), smoke sensors, hold action
- L9: Ashen modifier, Raise Shield, Sprint

### 4) Catacombs — NOT and undead
- L10: NOT operator, Safe Ahead sensor, Backstep, Skeleton Guard, Bone Spikes
- L11: Ghoul + corpse sensors, Stomp action
- L12: Hollow modifier, resurrection sensor, enemy-count sensor, Ward action

### 5) Cursed Chapel — AND and fear
- L13: AND operator, Low HP sensor, Cursed status sensor, Focus action, Cultist, Curse Sigil, Curse Sigil Ahead sensor
- L14: Wraith Stalker, Whisper tiles, phase threat sensors, Illuminate
- L15: Cursed modifier, Fear sensor, Steel Nerves, Support enemy visibility sensor

### 6) Blood Arena — OR and armor
- L16: OR operator, trap-ahead sensor, left/right enemy sensors, Push Plates, Bleed Vines, Brace, Bleeding sensor
- L17: Enraged sensor, Bait action
- L18: Iron modifier, armored sensor, Pierce action

### 7) Rotwood — snares and illusions
- L19: Spider, Snare Roots, snare sensors, Cut Free action
- L20: Illusion wall, Illusion ahead sensor, Probe action
- L21: Blood modifier, blood trail sensor, Cauterize action

### 8) Mirror Halls — finale remix (no new things)
- L22: remix smoke + illusions + conveyors
- L23: remix undead + fog + timed vents
- L24: remix elite + snares + bleed vines + push plates

## Terrain per theme
Each theme has its own obstacle set (see `07-traps-and-board-mechanics.md` → *Obstacles*):
- Ruined Keep: stone walls, rubble, iron bars (L3: archers shoot through bars)
- Sewer Vermin: water channels (jumpable, see-through), iron bars, rubble
- Ash Foundry: lava flows (jumpable, see-through), iron bars, rubble
- Catacombs: bone piles (jumpable), tombstones, locked gates
- Cursed Chapel: tombstones, locked gates, iron bars
- Blood Arena: chasm edges (jumpable), iron bars, rubble
- Rotwood: thorn brambles, water channels, chasm edges
- Mirror Halls: a remix of the above

## Pickups
- L2: Health Draught · L5: Armor Shard · L8: Speed Rune

## Level JSON responsibility
Each level JSON must specify:
- what it introduces (cards/enemies/traps/mechanics/modifiers)
- enemy pools and nuisance pools
- allowed modifiers
- trap list and mechanic list
- spawn points
- deck recipe adjustments
- dice size (`diceSides`) and obstacle list
- the board (`board.map`, hero facing, push plate directions); see `10-json-reference.md` → *Level maps*
