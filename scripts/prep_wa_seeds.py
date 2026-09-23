from PIL import Image
from pathlib import Path
import shutil, json

base = Path(r'C:\Users\ADMIN\XiaomiMiMoProjects\MingleKe\wa-extract')
out = Path(r'C:\Users\ADMIN\XiaomiMiMoProjects\MingleKe\public\seed\wa')
if out.exists():
    shutil.rmtree(out)
out.mkdir(parents=True)

def phash(path):
    im = Image.open(path).convert('L').resize((16, 16), Image.Resampling.LANCZOS)
    px = list(im.getdata())
    avg = sum(px) / len(px)
    return ''.join('1' if p >= avg else '0' for p in px)

items = []
for pack in ['pack1', 'pack2']:
    for p in sorted((base / pack).glob('*.jpeg')):
        im = Image.open(p)
        im.load()
        items.append({
            'path': p,
            'pack': pack,
            'bytes': p.stat().st_size,
            'w': im.width,
            'h': im.height,
            'hash': phash(p),
        })

items.sort(key=lambda x: (-x['bytes'], -x['w'] * x['h']))
kept = []
for it in items:
    dup = False
    for k in kept:
        ham = sum(a != b for a, b in zip(it['hash'], k['hash']))
        if ham <= 6:
            dup = True
            break
    if not dup:
        kept.append(it)

print('total', len(items), 'unique', len(kept))

manifest = []
for i, it in enumerate(kept, 1):
    im = Image.open(it['path']).convert('RGB')
    if im.width < 640:
        scale = 640 / im.width
        im = im.resize((int(im.width * scale), int(im.height * scale)), Image.Resampling.LANCZOS)
    name = f'p{i:02d}.jpg'
    dest = out / name
    im.save(dest, 'JPEG', quality=94, subsampling=0, optimize=True)
    manifest.append({
        'file': f'/seed/wa/{name}',
        'w': im.width,
        'h': im.height,
        'bytes': dest.stat().st_size,
        'src': it['path'].name,
        'pack': it['pack'],
    })
    print(f"{name:8s} {im.width:4d}x{im.height:<4d} {dest.stat().st_size // 1024:4d}KB  {it['pack']}")

(out / 'manifest.json').write_text(json.dumps(manifest, indent=2))
print('done', len(manifest))
