# Core rules

## Win/lose
- **Win**: reach the level exit (goal tile).
- **Lose**: hero HP reaches **0**.
- No instant-kill traps. Traps can still be lethal by reducing HP to 0.

## Lives and retry
- Each level starts with **3 lives**.
- On death: consume **1 life** and **rewind to the start of the turn**.
- On 0 lives: restart level from the beginning.
- No “practice mode” toggle.

## Deterministic retries (learning fairness)
On death retry (rewind to turn start), the game uses:
- **Same deal** (same 10-card hand)
- **Same RNG** for:
  - exchange draws (given the same discard choice)
  - per-row dice rolls (given the same row ordering/build)
  - enemy randomness (given the same state and tick index)
- The only way to change outcomes is to change decisions (discard choices, row builds, row order).

## Card dealing and exchange
- At the start of each turn, draw **10** cards. The deal guarantees at least 2 sensors and 2 actions (swapped in from the deck if needed), so a valid row is always possible.
- Before building rows, the player may exchange up to **half the hand**:
  - discard **0–5** cards → draw that many replacements.
- Exchanged cards go to the **discard pile**.
- Exchange discards do **not** count toward Pressure/Threat.

## Rule rows (player “program”)
- Players create one or more **rule rows** from their current hand.
- A row has structure:
  - `IF <predicate> THEN <action> [ELSE <action>]`
- Players may create as many rows as their hand allows.
- **At least 1 valid row is required** to roll dice and execute the turn.
- The game **prevents rolling** unless *all* rows are valid.

## Rolling and locking
- After rows are built, player presses **Roll & Lock**:
  - dice are rolled **per row**, in row order
  - rows become **locked**
  - no changes allowed after rolling

## Execution model
- Rows execute **sequentially**, in the order arranged.
- **Active row only**: while a row is active, only that row is evaluated each loop.
- Each loop allows **exactly one hero action**:
  - If predicate is true: attempt THEN action (consumes loop even if action fails)
  - If predicate is false and ELSE exists: attempt ELSE action (consumes loop even if action fails)
  - If predicate is false and no ELSE: perform hero class **default behavior**
- If an attempted action fails (blocked jump, blocked move, etc.), it still consumes the loop.

## Operators and precedence (CS-correct)
- Operators are cards.
- Precedence: **NOT > AND > OR**.
- Evaluation is left-to-right within the same precedence tier.
- Parentheses are not supported in v0.1 (possible future expansion).

## Pressure (threat) system
- Cards left **unplaced** at end of the turn generate Threat points.
- Threat becomes persistent **Pressure**.
- Pressure is spent to spawn enemies (resurrect-first).
- Pressure carries over between turns.
- Pressure **rewinds** on death retry (because the turn rewinds).
- Pressure always manifests:
  - if Pressure > 0 but you can’t afford the cheapest spawn, spawn a nuisance enemy anyway and spend 1 Pressure.

## Content safety / IP hygiene
- Use generic fantasy archetypes (goblin, orc, troll, skeleton, wraith, cultist).
- Avoid distinctive trademarked named creatures from specific IPs.
- Keep designs visually and narratively original even when using generic terms.
