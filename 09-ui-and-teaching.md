# UI and teaching design

## Rule builder UI (kid-friendly)
- Each row is a horizontal “sentence”:
  - IF [predicate tokens] THEN [action card] (ELSE [action card])
- Players drag cards from hand into slots.
- Token stream validates live; invalid segments highlight red.
- Roll button is disabled until:
  - at least 1 valid row exists
  - all rows are valid

## Predicate visualization (teaches precedence)
Even without parentheses, show grouping:
- NOT binds to the sensor chip
- AND groups are boxed
- OR groups are separated

Example display for:
`A OR B AND NOT C`
- show as: `A OR (B AND (NOT C))`

## Explain mode (learning)
Tap “Explain” on a row:
- Show how the predicate is parsed
- Show which token caused predicate to be true/false last tick
- Show which action executed and whether it failed (and why)

## Execution playback controls
- Step tick-by-tick
- Pause/resume
- Speed slider (1x, 2x, 4x)
- Highlight:
  - active row
  - predicate outcome
  - action result
  - enemy intents (optional intent arrows)

## Death recap (fast, factual)
On death:
- Cause: trap/enemy
- Trigger: what happened (e.g., “Jump landing blocked”)
- Prevent: one actionable hint
- Buttons: Retry Turn / Restart Level

## Pressure UI (must be explicit)
- Persistent “Pressure meter” visible in the HUD.
- End-of-turn summary:
  - Unplaced cards: list with threat pips
  - +Threat → Pressure
  - Spawns purchased, costs, remaining Pressure
- Nuisance spawn message when it triggers.

## Accessibility & pacing
- Use words + icons (you locked: use words).
- Fixed modifier ordering in names.
- Keep names short: “Iron Orc Brute”, not long fantasy titles.
