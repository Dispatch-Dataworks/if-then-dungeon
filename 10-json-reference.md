# JSON reference (v0.1)

This section documents the expected structure and includes the latest example objects used during design.

## File layout (recommended)
- `rules.json` — global rules and formulas
- `cards.json` — card catalog (IDs → type/rarity/engineKey/params)
- `levels.json` — campaign plan + level definitions + base decks
- `heroes.json` — hero catalog (defaults, stats, upgrades)
- `enemies.json` — enemy catalog (behavior keys, spawn costs, tags, modifiers)
- `themes.json` — per-theme art/audio palette and map generation constraints (optional)

## Level deck model
A level can define its deck as:
- base deck + adjustments, or
- inherit from previous resolved deck + adjustments

Adjustment record:
- `{ "id": "<CARD_ID>", "add": <int> }`

## Pressure spend cap
Default is formula:
- `"formula": "6 + levelNumber"`
Levels may include:
- `"pressureSpendCapOverride": 12`

## Key constraints to enforce
- No cards appear in a level deck before they are introduced.
- Final 3 levels introduce nothing new (22–24).
- At least 1 valid row required to roll.
- All rows must be valid to roll.
- Deterministic retry: restore deck state + pressure + RNG seeds.

## Latest example objects

### rules.json (example)
```json
{
  "file": "rules.json",
  "version": "0.1.0",
  "core": {
    "handSize": 10,
    "exchangeMax": 5,
    "requireAtLeastOneRuleRowToRoll": true,
    "preventRollUnlessAllRowsValid": true,
    "rowsExecuteSequentially": true,
    "activeRowOnly": true,
    "oneActionPerLoop": true,
    "actionConsumesLoopEvenIfFails": true,
    "noDefaultActionIfConditionTrue": true,
    "elseRowContained": true,
    "operatorPrecedence": [
      "NOT",
      "AND",
      "OR"
    ],
    "trapsNoInstantKill": true,
    "trapsLethalWhenIntroduced": true
  },
  "retry": {
    "livesPerLevel": 3,
    "onDeathRewindTo": "turn_start",
    "sameDealSameRngOnRetry": true,
    "onLivesZero": "restart_level"
  },
  "threatPressure": {
    "typeBase": {
      "sensor": 1,
      "action": 2,
      "operator": 3,
      "hero_action": 3
    },
    "rarityBonus": {
      "common": 0,
      "uncommon": 1,
      "rare": 2,
      "epic": 3,
      "legendary": 4
    },
    "threatCountsOnly": "unplaced_cards_remaining_in_hand",
    "exchangeDiscardsCountForThreat": false,
    "pressureCarriesOverBetweenTurns": true,
    "pressureRewindsOnDeathRetry": true,
    "pressureSpendCapDefaultFormula": "6 + levelNumber",
    "pressureAlwaysManifests": {
      "enabled": true,
      "ifPressurePositiveButCannotAffordCheapestSpawn": {
        "spawnFrom": "nuisancePool",
        "pressureCost": 1
      }
    }
  }
}
```

### cards.json (example)
```json
{
  "file": "cards.json",
  "version": "0.1.0",
  "cards": [
    { "id": "A_MOVE_FWD", "type": "action", "rarity": "common", "name": "Move Forward", "engineKey": "move_forward", "params": { "tiles": 1 } },
    { "id": "A_TURN_L", "type": "action", "rarity": "common", "name": "Turn Left", "engineKey": "turn", "params": { "dir": "left" } },
    { "id": "A_TURN_R", "type": "action", "rarity": "common", "name": "Turn Right", "engineKey": "turn", "params": { "dir": "right" } },
    { "id": "A_WAIT", "type": "action", "rarity": "common", "name": "Wait", "engineKey": "wait", "params": {} },
    { "id": "A_TURN_AROUND", "type": "action", "rarity": "common", "name": "Turn Around", "engineKey": "turn", "params": { "dir": "around" } },
    { "id": "A_JUMP_FWD", "type": "action", "rarity": "common", "name": "Jump Forward", "engineKey": "jump_forward", "params": { "tiles": 2, "failIfLandingBlocked": true } },
    { "id": "A_RETREAT", "type": "action", "rarity": "common", "name": "Retreat", "engineKey": "move_backward", "params": { "tiles": 1, "failIfBlocked": true } },
    { "id": "A_BACKSTEP", "type": "action", "rarity": "common", "name": "Backstep", "engineKey": "move_backward", "params": { "tiles": 1, "failIfBlocked": true } },
    { "id": "A_HOLD", "type": "action", "rarity": "common", "name": "Hold Position", "engineKey": "wait", "params": {} },
    { "id": "A_STEP_ASIDE", "type": "act
... (see json/*.json for full content)

```

### levels.json (example)
```json
{
  "file": "levels.json",
  "version": "0.1.0",
  "campaign": {
    "levelCount": 24,
    "themes": [
      { "id": "ruined_keep", "levels": [1, 2, 3] },
      { "id": "sewer_vermin", "levels": [4, 5, 6] },
      { "id": "ash_foundry", "levels": [7, 8, 9] },
      { "id": "catacombs", "levels": [10, 11, 12] },
      { "id": "cursed_chapel", "levels": [13, 14, 15] },
      { "id": "blood_arena", "levels": [16, 17, 18] },
      { "id": "rotwood", "levels": [19, 20, 21] },
      { "id": "mirror_halls", "levels": [22, 23, 24] }
    ],
    "modifierOrder": ["plague", "ashen", "hollow", "cursed", "iron", "blood"]
  },
  "enemies": {
    "modifierCostAdders": {
      "hollow": 1,
      "mutant": 2,
      "iron": 2,
      "ashen": 1,
      "blood": 2,
      "plague": 1,
      "cursed": 2,
      "lantern": 1
    },
    "spawnCostsBase": {
      "E_GOBLIN_SCOUT": 2,
      "E_RAT_SWARM": 2,
      "E_GOBLIN_ARCHER": 4,
      "E_GOBLIN_KNIGHT": 4,
      "E_SKELETON_GUARD": 4,
      "E_CULTIST": 4,
      "E_SPIDER": 4,
      "E_HOUND": 4,
      "E_ORC_BRUTE": 5,
      "E_GOBLIN_SHAMAN": 7,
      "E_ORC_WARDEN": 7,
      "E_GHOUL": 7,
      "E_WRAITH_STALKER": 10
    }
  },
  "content": {
    "traps": {
      "T_SPIKES": { "damage": 3 },
      "T_PIT": { "damage": 4 },
      "T_POISON_FOG": { "damagePerLoop": 1 },
      "T_SMOKE_VENTS": { "damagePerLoop": 1, "visibilityPenalty": 1 },
      "
... (see json/*.json for full content)

```

In the repo zip, these placeholders are replaced with the actual JSON.
