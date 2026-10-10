/** Content validation: cross-references between cards.json and levels.json. Returns a list of errors (empty = valid). */

interface CardsFile {
  cards: { id: string }[];
}

interface LevelDeck {
  baseDeckId?: string;
  fromPrevLevel?: number;
  adjustments: { id: string }[];
}

interface Level {
  levelId: number;
  introduces: string[];
  deck: LevelDeck;
  enemyPool: string[];
  nuisancePool: string[];
  modifiersAllowed: string[];
  traps: string[];
  mechanics: string[];
}

interface LevelsFile {
  campaign: { levelCount: number; modifierOrder: string[] };
  enemies: { modifierCostAdders: Record<string, number>; spawnCostsBase: Record<string, number> };
  content: { traps: Record<string, unknown>; mechanics: Record<string, unknown> };
  decks: Record<string, { cards: { id: string }[] }>;
  levels: Level[];
}

export function validateContent(cardsFile: CardsFile, levelsFile: LevelsFile): string[] {
  const errors: string[] = [];
  const cardIds = new Set(cardsFile.cards.map((c) => c.id));
  const enemyIds = new Set(Object.keys(levelsFile.enemies.spawnCostsBase));
  const modifierIds = new Set(Object.keys(levelsFile.enemies.modifierCostAdders));
  const trapIds = new Set(Object.keys(levelsFile.content.traps));
  const mechanicIds = new Set(Object.keys(levelsFile.content.mechanics));
  const anyId = (id: string) =>
    cardIds.has(id) || enemyIds.has(id) || modifierIds.has(id) || trapIds.has(id) || mechanicIds.has(id);

  const check = (where: string, ids: readonly string[], known: Set<string>, kind: string) => {
    for (const id of ids) if (!known.has(id)) errors.push(`${where}: unknown ${kind} "${id}"`);
  };

  if (cardIds.size !== cardsFile.cards.length) errors.push("cards.json: duplicate card ids");
  check("campaign.modifierOrder", levelsFile.campaign.modifierOrder, modifierIds, "modifier");
  for (const [deckId, deck] of Object.entries(levelsFile.decks)) {
    check(`decks.${deckId}`, deck.cards.map((c) => c.id), cardIds, "card");
  }

  const seen = new Set<number>();
  levelsFile.levels.forEach((level, index) => {
    const where = `level ${level.levelId}`;
    if (level.levelId !== index + 1) errors.push(`${where}: expected levelId ${index + 1} (levels must be in order)`);

    for (const id of level.introduces) if (!anyId(id)) errors.push(`${where}.introduces: unknown id "${id}"`);
    check(`${where}.deck.adjustments`, level.deck.adjustments.map((a) => a.id), cardIds, "card");
    check(`${where}.enemyPool`, level.enemyPool, enemyIds, "enemy");
    check(`${where}.nuisancePool`, level.nuisancePool, enemyIds, "enemy");
    check(`${where}.modifiersAllowed`, level.modifiersAllowed, modifierIds, "modifier");
    check(`${where}.traps`, level.traps, trapIds, "trap");
    check(`${where}.mechanics`, level.mechanics, mechanicIds, "mechanic");

    const { baseDeckId, fromPrevLevel } = level.deck;
    if ((baseDeckId === undefined) === (fromPrevLevel === undefined)) {
      errors.push(`${where}.deck: set exactly one of baseDeckId or fromPrevLevel`);
    } else if (baseDeckId !== undefined && !levelsFile.decks[baseDeckId]) {
      errors.push(`${where}.deck: unknown baseDeckId "${baseDeckId}"`);
    } else if (fromPrevLevel !== undefined && !seen.has(fromPrevLevel)) {
      errors.push(`${where}.deck: fromPrevLevel ${fromPrevLevel} must reference an earlier level`);
    }
    seen.add(level.levelId);
  });

  if (levelsFile.levels.length !== levelsFile.campaign.levelCount) {
    errors.push(`campaign.levelCount is ${levelsFile.campaign.levelCount} but ${levelsFile.levels.length} levels are defined`);
  }
  return errors;
}
