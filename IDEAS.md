# Ideas (parked)

Ideas worth keeping that aren't scheduled. Each one says why it's parked and
what would have to be true to pick it up.

## Adult art mode

**Idea:** a mature version of the game with photorealistic art, blood and gore.
Same mechanics, levels and rules; only the art changes.

**Why it's feasible:** the game already loads all art by content ID from
`assets/art/<ID>/` (with looks as `<ID>--f`), so a different art set needs no
engine changes.

**How to do it if we do:** ship it as a **separate build** (its own site or
app listing with its own age rating), not as a hidden switch in this game:

- The testers and audience for this game are 10–15. Hidden switches get found,
  especially by testers.
- App stores rate an app on everything it contains, including locked or hidden
  content. Mature art inside this build would push the whole game to 17+/M, or
  get it removed for undeclared content (the GTA "Hot Coffee" case).
- The public demo would expose the art files to anyone who looks.
- Practically: a build flag that picks the art folder (e.g. `assets/art-mature/`)
  at build time, so the kids' build never contains those files.

**Open questions:** art source (Flow and similar tools are likely to refuse
photorealistic gore); whether mature mode also changes text or sound.
