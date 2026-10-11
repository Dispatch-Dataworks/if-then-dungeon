import { heroUnlocked, progress } from "./ui/progress";
import { LevelScreen } from "./ui/level";
import { showTitle } from "./ui/title";
import "./ui/styles.css";

const root = document.querySelector<HTMLDivElement>("#app")!;

function toTitle() {
  showTitle(root, toLevel);
  window.scrollTo(0, 0);
}

function toLevel(levelId: number) {
  document.querySelectorAll("dialog").forEach((d) => d.remove());
  const heroId = heroUnlocked(progress().heroId) ? progress().heroId : "H_SWORDSMAN";
  new LevelScreen(root, levelId, heroId, { toTitle, toLevel });
  window.scrollTo(0, 0);
}

toTitle();
