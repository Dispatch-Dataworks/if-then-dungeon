/** Content validation: cross-references between the JSON content files. Each function returns a list of errors (empty = valid). */

interface Card {
  id: string;
  params: Record<string, unknown>;
}

interface CardsFile {
  cards: Card[];
}

interface LevelDeck {
  baseDeckId?: string;
  fromPrevLevel?: number;
  adjustments: { id: string; add?: number; remove?: number }[];
}

interface Board {
  heroFacing: string;
  map: string[];
  pushPlateDirections?: string[];
}

interface Level {
  levelId: number;
  themeId: string;
  diceSides: number;
  introduces: string[];
  deck: LevelDeck;
  enemyPool: string[];
  nuisancePool: string[];
  modifiersAllowed: string[];
  traps: string[];
  mechanics: string[];
  obstacles: string[];
  spawnPoints: string[];
  board: Board;
}

interface WithStatus {
  appliesStatus?: string[];
  [key: string]: unknown;
}

interface LevelsFile {
  campaign: { levelCount: number; themes: { id: string; levels: number[] }[]; modifierOrder: string[] };
  enemies: { modifierCostAdders: Record<string, number>; spawnCostsBase: Record<string, number> };
  content: {
    traps: Record<string, WithStatus>;
    mechanics: Record<string, unknown>;
    obstacles: Record<string, { blocksMovement: boolean; blocksLoS: boolean; jumpable: boolean }>;
    pickups: Record<string, unknown>;
    statuses: Record<string, unknown>;
    boardEffects: Record<string, WithStatus>;
    mapLegend: Record<string, string>;
  };
  decks: Record<string, { cards: { id: string; count: number }[] }>;
  levels: Level[];
}

interface StatusOnHit {
  status: string;
}

interface HeroesFile {
  heroes: {
    id: string;
    unlockAfterLevel: number;
    heroAttack: { statusOnHit?: StatusOnHit; bonus?: { vsStatus?: string[] } };
    upgrades: { id: string }[];
  }[];
}

interface EnemiesFile {
  combat: { drops: { table: string[] } };
  enemies: { id: string; statusOnHit?: StatusOnHit & { altStatus?: string }; grantsAllyStatus?: string; immuneTo?: string[] }[];
  modifiers: Record<string, { statusOnHit?: StatusOnHit; immuneTo?: string[]; leavesBoardEffect?: string; [key: string]: unknown }>;
}

interface ThemesFile {
  themes: { id: string; levels: number[]; obstacles: string[] }[];
}

const DICE = [4, 6, 8, 10, 12];
const FACINGS = ["N", "E", "S", "W"];
const FINAL_REMIX_LEVELS = 3;

export function validateContent(cardsFile: CardsFile, levelsFile: LevelsFile): string[] {
  const errors: string[] = [];
  const { content } = levelsFile;
  const cardIds = new Set(cardsFile.cards.map((c) => c.id));
  const enemyIds = new Set(Object.keys(levelsFile.enemies.spawnCostsBase));
  const modifierIds = new Set(Object.keys(levelsFile.enemies.modifierCostAdders));
  const trapIds = new Set(Object.keys(content.traps));
  const mechanicIds = new Set(Object.keys(content.mechanics));
  const obstacleIds = new Set(Object.keys(content.obstacles));
  const pickupIds = new Set(Object.keys(content.pickups));
  const statusIds = new Set(Object.keys(content.statuses));
  const introducible = [cardIds, enemyIds, modifierIds, trapIds, mechanicIds, pickupIds];

  const check = (where: string, ids: readonly string[], known: Set<string>, kind: string) => {
    for (const id of ids) if (!known.has(id)) errors.push(`${where}: unknown ${kind} "${id}"`);
  };

  if (cardIds.size !== cardsFile.cards.length) errors.push("cards.json: duplicate card ids");
  check("campaign.modifierOrder", levelsFile.campaign.modifierOrder, modifierIds, "modifier");
  for (const [deckId, deck] of Object.entries(levelsFile.decks)) {
    check(`decks.${deckId}`, deck.cards.map((c) => c.id), cardIds, "card");
  }

  // Every status referenced anywhere in cards or content must be defined.
  for (const card of cardsFile.cards) {
    const p = card.params as { status?: string; cleanses?: string[]; buff?: string; alsoGrants?: { buff: string } };
    const refs = [p.status, p.buff, p.alsoGrants?.buff, ...(p.cleanses ?? [])].filter((s): s is string => !!s);
    check(`cards.${card.id}`, refs, statusIds, "status");
  }
  for (const [id, t] of Object.entries({ ...content.traps, ...content.boardEffects })) {
    check(`content.${id}`, t.appliesStatus ?? [], statusIds, "status");
  }

  const introducedAt = new Map<string, number>();
  const resolvedDecks = new Map<number, Map<string, number>>();
  const themeOf = new Map(levelsFile.campaign.themes.flatMap((t) => t.levels.map((n) => [n, t.id] as const)));

  levelsFile.levels.forEach((level, index) => {
    const n = level.levelId;
    const where = `level ${n}`;
    if (n !== index + 1) errors.push(`${where}: expected levelId ${index + 1} (levels must be in order)`);
    if (themeOf.get(n) !== level.themeId) errors.push(`${where}: themeId "${level.themeId}" does not match campaign.themes`);
    if (!DICE.includes(level.diceSides)) errors.push(`${where}: diceSides must be one of ${DICE.join(", ")}`);

    for (const id of level.introduces) {
      if (!introducible.some((set) => set.has(id))) errors.push(`${where}.introduces: unknown id "${id}"`);
      if (introducedAt.has(id)) errors.push(`${where}.introduces: "${id}" was already introduced in level ${introducedAt.get(id)}`);
      else introducedAt.set(id, n);
    }
    const remix = n > levelsFile.campaign.levelCount - FINAL_REMIX_LEVELS;
    if (remix && level.introduces.length > 0) errors.push(`${where}: final remix levels must not introduce anything`);
    if (!remix && level.introduces.length === 0) errors.push(`${where}: must introduce at least one new thing`);

    check(`${where}.deck.adjustments`, level.deck.adjustments.map((a) => a.id), cardIds, "card");
    check(`${where}.enemyPool`, level.enemyPool, enemyIds, "enemy");
    check(`${where}.nuisancePool`, level.nuisancePool, enemyIds, "enemy");
    check(`${where}.modifiersAllowed`, level.modifiersAllowed, modifierIds, "modifier");
    check(`${where}.traps`, level.traps, trapIds, "trap");
    check(`${where}.mechanics`, level.mechanics, mechanicIds, "mechanic");
    check(`${where}.obstacles`, level.obstacles, obstacleIds, "obstacle");

    const { baseDeckId, fromPrevLevel } = level.deck;
    let deck: Map<string, number> | undefined;
    if ((baseDeckId === undefined) === (fromPrevLevel === undefined)) {
      errors.push(`${where}.deck: set exactly one of baseDeckId or fromPrevLevel`);
    } else if (baseDeckId !== undefined) {
      const base = levelsFile.decks[baseDeckId];
      if (!base) errors.push(`${where}.deck: unknown baseDeckId "${baseDeckId}"`);
      else deck = new Map(base.cards.map((c) => [c.id, c.count]));
    } else {
      const prev = resolvedDecks.get(fromPrevLevel!);
      if (!prev) errors.push(`${where}.deck: fromPrevLevel ${fromPrevLevel} must reference an earlier level`);
      else deck = new Map(prev);
    }
    if (deck) {
      for (const a of level.deck.adjustments) deck.set(a.id, (deck.get(a.id) ?? 0) + (a.add ?? 0) - (a.remove ?? 0));
      resolvedDecks.set(n, deck);
    }

    // Nothing may be used before the campaign introduces it.
    const deckCards = deck ? [...deck].filter(([, count]) => count > 0).map(([id]) => id) : [];
    const mapPickups = level.board.map.flatMap((row) => [...row]).map((ch) => content.mapLegend[ch] ?? "").filter((id) => pickupIds.has(id));
    const used = [
      ...level.enemyPool, ...level.nuisancePool, ...level.modifiersAllowed,
      ...level.traps, ...level.mechanics, ...deckCards, ...mapPickups,
    ];
    for (const id of new Set(used)) {
      const at = introducedAt.get(id);
      if (at === undefined) errors.push(`${where}: uses "${id}" but no level introduces it`);
      else if (at > n) errors.push(`${where}: uses "${id}" before it is introduced (level ${at})`);
    }
    for (const id of level.introduces) {
      if (cardIds.has(id) && !deck?.get(id)) errors.push(`${where}: introduces card "${id}" but it is not in the deck`);
    }

    errors.push(...validateBoard(level, levelsFile).map((e) => `${where}.board: ${e}`));
  });

  if (levelsFile.levels.length !== levelsFile.campaign.levelCount) {
    errors.push(`campaign.levelCount is ${levelsFile.campaign.levelCount} but ${levelsFile.levels.length} levels are defined`);
  }
  return errors;
}

/** Checks one level map: shape, legend, borders, reachability, and that its contents match the level's lists. */
export function validateBoard(level: Level, levelsFile: LevelsFile): string[] {
  const errors: string[] = [];
  const { mapLegend: legend, obstacles } = levelsFile.content;
  const { map, heroFacing, pushPlateDirections = [] } = level.board;
  const height = map.length;
  const width = map[0]?.length ?? 0;

  if (!FACINGS.includes(heroFacing)) errors.push(`heroFacing must be one of ${FACINGS.join(", ")}`);
  if (map.some((row) => row.length !== width)) return [...errors, "all rows must be the same length"];

  const at = (x: number, y: number) => map[y]![x]!;
  const idAt = (x: number, y: number) => (legend[at(x, y)] ?? "").split(":")[0]!;
  const blocked = (x: number, y: number) => {
    const id = idAt(x, y);
    return (obstacles[id]?.blocksMovement ?? false) || id === "T_ILLUSION_WALL";
  };

  const found = { start: [] as [number, number][], exit: [] as [number, number][], spawns: new Map<string, [number, number]>() };
  const seenIds = new Set<string>();
  let plates = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const ch = at(x, y);
      const id = idAt(x, y);
      if (!legend[ch]) {
        errors.push(`unknown symbol "${ch}" at (${x},${y})`);
        continue;
      }
      const onBorder = x === 0 || y === 0 || x === width - 1 || y === height - 1;
      if (onBorder && !obstacles[id]) errors.push(`border tile (${x},${y}) must be an obstacle`);
      if (ch === "@") found.start.push([x, y]);
      else if (ch === "X") found.exit.push([x, y]);
      else if (id.startsWith("SP_")) {
        if (found.spawns.has(id)) errors.push(`spawn point ${id} appears twice`);
        found.spawns.set(id, [x, y]);
      }
      if (ch === "P") plates++;
      seenIds.add(id);
    }
  }
  if (found.start.length !== 1) errors.push(`expected exactly one hero start "@", found ${found.start.length}`);
  if (found.exit.length !== 1) errors.push(`expected exactly one exit "X", found ${found.exit.length}`);
  if (plates !== pushPlateDirections.length) {
    errors.push(`${plates} push plates but ${pushPlateDirections.length} pushPlateDirections`);
  }
  for (const d of pushPlateDirections) if (!FACINGS.includes(d)) errors.push(`invalid push plate direction "${d}"`);

  const sameSet = (kind: string, prefix: string, listed: readonly string[]) => {
    const onMap = [...seenIds].filter((id) => id.startsWith(prefix)).sort();
    const expected = [...new Set(listed)].sort();
    if (onMap.join() !== expected.join()) errors.push(`${kind} on map [${onMap.join(", ")}] do not match level list [${expected.join(", ")}]`);
  };
  sameSet("traps", "T_", level.traps);
  sameSet("mechanics", "M_", level.mechanics);
  sameSet("obstacles", "O_", level.obstacles);
  sameSet("spawn points", "SP_", level.spawnPoints);

  // Walking reachability from the hero start (traps are passable; obstacles and illusion walls are not).
  const start = found.start[0];
  if (start) {
    const reached = new Set([start.join()]);
    const queue = [start];
    while (queue.length) {
      const [x, y] = queue.shift()!;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height || reached.has(`${nx},${ny}`) || blocked(nx, ny)) continue;
        reached.add(`${nx},${ny}`);
        queue.push([nx, ny]);
      }
    }
    const exit = found.exit[0];
    if (exit && !reached.has(exit.join())) errors.push("exit is not reachable from the hero start");
    // Design rule: there is always a walking route that avoids every damaging trap (traps are shortcuts, not tolls).
    const traps = levelsFile.content.traps as Record<string, { damage?: number; damagePerLoop?: number }>;
    const hurts = (x: number, y: number) => { const t = traps[idAt(x, y)]; return !!t && (t.damage !== undefined || t.damagePerLoop !== undefined); };
    const safe = new Set([start.join()]);
    const q2 = [start];
    while (q2.length) {
      const [x, y] = q2.shift()!;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height || safe.has(`${nx},${ny}`) || blocked(nx, ny) || hurts(nx, ny)) continue;
        safe.add(`${nx},${ny}`);
        q2.push([nx, ny]);
      }
    }
    if (exit && !safe.has(exit.join())) errors.push("there is no route to the exit that avoids every damaging trap");
    for (const [id, pos] of found.spawns) if (!reached.has(pos.join())) errors.push(`spawn point ${id} is not reachable`);
  }
  return errors;
}

/** Cross-checks heroes.json, enemies.json and themes.json against levels.json. */
export function validateCatalogs(
  heroesFile: HeroesFile,
  enemiesFile: EnemiesFile,
  themesFile: ThemesFile,
  levelsFile: LevelsFile,
): string[] {
  const errors: string[] = [];
  const statusIds = new Set(Object.keys(levelsFile.content.statuses));
  const checkStatus = (where: string, ids: (string | undefined)[]) => {
    for (const id of ids) if (id && !statusIds.has(id)) errors.push(`${where}: unknown status "${id}"`);
  };

  const heroIds = heroesFile.heroes.map((h) => h.id);
  if (new Set(heroIds).size !== heroIds.length) errors.push("heroes.json: duplicate hero ids");
  const upgradeIds = heroesFile.heroes.flatMap((h) => h.upgrades.map((u) => u.id));
  if (new Set(upgradeIds).size !== upgradeIds.length) errors.push("heroes.json: duplicate upgrade ids");
  for (const h of heroesFile.heroes) {
    if (h.unlockAfterLevel < 0 || h.unlockAfterLevel >= levelsFile.campaign.levelCount) {
      errors.push(`heroes.${h.id}: unlockAfterLevel must be between 0 and ${levelsFile.campaign.levelCount - 1}`);
    }
    checkStatus(`heroes.${h.id}`, [h.heroAttack.statusOnHit?.status, ...(h.heroAttack.bonus?.vsStatus ?? [])]);
  }

  const enemyIds = enemiesFile.enemies.map((e) => e.id).sort();
  const costed = Object.keys(levelsFile.enemies.spawnCostsBase).sort();
  if (enemyIds.join() !== costed.join()) errors.push("enemies.json enemies must match levels.json enemies.spawnCostsBase");
  for (const e of enemiesFile.enemies) {
    checkStatus(`enemies.${e.id}`, [e.statusOnHit?.status, e.statusOnHit?.altStatus, e.grantsAllyStatus, ...(e.immuneTo ?? [])]);
  }
  const modifierIds = Object.keys(enemiesFile.modifiers).sort();
  if (modifierIds.join() !== Object.keys(levelsFile.enemies.modifierCostAdders).sort().join()) {
    errors.push("enemies.json modifiers must match levels.json enemies.modifierCostAdders");
  }
  for (const [id, m] of Object.entries(enemiesFile.modifiers)) {
    checkStatus(`modifiers.${id}`, [m.statusOnHit?.status, ...(m.immuneTo ?? [])]);
    if (m.leavesBoardEffect && !levelsFile.content.boardEffects[m.leavesBoardEffect]) {
      errors.push(`modifiers.${id}: unknown board effect "${m.leavesBoardEffect}"`);
    }
  }
  for (const p of enemiesFile.combat.drops.table) {
    if (!levelsFile.content.pickups[p]) errors.push(`enemies.json combat.drops: unknown pickup "${p}"`);
  }

  const campaign = levelsFile.campaign.themes;
  if (themesFile.themes.map((t) => t.id).join() !== campaign.map((t) => t.id).join()) {
    errors.push("themes.json themes must match levels.json campaign.themes (same ids, same order)");
  }
  for (const t of themesFile.themes) {
    const levels = levelsFile.levels.filter((l) => l.themeId === t.id);
    if (levels.map((l) => l.levelId).join() !== t.levels.join()) errors.push(`themes.${t.id}: levels do not match levels.json`);
    const used = [...new Set(levels.flatMap((l) => l.obstacles))].sort();
    if (used.join() !== [...t.obstacles].sort().join()) errors.push(`themes.${t.id}: obstacles do not match the obstacles its levels use`);
  }
  return errors;
}
