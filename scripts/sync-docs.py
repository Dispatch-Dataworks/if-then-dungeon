#!/usr/bin/env python3
"""Regenerates the numbers in the design docs and character sheets from the JSON files after a balance pass."""
import json, re, glob, os
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
L = json.load(open('levels.json')); E = json.load(open('enemies.json')); H = json.load(open('heroes.json'))
traps = L['content']['traps']; costs = L['enemies']['spawnCostsBase']
en = {e['id']: e for e in E['enemies']}
def sub(path, pattern, repl, count=1, flags=re.M):
    s = open(path).read(); n = re.subn(pattern, repl, s, count=count, flags=flags)
    if n[1] == 0: print('NO MATCH', path, pattern)
    open(path, 'w').write(n[0])
step = {k: v['damage'] for k, v in traps.items() if 'damage' in v}
for f in glob.glob('characters/T_*.md'):
    tid = re.search(r'`(T_[A-Z_]+)`', open(f).read()).group(1)
    if tid in step: sub(f, r'^- \*\*\d+ damage', f'- **{step[tid]} damage')
for tid, d in step.items():
    sub('07-traps-and-board-mechanics.md', rf'(### {tid}\n(?:- .*\n)*?- Effect: (?:deal )?)\d+( damage)', rf'\g<1>{d}\2', flags=0)
for f in glob.glob('characters/E_*.md'):
    eid = re.search(r'`(E_[A-Z_]+)`', open(f).read()).group(1); e = en[eid]
    sub(f, r'^- \*\*Danger:\*\*.*$', f"- **Danger:** {e['dangerSkulls']} skull(s) · **Spawn cost:** {costs[eid]} Pressure (base, before modifiers)")
    sub(f, r'^- \*\*Stats:\*\*.*$', f"- **Stats:** HP {e['hp']}, armor {e['armor']}, damage {e['damage']}, attack range {e['attackRange']}, speed {e['speedTiles']} (see `enemies.json`)")
for eid, c in costs.items():
    sub('04-threat-pressure-spawn.md', rf'^- {en[eid]["name"]}: \d+$', f'- {en[eid]["name"]}: {c}')
used = {}
for lv in L['levels']:
    for o in lv['obstacles']: used.setdefault(o, []).append(lv['levelId'])
for f in glob.glob('characters/O_*.md'):
    oid = re.search(r'`(O_[A-Z_]+)`', open(f).read()).group(1)
    sub(f, r'^\| Used in levels \|.*\|$', f"| Used in levels | {', '.join(map(str, used.get(oid, [])))} |")
for h in H['heroes']:
    f = glob.glob(f"characters/{h['id']}-*.md")[0]; st = h['baseStats']
    for label, val in (('HP', st['hp']), ('Armor', st['armor']), ('Speed tiles per move action', st['speedTiles']), ('Sight range', st['sightRange'])):
        sub(f, rf'^- {label}: \*\*\d+\*\*$', f'- {label}: **{val}**')
print('synced')
