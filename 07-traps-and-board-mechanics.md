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
- Effect: deal 3 damage

### T_BONE_SPIKES
- As spikes, different theme
- Effect: deal 3 damage

### T_PIT
- Trigger: step onto tile
- Effect: deal 4 damage (and optional “stun” 1 tick)

### T_POISON_FOG
- Trigger: being inside fog region at tick end
- Effect: 1 damage per tick, optional poison stack

### T_SMOKE_VENTS
- Trigger: being inside smoke region at tick end
- Effect: 1 damage per tick (light) + visibility penalty (implementation-defined)

### T_CURSE_SIGIL
- Trigger: step onto tile
- Effect: 2 damage + applies “cursed” status

### T_WHISPER_TILES
- Trigger: step onto tile or remain adjacent (tune)
- Effect: 1 damage + fear status chance

### T_BLEED_VINES
- Trigger: step onto tile
- Effect: 2 damage + apply bleed

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

## Pickup and powerups (v0.1 rules)
- Auto pickup within 1 tile orthogonal when the hero passes near it.
- No diagonal pickup.
- Powerups affect:
  - speed tiles moved (still 1 action)
  - attack strength/skill (still 1 attack per tick)
  - resistances (smoke, fear, push)
