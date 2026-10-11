# Art references

Concept sheets from the first art pass. They are style and design references, not
in-game sprites: each is a full sheet (several poses on a white background, or a
scene) that still needs cropping before it can go on a card.

- **Originals:** full-resolution PNGs in Google Drive, `If then Dungeon/assets/`.
  These copies are WebP (quality 85, same 1536×1024 size) to keep the repo small.
- **Naming:** `<GAME_ID>.webp` is the main reference. `<GAME_ID>--alt-*.webp` are
  earlier drafts or variants kept for comparison. Theme files use the theme id
  from `themes.json`.
- Nothing here is loaded by the game yet; cards still use `assets/placeholders/`.

## Heroes — all 12 covered

| ID | File | Poses on the sheet |
|---|---|---|
| H_SWORDSMAN | `heroes/H_SWORDSMAN.webp` | front, side, back, move, attack, defend, crouch |
| H_ARCHER | `heroes/H_ARCHER.webp` | + attack, aim, roll |
| H_SHIELDBEARER | `heroes/H_SHIELDBEARER.webp` | + attack, defend, brace, rise |
| H_ROGUE | `heroes/H_ROGUE.webp` | + attack, dodge, stealth |
| H_ALCHEMIST | `heroes/H_ALCHEMIST.webp` | + throw, smoke, fire |
| H_MONK | `heroes/H_MONK.webp` | + attack, crouch, defend |
| H_CLERIC | `heroes/H_CLERIC.webp` | + heal, defend, smite |
| H_BATTLEMAGE | `heroes/H_BATTLEMAGE.webp` | + fireball, shield, bolt |
| H_SENTINEL | `heroes/H_SENTINEL.webp` (+ alt-1) | + attack, block, protect / strong stab |
| H_BERSERKER | `heroes/H_BERSERKER.webp` | + attack, rage, hammer |
| H_RANGER | `heroes/H_RANGER.webp` | + attack, hide, track |
| H_HUNTER | `heroes/H_HUNTER.webp` (+ alt-stone-cover) | + attack, aim, hide |

## Enemies — 11 of 13 covered

| ID | File |
|---|---|
| E_GOBLIN_SCOUT | `enemies/E_GOBLIN_SCOUT.webp` |
| E_GOBLIN_ARCHER | `enemies/E_GOBLIN_ARCHER.webp` |
| E_GOBLIN_KNIGHT | `enemies/E_GOBLIN_KNIGHT.webp` |
| E_GOBLIN_SHAMAN | `enemies/E_GOBLIN_SHAMAN.webp` |
| E_SKELETON_GUARD | `enemies/E_SKELETON_GUARD.webp` |
| E_CULTIST | `enemies/E_CULTIST.webp` |
| E_HOUND | `enemies/E_HOUND.webp` |
| E_SPIDER | `enemies/E_SPIDER.webp` |
| E_GHOUL | `enemies/E_GHOUL.webp` |
| E_ORC_WARDEN | `enemies/E_ORC_WARDEN.webp` (+ alt-1) |
| E_WRAITH_STALKER | `enemies/E_WRAITH_STALKER.webp` (+ 2 teleport drafts) |
| E_ORC_BRUTE | **missing** — `enemies/unassigned-bugbear-thug.webp` (club, rage, smash) could stand in |
| E_RAT_SWARM | **missing** |

## Traps, obstacles, mechanics

| ID | File |
|---|---|
| T_SPIKES | `traps/T_SPIKES.webp` (+ raised-only, red-markers) |
| T_PIT | `traps/T_PIT.webp` |
| T_POISON_FOG | `traps/T_POISON_FOG.webp` (+ heavy, empty) |
| T_SMOKE_VENTS | `traps/T_SMOKE_VENTS.webp` |
| T_BONE_SPIKES | `traps/T_BONE_SPIKES.webp` |
| T_CURSE_SIGIL | `traps/T_CURSE_SIGIL.webp` |
| T_WHISPER_TILES | `traps/T_WHISPER_TILES.webp` |
| T_BLEED_VINES | `traps/T_BLEED_VINES.webp` |
| T_SNARE_ROOTS | `traps/T_SNARE_ROOTS.webp` |
| T_ILLUSION_WALL | `traps/T_ILLUSION_WALL.webp` |
| O_LAVA_FLOW | `obstacles/O_LAVA_FLOW.webp` (+ low-res pixel draft) |
| M_TIMED_VENTS | `mechanics/M_TIMED_VENTS.webp` |
| M_CONVEYOR | `mechanics/M_CONVEYOR.webp` (+ alt-1) |
| M_PUSH_PLATES | **missing** |

Other obstacles (walls, rubble, gates, tombstones, brambles, bars, bone piles,
water, chasm edges) and pickups have no references yet.

## Themes (level backgrounds) — 7 of 8

The theme each scene belongs to is a best guess from `themes.json`; rename if you
meant otherwise.

| Theme | File | Notes |
|---|---|---|
| ruined_keep | `themes/ruined_keep--with-title-text.webp` | Has "Level 1" title text baked in; needs a clean version. `--alt-goblin-warrens` also fits. |
| sewer_vermin | `themes/sewer_vermin.webp` (+ alt-1) | |
| ash_foundry | `themes/ash_foundry.webp` (+ portrait, trap-room) | |
| catacombs | `themes/catacombs.webp` (+ alt-plague) | |
| cursed_chapel | `themes/cursed_chapel.webp` | |
| blood_arena | `themes/blood_arena.webp` | Orc hall with iron gate. |
| rotwood | `themes/rotwood.webp` (+ portrait, alt-crystal) | |
| mirror_halls | **missing** | |
