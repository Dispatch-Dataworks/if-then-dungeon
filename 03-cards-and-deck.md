# Cards and deck model

## Card types
- **Sensor (`S_…`)**: evaluates board state and returns true/false.
- **Action (`A_…`)**: attempts to perform one hero action in a tick.
- **Operator (`OP_…`)**: modifies predicate logic (ELSE/NOT/AND/OR).
- **Hero Action (`A_HERO_ATTACK`)**: polymorphic action whose effect depends on hero class.

## Rule rows
### Base row (Levels 1–6)
- `IF <Sensor> THEN <Action>`

### Extended row (after ELSE introduced)
- `IF <Predicate> THEN <Action> ELSE <Action>`

### Predicate (boolean expression)
- Built from Sensors and Operators:
  - NOT Sensor
  - Expr AND Expr
  - Expr OR Expr
- Precedence: NOT > AND > OR
- No parentheses (v0.1)

## Validity (UI enforced)
A row is valid if:
- it has a parseable predicate
- it has a THEN action
- if it contains ELSE, it has an ELSE action
- operators are placed legally:
  - NOT must precede a Sensor
  - AND/OR must connect two expressions
- no dangling operators

The game prevents rolling unless:
- at least 1 valid row exists
- all rows are valid

## Finite persistent deck per level
- Each level defines a **deck recipe** (counts per card ID).
- At level start, build that finite deck list and shuffle once.
- Each turn:
  - draw from draw pile
  - exchange discards go to discard pile
  - after turn, all cards go to discard pile
- When draw pile lacks enough cards:
  - reshuffle discard into draw pile

## Exchange (mulligan) rules
- Exchange is optional.
- Exchange limit: discard up to half the hand (0–5 with handSize=10).
- Exchange discards do not produce Threat/Pressure.
- Exchange discards go to discard pile and can reappear later after reshuffle.

## Card rarity
Rarity affects Threat/Pressure cost of leaving a card unused.
- common, uncommon, rare, epic, legendary

In v0.1:
- keep most operator cards common once introduced (tune per level JSON)
- reserve higher rarity for specialized sensors/actions later

## Threat value (per card)
Threat(card) = TypeBase(type) + RarityBonus(rarity)

TypeBase (tuned by simulation; see `BALANCE.md`):
- sensor 1
- action 1
- operator 2
- hero_action 2

RarityBonus:
- common +0
- uncommon +1
- rare +2
- epic +3
- legendary +4

## Example row builds
- `IF S_HAZARD_AHEAD THEN A_TURN_L ELSE A_MOVE_FWD`
- `IF OP_NOT S_ENEMY_VISIBLE THEN A_MOVE_FWD ELSE A_HERO_ATTACK`
- `IF S_ENEMY_AHEAD OP_AND OP_NOT S_BLOCKED_AHEAD THEN A_HERO_ATTACK ELSE A_STEP_ASIDE`
