"""
Renders assets/images/splash.png — the native splash artwork.

The splash is a single flattened image (glow + mascot + wordmark) because the
native splash screen can only show one static image over a flat colour. The
glow fades to exactly `BG` before the image edge, so the plugin's
`backgroundColor` continues it seamlessly on every screen size.

    python3 scripts/render-splash.py

Requires Pillow. The wordmark uses the app's TikTok Sans SemiBold (600), which
is the project's weight cap; the font is read from node_modules.
"""
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

BG = (11, 9, 16)  # #0B0910 — must match `backgroundColor` in app.json
GLOW = (139, 92, 246)  # brand purple #8B5CF6
W, H = 1000, 1240
CX, CY, RADIUS = W / 2, 560, 600
FONT = 'node_modules/@expo-google-fonts/tiktok-sans/600SemiBold/TikTokSans_600SemiBold.ttf'


def radial_glow() -> Image.Image:
    img = Image.new('RGB', (W, H), BG)
    px = img.load()
    for y in range(H):
        for x in range(W):
            d = math.hypot(x - CX, y - CY) / RADIUS
            if d >= 1:
                continue
            a = (1 - d) ** 1.9 * 0.62
            px[x, y] = tuple(round(BG[i] + (GLOW[i] - BG[i]) * a) for i in range(3))
    return img.filter(ImageFilter.GaussianBlur(6))


def main() -> None:
    canvas = radial_glow().convert('RGBA')

    mascot = Image.open('assets/images/mascot-unlock.png').convert('RGBA')
    mascot = mascot.crop(mascot.getchannel('A').getbbox())
    mw = int(W * 0.52)
    mh = int(mascot.height * mw / mascot.width)
    mascot = mascot.resize((mw, mh), Image.LANCZOS)
    canvas.alpha_composite(mascot, (int(CX - mw / 2), int(CY - mh / 2)))

    font = ImageFont.truetype(FONT, 118)
    draw = ImageDraw.Draw(canvas)
    text = 'Glimpse'
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    ty = int(CY + mh / 2) + 70
    draw.text(((W - tw) / 2 - bbox[0], ty - bbox[1]), text, font=font, fill=(255, 255, 255, 255))

    canvas.convert('RGB').save('assets/images/splash.png', optimize=True)


if __name__ == '__main__':
    main()
