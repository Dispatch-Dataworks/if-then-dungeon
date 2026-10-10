# Threat / Pressure / Spawning

## Definitions
- **Threat**: points generated *this turn* from unplaced cards.
- **Pressure**: persistent stored Threat that carries over between turns and spawns enemies.

## Threat generation
At end of player turn:
1) Identify **unplaced** cards remaining in hand (not used in any valid row).
2) For each unplaced card, compute Threat(card).
3) Sum → `newThreat`.
4) `Pressure += newThreat`.

Notes:
- Cards placed into valid rows count as placed even if they never trigger.
- Cards discarded via exchange do not count toward Threat.

## Pressure spend cap
- Default per level: `pressureSpendCap = 6 + levelNumber`
- Each level may override manually for tuning.

## Spawning with Pressure
Immediately after Pressure increases:
1) Determine the spawn budget: `budget = min(Pressure, pressureSpendCap)`
2) Spend budget to spawn enemies:
   - **Resurrect-first** from defeated pool (if available)
   - else spawn from `enemyPool`
3) Spawn points are known/predictable sets; pick randomly among valid points.

After spawns:
- `Pressure -= spent`

### Always manifests rule
If `Pressure > 0` but you cannot afford the cheapest spawnCost available:
- spawn one nuisance enemy from `nuisancePool`
- reduce Pressure by 1
- nuisance spawns should be simple 1-skull threats

## Spawn costs (base)
These are the base costs before modifiers:
- Goblin Scout: 2
- Rat Swarm: 2
- Goblin Archer: 5
- Goblin Knight: 4
- Skeleton Guard: 4
- Cultist: 4
- Spider: 4
- Hound: 4
- Orc Brute: 5
- Goblin Shaman: 7
- Orc Warden: 7
- Ghoul: 7
- Wraith Stalker: 10

## Modifiers
Modifiers add to spawn cost and alter behavior/traits.
Cost adders:
- hollow +1
- mutant +2
- iron +2
- ashen +1
- blood +2
- plague +1
- cursed +2
- lantern +1

Examples:
- Ashen Goblin Archer = 4 + 1 = 5
- Iron Orc Brute = 5 + 2 = 7
- Plague Rat Swarm = 2 + 1 = 3

## Starting Pressure
- A level may set `startingPressure` (default 0). It is spent at level start, so some enemies are already waiting (used on L19–21).

## Board cap
- At most `4 + floor(levelNumber / 6)` enemies can be on the board at once. Pressure that cannot spawn because the board is full stays banked for later turns.
- Spawn points within 2 tiles of the hero are skipped.

## Pressure and death retry
- Pressure rewinds to the value at turn start when the player retries the turn.
- Spawn results and randomness rewind as well.
