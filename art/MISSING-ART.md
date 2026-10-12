# Missing art

What still uses a placeholder in the game, and what each piece needs. When a
piece is done, delete its line here.

**Done so far:** all 12 heroes (boy and girl looks, looping card art), 12 of 13
enemies (looping card art), all 10 traps plus lava, timed vents and conveyor
(board tiles), 7 of 8 level backgrounds.

Formats (see `art/flow-inputs/` for prompts and how-tos):

| Kind | Source to send | Ends up as |
|---|---|---|
| Character card | front pose on white + Flow clip (16:9, ~4 s) | `assets/art/<ID>/card.mp4` + `card.webp` |
| Board tile | sheet in the trap style (states side by side on white) | `assets/art/<ID>/tile.webp` (cut by `scripts/cut-tiles.py`) |
| Level background | wide scene, 3:2, no text | `assets/themes/<theme id>.webp` |
| Action / sensor card | still image for the card's art window (5:4) | to be decided (cards have no final-art slot yet) |

---

## 1. Highest impact

- [ ] **Goblin Scout card loop** (`E_GOBLIN_SCOUT`), the first enemy players
  meet (Level 2). Image and prompt are ready: `art/flow-inputs/E_GOBLIN_SCOUT.jpg`,
  first prompt in `ENEMY-PROMPTS.md`.
- [ ] **Mirror Halls background** (`mirror_halls`, Levels 22–24). Theme notes:
  "polished obsidian, mirrors reflecting earlier themes, floating runes", palette
  deep blue-black with cyan and violet glow. Same style as the other scenes, wide,
  no text.

## 2. Board tiles still on placeholders

Same style as the trap sheets (isometric tile on white, title plaque). One state
is enough unless noted.

Obstacles (`O_STONE_WALL` is drawn as plain stone on purpose and needs no art):

- [ ] `O_RUBBLE_PILE` Rubble Pile: heap of broken stone and beams, clearly impassable but distinct from walls.
- [ ] `O_LOCKED_GATE` Locked Gate: heavy wooden gate with iron bands, shut tight.
- [ ] `O_TOMBSTONE` Tombstone: crooked headstone and disturbed soil, eerie, no gore.
- [ ] `O_THORN_BRAMBLES` Thorn Brambles: dense thorny brambles with red berries.
- [ ] `O_IRON_BARS` Iron Bars: vertical bars bolted into stone, rusty lock plate.
- [ ] `O_BONE_PILE` Bone Pile: mound of bones, ominous but stylized.
- [ ] `O_WATER_CHANNEL` Water Channel: shallow dark channel with ripples and slime.
- [ ] `O_CHASM_EDGE` Chasm Edge: black drop-off with a broken rock lip, clear "do not step".

Mechanics:

- [ ] `M_PUSH_PLATES` Push Plates: pressure plate, **no arrow drawn on it** (the
  game adds the direction arrow, like the conveyor). Two states: up, pressed.

Pickups (shown small on the board, so bold shapes read best):

- [ ] `P_HEALTH_DRAUGHT` Health Draught: corked flask of glowing red liquid on a small rune-etched stand.
- [ ] `P_ARMOR_SHARD` Armor Shard: jagged dark-iron plate with one glowing cyan rune, floating.
- [ ] `P_SPEED_RUNE` Speed Rune: flat stone disc with a swirling golden rune.

## 3. Enemy modifier badges

Shown in the level intro panel when a modifier is introduced. (On the board a
modified enemy shows the modifier's name as a text label; a small badge icon could
replace that later.) Small round icons would work better than full characters:

- [ ] `MOD_PLAGUE` Plague: green poison drip / skull.
- [ ] `MOD_ASHEN` Ashen: smoke wreath.
- [ ] `MOD_HOLLOW` Hollow: cracked skull with ghost glow (rises again).
- [ ] `MOD_CURSED` Cursed: purple sigil.
- [ ] `MOD_IRON` Iron: riveted iron plate.
- [ ] `MOD_BLOOD` Blood: red droplet / rage mark.
- [ ] `MOD_MUTANT` Mutant (optional, not used yet).
- [ ] `MOD_LANTERN` Lantern (optional, not used yet).

## 4. Cards (largest job: 74 cards)

Every card in the hand still shows a placeholder icon. Before generating art we
should decide the card art approach (one illustration per card, or one per family
with small badges), because 74 separate pieces is a lot. Suggested families:

- **Movement actions:** Move Forward, Turn Left, Turn Right, Turn Around, Jump
  Forward, Retreat, Backstep, Step Aside, Sprint, Turn to Open Path, Follow Right
  Wall, Face Enemy, Flee, Hold Position, Wait.
- **Defense / utility actions:** Raise Shield, Brace, Ward, Focus, Steel Nerves,
  Shake It Off, Cauterize, Cut Free, Probe, Illuminate, Bait, Stomp, Pierce.
- **Hero Attack:** 1 card, but its text changes per hero; could use the hero's own art.
- **Operators:** ELSE, NOT, AND, OR (simple rune symbols).
- **Sensors (41):** walls/blocked; enemies (ahead, adjacent, visible, nearby,
  left/right, count, enraged, armored, support, ranged, phase); hazards (spikes,
  pit, fog, smoke, vents, sigil, whisper, snare, illusion, trap, hazard/safe
  ahead); the hero's own state (low HP, cursed, fear, poisoned, bleeding, in fog,
  in smoke, in roots); corpses and blood (corpse nearby, ghoul visible,
  resurrection pending, blood trail).

## 5. Later / optional

- [ ] Girl looks for person-like enemies (goblins, cultist, orc brute, orc
  warden, ghoul, wraith): `assets/art/<ID>--f/`, already supported by the game.
- [ ] Ruined Keep background without the baked-in "Level 1" title text (the
  goblin warrens scene is used for now, which works fine).
- [ ] Logo and key art without the generator watermark (`branding/`).
