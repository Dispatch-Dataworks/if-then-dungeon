#!/usr/bin/env python3
"""Adds core-card top-ups to each level's deck so Hero Attack, Move Forward, turns and basic sensors keep a
steady share as new cards are introduced. Idempotent: re-run after changing deck adjustments."""
import json, os

os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

# JSON writer matching the repo style: short objects and scalar lists inline, level maps one row per line.
def fmt(o, ind=0, key=None):
    pad = '  ' * ind
    s = json.dumps(o, ensure_ascii=False)
    if key == 'map':
        return '[\n' + ',\n'.join(pad + '  ' + json.dumps(r) for r in o) + '\n' + pad + ']'
    scalars = lambda v: all(not isinstance(x, (dict, list)) for x in v)
    if isinstance(o, list) and scalars(o):
        return s
    if ind >= 2 and len(s) <= 220 and 'map' not in s:
        return s
    if isinstance(o, list):
        return '[\n' + ',\n'.join(pad + '  ' + fmt(x, ind + 1) for x in o) + '\n' + pad + ']'
    if isinstance(o, dict):
        return '{\n' + ',\n'.join(pad + '  ' + json.dumps(k) + ': ' + fmt(v, ind + 1, k) for k, v in o.items()) + '\n' + pad + '}'
    return s

def save(path, obj):
    open(path, 'w').write(fmt(obj) + '\n')


import math
p='levels.json'
L=json.load(open(p))
TARGET={"A_HERO_ATTACK":0.10,"A_MOVE_FWD":0.10,"A_TURN_L":0.06,"A_TURN_R":0.06,"S_WALL_AHEAD":0.07,"S_ENEMY_AHEAD":0.05,"S_ENEMY_ADJACENT":0.05}
decks={}
for lv in L['levels']:
    d=lv['deck']
    base=dict((c['id'],c['count']) for c in L['decks'][d['baseDeckId']]['cards']) if 'baseDeckId' in d else dict(decks[d['fromPrevLevel']])
    # drop previous top-ups (idempotent re-run): adjustments tagged "topUp"
    d['adjustments']=[a for a in d['adjustments'] if not a.get('topUp')]
    for a in d['adjustments']: base[a['id']]=base.get(a['id'],0)+a.get('add',0)-a.get('remove',0)
    tops=[]
    if lv['levelId']>1:
        for _ in range(3):  # iterate since adding cards changes the total
            total=sum(base.values())
            for cid,share in TARGET.items():
                need=math.ceil(share*total)-base.get(cid,0)
                if need>0:
                    base[cid]=base.get(cid,0)+need
                    ex=next((t for t in tops if t['id']==cid),None)
                    if ex: ex['add']+=need
                    else: tops.append({"id":cid,"add":need,"topUp":True})
    d['adjustments']+=tops
    decks[lv['levelId']]=base
save(p,L)
print({k:sum(v.values()) for k,v in decks.items()})
