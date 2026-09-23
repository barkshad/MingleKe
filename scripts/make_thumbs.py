from PIL import Image
from pathlib import Path

src = Path(r'C:\Users\ADMIN\XiaomiMiMoProjects\MingleKe\public\seed\wa')
thumbs = Path(r'C:\Users\ADMIN\XiaomiMiMoProjects\MingleKe\public\seed\thumbs')
thumbs.mkdir(parents=True, exist_ok=True)

for p in sorted(src.glob('p*.jpg')):
    im = Image.open(p).convert('RGB')
    # 180px wide thumbs for rails / lists on slow links
    w = 180
    h = int(im.height * (w / im.width))
    im.resize((w, h), Image.Resampling.LANCZOS).save(thumbs / p.name, 'JPEG', quality=70, optimize=True)

print('thumbs', len(list(thumbs.glob('p*.jpg'))))
