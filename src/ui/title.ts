/** Title screen: hero picker, level select grouped by theme, and "Start new". */
import { HERO_LIST, HEROES, getLevel } from "../engine/content";
import { heroArtEl, portraitEl } from "./cards";
import { glyph, h, replace } from "./dom";
import { openModal } from "./modal";
import { heroLevelsCleared, heroUnlocked, heroUpgrades, levelUnlocked, progress, resetProgress, update } from "./progress";
import { cardText, levelBlurb, THEMES } from "./text";

/** The chosen hero's three upgrades: earned ones checked, the rest showing how many clears they need. */
function upgradeList(heroId: string) {
  const earned = heroUpgrades(heroId);
  const clears = heroLevelsCleared(heroId);
  return h("div", { class: "upgrades" },
    h("h3", null, "Upgrades ", h("small", { class: "muted" }, clears >= 99 ? "(review mode: all upgrades on)" : `(levels cleared with this hero: ${clears})`)),
    h("ul", { class: "upgrades__list" }, HEROES[heroId]!.upgrades.map((u) => {
      const got = earned.includes(u.id);
      return h("li", { class: `upgrade${got ? " is-earned" : ""}` },
        got ? glyph("check") : h("span", { class: "upgrade__need" }, `${u.unlockAfterLevelsClearedWithHero}`),
        h("span", null, h("b", null, `${u.name}: `), u.effect, got ? "" : ` (clear ${u.unlockAfterLevelsClearedWithHero} levels with this hero)`));
    })));
}

export function showTitle(root: HTMLElement, startLevel: (levelId: number) => void) {
  const render = () => {
    const p = progress();
    if (!heroUnlocked(p.heroId)) update((x) => { x.heroId = "H_SWORDSMAN"; });
    const heroId = progress().heroId;
    const heroes = h("div", { class: "hero-grid", role: "radiogroup", "aria-label": "Choose your hero" },
      HERO_LIST.map((hero) => {
        const unlocked = heroUnlocked(hero.id);
        const chosen = hero.id === heroId;
        return h("button", {
          type: "button",
          role: "radio",
          "aria-checked": String(chosen),
          class: `hero-pick${chosen ? " is-chosen" : ""}${unlocked ? "" : " is-locked"}`,
          disabled: !unlocked,
          onclick: () => { update((x) => { x.heroId = hero.id; }); render(); root.querySelector<HTMLElement>(".hero-pick.is-chosen")?.focus(); },
        },
          portraitEl(hero.id, "hero-pick__art"),
          h("span", { class: "hero-pick__name" }, chosen ? glyph("check") : null, hero.name),
          h("span", { class: "hero-pick__stats" }, unlocked
            ? `HP ${hero.baseStats.hp} · Armor ${hero.baseStats.armor} · ${hero.heroAttack.name}`
            : `Locked: clear Level ${hero.unlockAfterLevel}`));
      }));
    const chosen = HEROES[heroId]!;
    const cleared = new Set(p.cleared);
    const levels = THEMES.map((t) => h("section", { class: "theme", style: `--theme-accent:${t.palette.accent};--theme-floor:${t.palette.floor}` },
      h("h3", null, t.name),
      h("p", { class: "theme__summary" }, t.summary),
      h("ol", { class: "level-list" }, t.levels.map((id) => {
        const open = levelUnlocked(id);
        const done = cleared.has(id);
        return h("li", null, h("button", {
          type: "button",
          class: `level-btn${done ? " is-cleared" : ""}${open ? "" : " is-locked"}`,
          disabled: !open,
          "aria-label": `Level ${id}${done ? ", cleared" : open ? "" : ", locked"}. ${levelBlurb(id)}`,
          onclick: () => startLevel(id),
        },
          h("span", { class: "level-btn__num" }, String(id)),
          h("span", { class: "level-btn__text" },
            h("span", { class: "level-btn__title" }, `Level ${id}`, h("small", null, ` · d${getLevel(id).diceSides}`)),
            h("span", { class: "level-btn__blurb" }, levelBlurb(id))),
          h("span", { class: "level-btn__state" }, done ? [glyph("check"), " Cleared"] : open ? "Play" : "Locked")));
      }))));
    replace(root, h("div", { class: "screen title-screen" },
      h("header", { class: "title-hero" },
        h("h1", { class: "logo" }, "If", h("span", { class: "logo__arrow" }, "–"), "Then Dungeon"),
        h("p", { class: "tagline" }, "Program your hero with IF / THEN rules. Escape the dungeon.")),
      h("section", { class: "panel" },
        h("h2", null, "Choose your hero"),
        heroes,
        h("div", { class: "hero-about" },
          heroArtEl(chosen.id, chosen.name),
          h("p", { class: "hero-detail" }, h("b", null, `${chosen.name}: `), `When no rule fires, ${chosen.defaultBehavior.text.charAt(0).toLowerCase()}${chosen.defaultBehavior.text.slice(1)} `, h("br"), h("b", null, "Hero Attack: "), cardText("A_HERO_ATTACK", chosen.id))),
        upgradeList(chosen.id)),
      h("section", { class: "panel" },
        h("div", { class: "levels-head" },
          h("h2", null, "Levels"),
          h("span", { class: "muted" }, `${p.cleared.length} of 24 cleared`)),
        h("div", { class: "themes" }, levels)),
      h("footer", { class: "title-footer" },
        h("button", { type: "button", class: "btn btn--danger", onclick: () => confirmReset() }, "Start new (erase progress)")),
    ));
  };
  const confirmReset = () => openModal({
    title: "Start a new game?",
    body: h("p", null, "This erases every cleared level and unlocked hero on this device."),
    actions: [
      { label: "Erase and start new", onClick: () => { resetProgress(); render(); } },
      { label: "Cancel", primary: true, onClick: () => {} },
    ],
  });
  render();
}
