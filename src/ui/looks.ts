/**
 * Character looks. Heroes and person-like enemies can have a second look in assets/art/<ID>--f/ (a girl version of
 * the same character). Looks only swap art: stats, rules and IDs never change. Until a look's art exists, the
 * original art is used, so nothing here changes what a player sees.
 */
import { HERO_LIST } from "../engine/content";
import { realArt } from "./assets";
import { progress, update } from "./progress";

export type Look = "m" | "f";

const SECOND = "f";
const keyFor = (id: string, look: Look) => (look === SECOND ? `${id}--${SECOND}` : id);

/** Whether this character has art for its second look yet. */
export const hasSecondLook = (id: string, has = (key: string) => !!realArt(key)) => has(keyFor(id, SECOND));

/** Heroes the player hasn't chosen a look for alternate down the roster, so a fresh game shows a mix. */
export function defaultHeroLook(heroId: string): Look {
  return HERO_LIST.findIndex((h) => h.id === heroId) % 2 === 1 ? "f" : "m";
}

export const heroLook = (heroId: string): Look => progress().heroLooks[heroId] ?? defaultHeroLook(heroId);

export function toggleHeroLook(heroId: string) {
  const next: Look = heroLook(heroId) === "f" ? "m" : "f";
  update((p) => { p.heroLooks[heroId] = next; });
}

/** Art key for a hero in its current look, falling back to the original art. */
export function heroArtKey(heroId: string, has = (key: string) => !!realArt(key)): string {
  const key = keyFor(heroId, heroLook(heroId));
  return key !== heroId && has(key) ? key : heroId;
}

/** Each spawned enemy gets a look from its uid: a mixed crowd that is identical on every retry. */
export function enemyArtKey(typeId: string, uid: number, has = (key: string) => !!realArt(key)): string {
  const second = keyFor(typeId, SECOND);
  return (Math.imul(uid + 1, 2654435761) >>> 16) & 1 && has(second) ? second : typeId;
}
