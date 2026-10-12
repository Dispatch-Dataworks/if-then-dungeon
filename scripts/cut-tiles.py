# Cut board-tile art out of the trap / obstacle / mechanic concept sheets and key out the white background.
# Usage: python3 scripts/cut-tiles.py <dir with original sheet PNGs from Drive> <out dir>
# Each entry is (sheet file, crop box in sheet pixels) for the state shown on the board.
import sys,numpy as np
from PIL import Image
from collections import deque
src,out=sys.argv[1:3]
T={'T_SPIKES':('spikes_retracted-and-raised_final',(761,231,1484,635)),
'T_PIT':('pit-trap_closed-open',(808,405,1400,748)),
'T_POISON_FOG':('poison-fog_idle-subtle_final',(782,144,1327,447)),
'T_SMOKE_VENTS':('smoke-vents_extended-sheet',(414,143,758,388)),
'T_BONE_SPIKES':('bone-spikes',(74,165,530,420)),
'T_CURSE_SIGIL':('curse-sigil',(758,167,1490,739)),
'T_WHISPER_TILES':('whisper-tiles',(790,203,1510,671)),
'T_BLEED_VINES':('bleed-vines',(784,293,1471,680)),
'T_SNARE_ROOTS':('snare-roots',(781,241,1494,626)),
'T_ILLUSION_WALL':('illusion-wall',(1017,243,1481,669)),
'O_LAVA_FLOW':('lava-flow_trap_final-higher-detail',(820,363,1374,763)),
'M_TIMED_VENTS':('timed-vents_final-no-arrows',(116,206,716,652)),
'M_CONVEYOR':('conveyor_final-no-arrows',(103,302,719,645)),
'M_TIMED_VENTS--on':('timed-vents_final-no-arrows',(818,206,1464,652))}
for id_,(f,(x0,y0,x1,y1)) in T.items():
    pad=10
    im=Image.open(f'{src}/{f}.png').convert('RGB')
    big=Image.new('RGB',(im.width+2*pad,im.height+2*pad),(255,255,255)); big.paste(im,(pad,pad))
    a=np.asarray(big.crop((x0,y0,x1+2*pad,y1+2*pad))).astype(float)
    h,w,_=a.shape
    # background = near-white region connected to the border
    light=a.min(2)>170
    bg=np.zeros((h,w),bool); q=deque()
    for x in range(w): q.extend([(0,x),(h-1,x)])
    for y in range(h): q.extend([(y,0),(y,w-1)])
    while q:
        y,x=q.popleft()
        if bg[y,x] or not light[y,x]: continue
        bg[y,x]=True
        if y>0: q.append((y-1,x))
        if y<h-1: q.append((y+1,x))
        if x>0: q.append((y,x-1))
        if x<w-1: q.append((y,x+1))
    # color-to-alpha against white inside the background region; opaque elsewhere
    alpha=np.ones((h,w))
    ca=(255-a).max(2)/255.0
    alpha[bg]=ca[bg]
    rgb=a.copy()
    safe=np.maximum(alpha,1e-3)[...,None]
    rgb[bg]=((a-255*(1-safe))/safe)[bg]
    if id_ in ('T_SMOKE_VENTS','M_TIMED_VENTS--on'):
        # white smoke would vanish when keyed against white: keep original colours, fade alpha smoothly
        from PIL import ImageFilter
        soft=np.asarray(Image.fromarray((ca*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2))).astype(float)/255
        alpha[bg]=np.clip((soft[bg]-0.04)*4.5,0,1)
        rgb[bg]=a[bg]
    rgba=np.dstack([np.clip(rgb,0,255),alpha*255]).astype(np.uint8)
    img=Image.fromarray(rgba,'RGBA')
    bbox=img.getchannel('A').point(lambda v:255 if v>8 else 0).getbbox(); img=img.crop(bbox)
    s=256/max(img.size); img=img.resize((max(1,round(img.width*s)),max(1,round(img.height*s))),Image.LANCZOS)
    img.save(f'{out}/{id_}.webp','WEBP',quality=88,method=6)
    print(id_,img.size)
