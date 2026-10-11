# Engine Spec (Draft) — If-Then Dungeon v0.1

## 0) Decision: platform and stack
- **Language/build:** TypeScript + Vite; tests with Vitest.
- **Simulation core:** plain TypeScript, no DOM, seeded RNG (runs under Node).
- **UI:** DOM/CSS for cards and the rule builder; PixiJS (or Phaser) for the board and animation.
- **Distribution:** web/PWA first; Capacitor for Android/iOS; Tauri optional for desktop.
- **Why:** the game is UI-heavy and turn-based, the audience plays in classroom browsers/Chromebooks, and a pure core is easy to test and replay.
- **Revisit if:** visual spectacle (shaders, particles) becomes more important than browser reach. Because the core is separate from rendering, only the UI layer would be ported (e.g. to Godot).

This document specifies the engine boundaries, core data shapes, and required behaviors to implement the game reliably (determinism, replay, persistence). It is written for **TypeScript** (see §0 Decision), but the simulation should be framework-agnostic.

---

## 1) Guiding principles

### 1.1 Pure simulation core
- The simulation core must not read or write the DOM.
- Given the same inputs and seeds, it must produce the same outputs.

### 1.2 Determinism contract
- No `Math.random()` inside simulation.
- All randomness comes from seeded RNG passed into the core.

### 1.3 Event log first-class
- Every meaningful change produces an event for:
  - animation
  - explain mode
  - death recap
  - debugging

### 1.4 Serialization
- All engine state must be serializable to JSON for local saves.
- Save data includes a version for migrations.

---

## 2) High-level modules

### 2.1 Core modules (recommended files)
- `engine/state.ts` — state constructors, defaults, validation
- `engine/rng.ts` — seeded RNG utilities
- `engine/deck.ts` — deck building, shuffle, draw, discard, exchange
- `engine/rules/parse.ts` — parse card rows into AST or token groups
- `engine/rules/eval.ts` — evaluate predicates against state
- `engine/hero.ts` — hero defaults + hero_attack resolution
- `engine/enemy.ts` — enemy AI intents + actions
- `engine/traps.ts` — trap triggers + statuses
- `engine/spawn.ts` — pressure spending, resurrection-first, spawn selection
- `engine/tick.ts` — tick step reducer: (state, ctx) -> {state, events}
- `engine/turn.ts` — orchestrate deal/exchange/build/roll/execute sequence
- `engine/validate.ts` — content + level validation helpers (implemented: JSON cross-references, campaign progression, level maps, catalogs)

UI-side:
- `ui/controller.ts` — orchestrates engine calls, maintains tick history
- `ui/render.ts` — DOM transforms + animation
- `ui/builder.ts` — row builder interactions + validation feedback

---

## 3) Data model (core state)

### 3.1 Engine versioning
Every saved state includes:
- `saveVersion`
- `engineVersion`
- `contentVersion` (cards/levels data pack version)

### 3.2 Canonical types (conceptual)
Below are conceptual shapes, not strict TS.

#### GameState
- `meta`
  - `levelId`
  - `turnIndex` (int)
  - `phase` ("build" | "locked" | "executing" | "end")
  - `tickIndex` (int within the current executing phase)
- `hero` (HeroState)
- `enemies` (array of EnemyState)
- `board` (BoardState)
- `pressure` (int)
- `defeatedPool` (array of EnemyBlueprintRef for resurrection-first)
- `deck` (DeckState)
- `hand` (array of CardInstance)
- `rows` (array of RuleRowPlan) — after build/roll
- `rng` (RngState) — or seeds that can re-derive RNG streams
- `timers` (mechanic timers / vent cycles / etc)

#### HeroState
- `heroId`
- `pos` {x,y}
- `facing` ("N"|"E"|"S"|"W")
- `hp`
- `armor`
- `speedTiles` (for movement actions only)
- `sightRange`
- `statuses` (map/status list with counters)

#### EnemyState
- `enemyId` (unique instance id)
- `typeId` (base enemy id)
- `modifierIds` (ordered array of modifiers)
- `pos` {x,y}
- `facing`
- `hp`
- `tags` (cached)
- `statuses`
- `ai` (small deterministic memory: cadence offsets, last intent, timers)

#### BoardState
- `width`, `height`
- `tiles` (static terrain: floor or obstacle id; parsed from `level.board.map` via `content.mapLegend`)
- `traps` (trap instances keyed by tile)
- `mechanics` (conveyors with direction, vents, push plates with direction)
- `pickups` (pickup instances keyed by tile; includes enemy drops)
- `effects` (blood tiles and corpses, with remaining loops)
- `exit` tile coordinate
- `spawnPoints` list

#### DeckState
- `drawPile` (array of CardInstance IDs or objects)
- `discardPile`
- `seed` or shuffle metadata
- `recipeId` / resolved recipe reference

#### CardInstance
- `instanceId`
- `cardId` (from cards.json)
- `type`
- `rarity`

---

## 4) Turn lifecycle APIs

### 4.1 Start turn
**Input:** GameState  
**Output:** updated GameState + events
- snapshot must be captured (for retry determinism)
- deal 10 cards into `hand`

Suggested call:
- `turnStart(state) -> {state, events}`

### 4.2 Exchange
**Input:** state, list of instanceIds to discard (0–5)  
**Output:** new state + events
- discarded cards move to discard pile
- draw replacements deterministically

Suggested:
- `exchange(state, discardInstanceIds[]) -> {state, events}`

### 4.3 Build rows (from hand)
UI builds rows; engine validates.

Suggested:
- `validateRows(hand, rowDrafts) -> {ok, errors, parsed}`

Where `rowDrafts` are arrays of card instance IDs placed into slots.

### 4.4 Roll & lock (per row)
**Input:** state + parsed rows (AST/token groups)  
**Output:** state with `rows[]` locked, `loops[]` assigned, events
- dice size from level config
- roll per row in row order
- after this, rows are immutable for the turn

Suggested:
- `lockRows(state, parsedRows) -> {state, events}`

### 4.5 Execute
Execute rows sequentially, active row only.

Suggested:
- `stepTick(state) -> {state, events, done}`
- UI/controller loops until:
  - all rows complete OR win/lose triggered

For replay:
- store `{stateSnapshot, events}` per tick, at least for the current turn.

---

## 5) Rule row representation

### 5.1 RowDraft (UI format)
- `ifTokens`: [CardInstanceId | ...] (predicate stream)
- `thenAction`: CardInstanceId
- `elseAction`: CardInstanceId | null

### 5.2 Parsed predicate representation
Recommended: parse into an AST honoring precedence:
- `NOT` node
- `AND` node
- `OR` node
- leaf sensor nodes

Even without parentheses, AST is stable and explainable.

### 5.3 Execution semantics (per tick)
Within a row tick:
1) evaluate predicate against current state
2) if true → attempt THEN action
3) else if elseAction exists → attempt ELSE action
4) else → perform hero default behavior
5) resolve auto pickup (orthogonal within 1 tile)
6) resolve trap effects/status
7) run enemy tick
8) run mechanic timers/forced moves

---

## 6) Actions, failures, and reasons

### 6.1 Action resolution contract
Every attempted action returns:
- `success` boolean
- `reason` enum/string when failed

Examples:
- `BLOCKED`
- `LANDING_BLOCKED`
- `NO_TARGET_IN_RANGE`
- `IMMUNE`
- `ON_COOLDOWN` (future)

Failures still consume the tick.

### 6.2 Hero Attack (polymorphic)
`A_HERO_ATTACK` routes to:
- hero class `heroAttackKey` + params
- applies a standardized `AttackResult` in events

Ensure:
- no multiple attacks in one tick
- damage scaling via hero upgrades

---

## 7) Enemy AI and controlled randomness

### 7.1 AI intent selection
Each tick, enemy chooses an intent:
- move
- attack
- hold
- cast/support

Selection uses:
- deterministic conditions first
- tie-breakers from seeded RNG using `(turnSeed, enemyId, tickIndex)`

Log intent in events for debugging and explain mode (optionally show to player).

### 7.2 Enemy instance memory
Enemies may store:
- cadence offsets (for shaman/cultist)
- last intent
- cooldown counters
This memory must be part of state and therefore part of determinism.

---

## 8) Threat / Pressure and spawning

### 8.1 Threat calculation
At end of turn:
- determine cards not placed into any valid row
- compute threat per card (type base + rarity bonus)
- add to Pressure

### 8.2 Spawn resolution
Spend min(Pressure, spendCap) to spawn:
1) resurrect-first from defeated pool
2) else from enemy pool (with modifiers allowed)

If Pressure > 0 but cannot afford cheapest:
- nuisance spawn
- spend 1 Pressure

### 8.3 Spawn selection
- spawn points are predefined
- choose deterministically among valid points using spawn seed

---

## 9) Persistence (local-only gameplay)

### 9.1 Save slots
Minimum:
- `currentSession` (resume)
- `progress` (unlock state)
- `settings`

Offer “Start New”:
- wipe all three (or at least `currentSession` + `progress`, per your choice)
- keep only non-PII preferences if desired

### 9.2 Save cadence
Save after:
- turn end
- level completion
- death (for resume and debugging)
Avoid saving every tick unless necessary (size).

---

## 10) Validation requirements (must-have)

### 10.1 Content validation
At build time or load time:
- no card appears in decks before introduced
- final 3 levels introduce nothing new
- modifier order enforced
- dice size defined per level
- enemy pools exist and spawn costs defined

### 10.2 Runtime validation
Before rolling:
- at least 1 valid row
- all rows valid

Before executing a tick:
- state integrity (bounds checks, no overlapping illegal placements unless intended)

---

## 11) Minimal “vertical slice” target (engineering milestone)
A vertical slice should include:
- 1–3 levels
- IF/THEN row builder
- per-row dice rolls
- tick replay/step
- one trap
- one ranged enemy
- Pressure spawn from unused cards

If this slice is stable, you can scale via content.
