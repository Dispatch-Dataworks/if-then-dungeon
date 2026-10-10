# Traps and board mechanics

## Trap principles
- No instant-kill traps.
- Traps can be lethal by reducing HP to 0.
- Traps must be telegraphed clearly:
  - timed traps show active/inactive state at least 1 tick ahead
- Trap behavior is deterministic per level state and tick.

## Trap list (v0.1 defaults)

### T_SPIKES
- Trigger: step onto tile
- Effect: deal 2 damage

### T_BONE_SPIKES
- As spikes, different theme
- Effect: deal 2 damage

### T_PIT
- Trigger: step onto tile
- Effect: deal 3 damage (and optional “stun” 1 tick)

### T_POISON_FOG
- Trigger: being inside fog region at tick end
- Effect: 1 damage per tick, 25% chance (seeded) of 1 poison stack

### T_SMOKE_VENTS
- Trigger: being inside smoke region at tick end
- Effect: 1 damage per tick (light); sight -1 while inside; smoke tiles **block line of sight through them** for everyone (hide from archers, but you can't shoot through it either)

### T_CURSE_SIGIL
- Trigger: step onto tile
- Effect: 1 damage + applies “cursed” status

### T_WHISPER_TILES
- Trigger: step onto tile or remain adjacent (tune)
- Effect: 1 damage + fear status chance

### T_BLEED_VINES
- Trigger: step onto tile
- Effect: 1 damage + apply 2 bleed stacks

### T_SNARE_ROOTS
- Trigger: step onto tile
- Effect: 1 damage + apply snare_root (reduces movement)

### T_ILLUSION_WALL
- Trigger: attempt to move into tile believed open
- Effect: 2 damage on impact; reveals illusion after hit

## Board mechanics (non-trap)

### M_TIMED_VENTS
- Cycle example: [2 off, 2 on]
- Vents are safe/inactive when off; harmful when on.

### M_CONVEYOR
- Forced move 1 tile in conveyor direction at tick end (after hero action).
- Deterministic; telegraphed by arrows.

### M_PUSH_PLATES
- When stepped on, pushes hero 1 tile in the plate direction (if open).
- If blocked, no movement; still consumes tick when triggered by action.

## Obstacles (terrain)
Obstacles are static tiles placed by the level map. Nobody can walk into them, but they differ in what you can **see** and **jump** across. That difference is the teaching point: "visible" and "reachable" are not the same condition.

| ID | Symbol | Blocks sight | Jumpable | Themes |
|---|---|---|---|---|
| O_STONE_WALL | `#` | Yes | No | All |
| O_RUBBLE_PILE | `%` | Yes | No | Ruined Keep, Sewer, Foundry, Arena |
| O_LOCKED_GATE | `=` | Yes | No | Catacombs, Chapel |
| O_TOMBSTONE | `+` | Yes | No | Catacombs, Chapel, Mirror Halls |
| O_THORN_BRAMBLES | `*` | Yes | No | Rotwood, Mirror Halls |
| O_IRON_BARS | `\|` | **No** | No | Keep, Sewer, Foundry, Chapel, Arena, Mirror Halls |
| O_BONE_PILE | `&` | **No** | **Yes** | Catacombs, Mirror Halls |
| O_WATER_CHANNEL | `~` | **No** | **Yes** | Sewer, Rotwood |
| O_LAVA_FLOW | `L` | **No** | **Yes** | Ash Foundry |
| O_CHASM_EDGE | `:` | **No** | **Yes** | Arena, Rotwood, Mirror Halls |

Rules:
- **S_WALL_AHEAD** is true when any obstacle is directly ahead. **S_BLOCKED_AHEAD** is true for an obstacle *or* an enemy ahead.
- **A_JUMP_FWD** moves 2 tiles. The middle tile may be a trap, a pit or a jumpable obstacle; the landing tile must be open.
- Walking into lava, water or a chasm is never allowed, so they are never instant kills.
- The Wraith Stalker ignores obstacles (it phases through them).

## Status effects
Statuses resolve at the **end of each loop**, after trap damage (step 6 in `02-turn-execution.md`). Stack-based statuses lose 1 stack per loop; timed ones count down `durationLoops`. Reapplying a timed status refreshes its duration. Exact values live in `levels.json` → `content.statuses`.

| Status | On | Effect | Sources | Counters |
|---|---|---|---|---|
| poison | hero, enemy | Take 1 damage, then lose 1 stack (max 3) | Poison fog (25% chance), plague enemies, Alchemist | S_POISONED, A_SHAKE_IT_OFF |
| bleed | hero, enemy | Lose 1 stack; take 1 damage only if you **moved** this loop (max 3) | Bleed vines (2 stacks), blood tiles, Berserker | S_BLEEDING, A_CAUTERIZE, A_SHAKE_IT_OFF, or just wait |
| snare_root | hero, enemy | Move actions cover 1 fewer tile for 2 loops (a 0-tile move fails) | Snare roots, spiders, Archer/Ranger upgrades | S_IN_ROOTS, A_CUT_FREE |
| cursed | hero | Default behavior and Step Aside rotate **counter-clockwise** for 3 loops | Curse sigils, cultists, cursed enemies | S_CURSED_STATUS, Cleric upgrades |
| fear | hero, enemy | Hero: Move Forward fails while a visible enemy is ahead. Enemy: flees. 2 loops | Whisper tiles, cultists, wraiths | S_FEAR_STATUS, A_STEEL_NERVES, A_FOCUS |
| hesitation | hero, enemy | Next action becomes Wait | Cursed enemies, goblin scouts (variability) | A_FOCUS |
| stun | hero, enemy | Next action becomes Wait | Pit (optional), Monk | — |
| slowed | enemy | Acts only on even loops for 2 loops | Sentinel upgrade; snared/stunned enemies also count as slowed for bonuses | — |
| enraged | enemy | +1 damage, immune to hesitation, 3 loops | Goblin shaman, blood enemies at half HP | S_ENEMY_ENRAGED, A_BAIT |
| mark | enemy | Takes +1 damage from hero attacks; sensors can see it through walls, 3 loops | Battlemage, Ranger upgrade | — |

Buffs granted by cards (`ranged_resist`, `push_resist`, `armor_pierce`, `blood_tile_resist`) last for the card's `durationLoops`.

Why these rules: each status changes *which rule row is right*, not just the HP number. Bleed rewards `IF S_BLEEDING THEN A_WAIT`; curse flips the hero's default, showing why relying on defaults is risky; fear breaks `MOVE_FORWARD` when an enemy is ahead, pushing players toward ELSE branches.

## Board effects
- **Blood tile:** left by blood-modified enemies as they move; lasts 5 loops; stepping on one applies 1 bleed stack. Detected by **S_BLOOD_TRAIL_NEARBY**.
- **Corpse:** left where an enemy dies. Ghouls feed on corpses; hollow enemies can rise from them once. **A_STOMP** destroys corpses within 1 tile.

## Damage and armor
Every attack with damage deals `max(1, damage - armor)`. Armor never makes a unit immune; **A_PIERCE** (armor_pierce) ignores armor for one attack. Trap damage ignores armor. Hero and enemy numbers are in `heroes.json` and `enemies.json`.

## Pickups (v0.1)
- Auto pickup within 1 tile orthogonal when the hero passes near it. No diagonal pickup and no pickup action.
- Pickups are placed on the level map or dropped by defeated enemies (10% per danger skull, seeded).

| ID | Symbol | Effect | First appears |
|---|---|---|---|
| P_HEALTH_DRAUGHT | `!` | Restore 3 HP (up to max) | L2 |
| P_ARMOR_SHARD | `$` | +1 armor for the rest of the level (max +2) | L5 |
| P_SPEED_RUNE | `?` | +1 tile per move action for the rest of the turn (still 1 action) | L8 |
