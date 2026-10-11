# Turn execution and determinism

## Turn phases (exact order)

### 1) Turn start snapshot
Capture a snapshot for deterministic retries:
- hero: position, facing, HP, statuses, inventory
- enemies: positions, HP, statuses, cooldown counters
- traps/hazards: states, timers, cycles
- Pressure
- deck state: draw pile order, discard pile order
- RNG seeds for the turn (or equivalent deterministic sources)

### 2) Deal
- Draw 10 cards from the draw pile to the player hand.

### 3) Exchange (optional)
- Player may discard 0–5 cards.
- Discarded cards go into discard pile immediately.
- Draw replacements from the draw pile.
- Deterministic: same discarded card IDs -> same replacement cards.

### 4) Build rule rows
- Player creates 1+ valid rows.
- UI blocks rolling unless all rows are valid.

### 5) Roll & Lock
- Roll dice for each row (row order).
- Store `loops[rowIndex]`.
- Lock rows: no changes allowed after this point.

### 6) Execute rows sequentially
For row i from 1..N:
Repeat for `loops[i]` ticks:
1) Evaluate row predicate (active row only)
2) If predicate true:
   - attempt THEN action (consume tick even if fails)
3) Else if ELSE exists:
   - attempt ELSE action (consume tick even if fails)
4) Else:
   - do hero default behavior (consume tick)
5) Resolve pickups / proximity pickups (auto within 1 tile; no diagonal)
6) Resolve region hazards (fog, smoke) and active vents under the hero
7) Enemy tick:
   - each enemy updates based on its behavior rules
   - enemy randomness is deterministic per turn seed + enemyId + tick
8) Update any timed mechanics (vents, conveyors, push plates)
9) Resolve end-of-loop status effects for the hero and enemies (poison, bleed, durations; see *Status effects* in `07-traps-and-board-mechanics.md`). Buffs from cards therefore protect against the enemy tick of the loop they were played in.

### 7) Turn end: discard and Pressure
- Determine which cards were *placed into valid rows* (count as “placed” even if they never triggered).
- Remaining unplaced cards in hand generate Threat.
- Move all hand cards to discard pile (cards used in rows and unused).
- Add Threat to Pressure.
- Spend Pressure to spawn enemies (resurrect-first) up to Pressure spend cap.

## Deterministic RNG model (recommended)
At level start:
- `levelSeed`

At turn start:
- `turnSeed = hash(levelSeed, turnIndex)` (must include `turnIndex`, otherwise every turn would replay the same deal and dice)

Derive sub-seeds:
- `dealSeed`
- `exchangeSeed`
- `diceSeed`
- `enemySeed`
- `spawnSeed`

Rules:
- **Deal** uses `dealSeed` to shuffle/choose from current draw pile.
- **Exchange** uses `exchangeSeed` + discarded IDs (canonical order) to pick replacements.
- **Dice** uses `diceSeed` + rowIndex (and optional row-hash) to generate loop counts.
- **Enemy randomness** uses `enemySeed` + enemyId + tickIndex.
- **Spawn selection** uses `spawnSeed` + available spawn points and eligible pools.

On death retry:
- restore snapshot and reuse the same seeds.

## Dice size
- Dice size is level-defined (board size/complexity):
  - e.g., d4 early, d6 mid, d8+ later.
- Each row gets its own roll.

## Movement rules (global)
- No diagonal movement.
- When a movement action cannot complete (blocked, landing blocked for jump), it fails and consumes the tick.
- Turning is always possible. (Fear blocks Move Forward toward a visible enemy, not turning.)
- For “turn into blocked”: rotate to nearest open direction clockwise only when using Step Aside / special actions; normal turns just change facing.

## Pickup rules
- Auto pickup when passing within **1 tile** (orthogonal adjacency; no diagonals).
- Optional later: add explicit pickup action (not in v0.1).
