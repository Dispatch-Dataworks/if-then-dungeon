# Technical Notes (Draft) — PWA + Architecture Guidance (Items 4–7)

This document expands the previously identified “items 4–7” into practical, implementation-ready guidance for an **TypeScript (Vite) SPA PWA**. It is intentionally verbose and is meant to be used as a development reference and brainstorming guide.

**Context (locked-in decisions):**
- **No user accounts.** Gameplay data is saved locally on-device. A player may resume locally or “Start New” to wipe local saves.
- Optional **moderated leaderboard**: players submit a nickname + score; submissions require admin review before becoming public.
- Media will be primarily AI-generated originals licensed for commercial use; any non-AI assets must be properly licensed and attributed.

---

## 4) Engine boundaries (TypeScript)

### 4.1 Why boundaries matter
Even “simple” grid games become hard to debug if logic and UI are mixed. Your game has:
- deterministic execution and retry logic
- tick-by-tick simulation
- rule parsing + evaluation
- enemy AI with controlled randomness
- persistent Pressure and deck state

These systems should be **testable without a browser DOM**. Therefore:

**Rule:** The simulation core must not touch the DOM.  
It should be pure functions over plain objects (with controlled randomness via seeded RNG).

### 4.2 Recommended layers
**Layer A — Simulation Core (pure-ish):**
- Owns state transitions:
  - deal/exchange
  - rule parsing → executable row plans
  - dice rolling per row
  - per-tick hero/enemy/trap resolution
  - Pressure and spawn resolution
- Produces:
  - next state
  - an event log describing “what happened” for replay and UI

**Layer B — Game Controller (orchestrator):**
- Calls the simulation core.
- Maintains the timeline log (tick history).
- Handles pause/step/speed and rewinds.
- Owns local-save persistence boundaries (load/save).
- Calls renderer with state snapshots + events.

**Layer C — Renderer (DOM/canvas):**
- Reads state and event log; draws/animates.
- Emits user intentions (build row, discard cards, roll).
- Never changes game state directly.

**Layer D — Content (JSON):**
- cards, heroes, enemies, levels, themes
- tuning knobs (dice size, spend caps, enemy pools)

### 4.3 Practical benefit
This structure enables:
- deterministic replays and debugging (“Why did I die?”)
- easy unit tests of rule parsing and tick outcomes
- future migration to canvas/WebGL later without rewriting core logic
- stable engine even if UI experiments change rapidly

### 4.4 Event log (core requirement)
Design an event log that is produced by the simulation during execution:

Examples:
- `ROW_START` / `ROW_END`
- `PREDICATE_EVAL` (tokens, groups, result)
- `HERO_ACTION_ATTEMPT` → `HERO_ACTION_RESULT` (success/fail + reason)
- `TRAP_TRIGGERED` (trapId, damage, status)
- `ENEMY_INTENT` (intent chosen, reason)
- `ENEMY_MOVE` / `ENEMY_ATTACK`
- `PICKUP_ACQUIRED`
- `PRESSURE_ADDED` and `SPAWN_PURCHASED`

The renderer consumes this to:
- animate precisely what happened
- show kid-facing explanations
- support “step mode” with accurate tooltips

### 4.5 Determinism and the “snapshot”
You already chose “same deal, same RNG” on retry. That requires:
- capturing a **turn-start snapshot** (complete state + deck order + pressure + timers)
- capturing or derivable **seeded RNG** state(s)

**Recommendation:** At *turn start*, store:
- current state (hero/enemies/traps/mechanics/pressure)
- full deck state (draw pile order, discard pile order)
- “turn seeds” for:
  - dealing
  - exchange drawing
  - dice per row
  - enemy randomness
  - spawn selection
- tick index (0 at row start, or global tick for the turn)

On retry:
- restore snapshot verbatim
- recompute the same deterministic results unless the player changes decisions

---

## 5) PWA constraints (especially iOS)

### 5.1 PWA feature expectations (practical)
Your game can be an installable PWA with:
- app shell caching for offline play
- persistent local saves
- optional “Add to Home Screen”

But some PWA features remain inconsistent across platforms (notably iOS Safari / iOS PWA):
- background tasks are limited/unreliable
- push notifications can vary by OS version and user settings
- storage eviction can happen under pressure
- some advanced APIs can be missing

**Design rule:** Core gameplay must not depend on background capabilities or push.

### 5.2 Offline-first approach
Because gameplay and saves are local:
- the game should work entirely offline once installed
- leaderboard submission requires connectivity, but the game does not

Offline-first implies:
- load from cached app shell
- load content JSON locally
- save state locally
- queue leaderboard submissions until online (optional)

### 5.3 Installation UX considerations
Provide a lightweight education UI:
- “Install for offline play” with instructions (platform-specific)
- show a “Storage used” indicator (optional)
- provide a one-click “Export Save” (future enhancement; even if not initially supported)

### 5.4 Storage strategy for offline + saves
Use **IndexedDB** for structured saves (recommended):
- robust for larger data than localStorage
- supports versioning and multiple save slots if needed later

Use localStorage only for:
- tiny preferences (sound on/off, accessibility toggles)

If using IndexedDB:
- version your DB schema early (`dbVersion`)
- store:
  - `profile` (no PII; local-only)
  - `progress` (level unlocks, hero unlocks, completed flags)
  - `currentSession` (resume point)
  - `settings`
  - `replay/debug` logs (optional; can cap size)

### 5.5 Leaderboard + child privacy posture (constraints)
Even with moderation:
- **Nickname** still can become PII if a child enters real name.
- Mitigations:
  - clear entry rules (“no real names, no school, no phone/email”)
  - auto filters (regex for emails, phone patterns, profanity)
  - server-side review queue
  - do not store IPs longer than necessary (ops decision)
  - do not enable chat, comments, user messaging

---

## 6) Offline + caching + update strategy (don’t brick updates)

### 6.1 Service worker caching objectives
Your cache must support:
- fast load (app shell)
- offline play
- safe updates without confusing or trapping users on an old build

### 6.2 Recommended caching model
**Precache (“app shell”):**
- HTML entry
- CSS
- JS bundles
- critical JSON content (cards/heroes/enemies/levels) *or* versioned fetch with fallback

**Runtime cache:**
- images/audio assets
- optional: additional theme packs

### 6.3 Versioning strategy
Maintain:
- `APP_VERSION` string in JS (e.g., semver + build hash)
- `CACHE_VERSION` string in service worker
- content JSON also has its own `version`

When deploying a new version:
- service worker installs new cache
- old cache stays until activation
- on activation, old caches removed

### 6.4 Update UX (required)
Add a simple update notification:
- when a new service worker is waiting:
  - show banner “Update available”
  - button “Reload to update”
- never silently reload mid-run (avoid losing a session)
- if a session is in progress, allow user to “Finish turn” then update

### 6.5 Avoiding content mismatch
Because levels/cards are data-driven:
- if JS engine updates but old cached content remains, you can break saves
- mitigate by:
  - version stamps in JSON
  - compatibility checks on load:
    - if `contentVersion` incompatible with `engineVersion`, show “Update required” and trigger a cache refresh
  - store the “last known content version” in local saves

### 6.6 Caching and AI assets
If you generate large numbers of assets:
- consider grouping by theme and lazy-loading
- cache with a cap (LRU) to avoid storage eviction
- provide an option to clear cached media without wiping progress

---

## 7) Performance model for mobile (DOM vs canvas, batching, animation)

### 7.1 Constraints
Mobile devices (and older tablets) can struggle with:
- large DOM grids (hundreds of nodes updated frequently)
- frequent layout/reflow operations
- heavy CSS effects on many elements
- synchronous JSON parsing for large data

Your game has:
- discrete tick steps
- predictable animations
- likely moderate board sizes

That means you can start with DOM and switch later if needed.

### 7.2 Recommended starting point
**Start with a DOM grid**, but design the renderer so it can be swapped later.

Tactics:
- Keep board sizes modest early (e.g., 8×8 to 12×12)
- Render each tile as one element, but avoid per-tick rebuilding the whole grid
- Use a single “hero” element positioned via transform
- Use a single element per enemy, also positioned via transform
- Use CSS transforms to avoid layout thrash

### 7.3 Batch updates per tick
For each tick:
1) compute new positions in the simulation
2) renderer applies updates in a single animation frame
3) optionally animate from old to new positions

Implementation detail:
- Use `requestAnimationFrame` to apply transforms
- Do not read layout values after writing styles (avoid forced reflow)

### 7.4 Replay/step performance
Stepping tick-by-tick can be cheap if:
- you store a compact tick log
- you avoid recomputing everything from start for each step

Recommended:
- store state snapshots every N ticks (e.g., every 10 ticks), plus deltas in between
- or store complete per-tick state for the turn only (turns are short)

### 7.5 Memory constraints
If you store full tick-by-tick state, cap it:
- keep only current turn’s history
- optionally keep last death’s history for explanation
- avoid unbounded logs in IndexedDB

### 7.6 Enemy “controlled randomness” cost
Randomness is not expensive; the cost is determinism discipline:
- always generate random values through seeded RNG
- never call `Math.random()` inside simulation
- in a debug build, log each random draw

### 7.7 Performance measurement plan
Before optimizing:
- implement a “perf overlay” toggle:
  - average tick time (ms)
  - render time (ms)
  - number of DOM nodes
  - FPS (approx)
- test on a low-end Android device and an iPhone Safari/PWA

---

## Appendix: Quick checklist for dev readiness (4–7)

**Architecture**
- [ ] simulation core has no DOM dependencies
- [ ] state is serializable for saves/retries
- [ ] event log exists for explanation + replay

**PWA**
- [ ] service worker precache + runtime cache
- [ ] update banner for waiting SW
- [ ] offline works after first load

**Storage**
- [ ] IndexedDB schema versioned
- [ ] “Start New” wipes saves safely
- [ ] content version compatibility checks

**Performance**
- [ ] renderer uses transforms, not layout-heavy updates
- [ ] tick updates batched via rAF
- [ ] tick history capped
