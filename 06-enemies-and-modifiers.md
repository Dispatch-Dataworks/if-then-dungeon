# Enemies and modifiers

## Philosophy
Enemies should feel readable but not fully predictable. Each has:
- deterministic “core” rule
- small controlled randomness (intent choice, hesitation, timing offsets)

Enemy variability exists from the start:
- levels have themed enemy pools
- some enemies spawn with minor behavioral variants

## Spawn costs (base)
See `04-threat-pressure-spawn.md` for the full table.

---

## Enemy roster (v0.1)

### E_GOBLIN_SCOUT (1 skull)
- Role: nuisance, pressure tax
- Behavior:
  - patrol forward; if blocked, turn right
  - if hero adjacent: attack (low damage)
- Variability:
  - 20% chance each tick to “hesitate” (wait) (deterministic via seed)

### E_RAT_SWARM (1 skull)
- Role: area pressure, clogging lanes
- Behavior:
  - moves toward hero if within 3 tiles; else random walk
  - when adjacent: bite (very low damage), can stack “nibble” (flavor; optional)

### E_GOBLIN_ARCHER (2 skull)
- Role: ranged threat
- Behavior:
  - if hero in LoS: shoot
  - else reposition to restore LoS
- Variability:
  - prefers left or right lane at spawn (deterministic)

### E_GOBLIN_KNIGHT (2 skull)
- Role: blocker
- Behavior:
  - marches toward hero; prioritizes holding chokepoints
  - attacks when adjacent
- Variability:
  - can occasionally “guard” (wait) to block

### E_ORC_BRUTE (2 skull, high cost)
- Role: heavy melee
- Behavior:
  - if hero visible: chase
  - else: stomp forward; break minor obstacles (optional later)
- Variability:
  - chooses between “chase” vs “hold” every 3 ticks

### E_SKELETON_GUARD (2 skull)
- Role: relentless
- Behavior:
  - always advances; ignores fear tiles (immune)
  - attacks adjacent
- Variability:
  - none early; keep them deterministic

### E_CULTIST (2 skull)
- Role: support / debuff
- Tags: support
- Behavior:
  - keeps distance; applies minor curse or fear pulse if in range
- Variability:
  - alternates between support and flee

### E_HOUND (2 skull)
- Role: fast chaser
- Behavior:
  - moves 2 tiles when chasing (still 1 action)
  - if adjacent: bite
- Variability:
  - may “pounce” (skip movement and attack if within 2 and line clear)

### E_SPIDER (2 skull)
- Role: snare synergy
- Behavior:
  - prefers tiles adjacent to snares/roots
  - attacks can apply snare (low chance)
- Variability:
  - chooses ambush corner behavior at spawn

### E_GOBLIN_SHAMAN (3 skull)
- Role: control support
- Tags: support
- Behavior:
  - summons minor hazard or buffs allies (enrage) on cadence
  - avoids direct combat
- Variability:
  - cadence offset at spawn (deterministic)

### E_ORC_WARDEN (3 skull)
- Role: commander/zone control
- Behavior:
  - holds a lane, pushes hero back on hit (if open)
  - calls reinforcements (optional later)
- Variability:
  - chooses lane anchor point at spawn

### E_GHOUL (3 skull)
- Role: corpse mechanic
- Tags: ghoul
- Behavior:
  - seeks corpses; if reaches corpse, heals or gains speed briefly
  - attacks adjacent
- Variability:
  - corpse priority vs hero priority based on spawn trait

### E_WRAITH_STALKER (4 skull)
- Role: late elite
- Behavior:
  - phase threat: can threaten from walls/through obstacles (rule-driven)
  - if phase threat true: strike (medium damage + fear chance)
- Variability:
  - chooses “stalk” or “strike” cycle at spawn

---

## Modifiers (applied to base enemies)
Modifiers:
- change spawn cost (adders)
- adjust resistances / behaviors
- appear only after being introduced by the campaign

### plague (+1)
- attacks may apply poison/bleed (light)
- can leave lingering hazard tile (rare)

### ashen (+1)
- smoke synergy: harder to detect, or reduced visibility for hero

### hollow (+1)
- undead flavor: immune to fear, weaker to smite-style (cleric later)

### cursed (+2)
- applies fear/hesitation more often
- can flip a hero’s default preference occasionally (deterministic)

### iron (+2)
- armored: reduces incoming damage unless pierced
- slower but harder

### blood (+2)
- leaves blood tiles that punish careless movement
- becomes more aggressive at low HP

### mutant (+2) (optional later)
- bigger stat changes, not just status

### lantern (+1) (optional later)
- reveals illusions / counters smoke (anti-rotwood)

---

## Name formatting (short, readable)
Names are presented as:
`<Modifier> <BaseName>`

Examples:
- Plague Rat Swarm
- Ashen Goblin Archer
- Hollow Skeleton Guard
- Iron Orc Brute
- Cursed Wraith Stalker

Modifiers stack only if explicitly allowed (recommend 1 modifier until late game).
