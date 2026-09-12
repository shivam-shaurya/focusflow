"""Generate every app icon from one vector-ish description.

The mark is the focus ring from the timer: an open teal ring with a solid
centre, which reads at 16px and survives a circular maskable crop.
Run: python scripts/make-icons.py
"""
from PIL import Image, ImageDraw

TEAL = (13, 148, 136, 255)       # --color-primary (light)
TEAL_BRIGHT = (45, 212, 191, 255)  # --color-primary (dark)
INK = (11, 18, 17, 255)          # --color-bg (dark)
WHITE = (255, 255, 255, 255)


def rounded_bg(size, radius_ratio, color):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    r = int(size * radius_ratio)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=r, fill=color)
    return img


def draw_mark(img, scale):
    """Open ring with a 3/4 sweep plus a solid core, centred."""
    size = img.width
    d = ImageDraw.Draw(img)
    c = size / 2
    r = size * scale / 2
    w = max(2, int(size * 0.075))

    # Track: full faint ring.
    d.ellipse([c - r, c - r, c + r, c + r], outline=(255, 255, 255, 60), width=w)
    # Progress: 3/4 sweep starting at 12 o'clock.
    d.arc([c - r, c - r, c + r, c + r], start=-90, end=180, fill=WHITE, width=w)
    # Core.
    cr = r * 0.34
    d.ellipse([c - cr, c - cr, c + cr, c + cr], fill=WHITE)
    return img


def icon(size, *, maskable=False, bg=TEAL):
    if maskable:
        # Full bleed, mark inside the 80% safe zone.
        img = Image.new("RGBA", (size, size), bg)
        return draw_mark(img, 0.52)
    img = rounded_bg(size, 0.22, bg)
    return draw_mark(img, 0.62)


def main():
    out = "public/icons"
    icon(192).save(f"{out}/icon-192.png")
    icon(512).save(f"{out}/icon-512.png")
    icon(192, maskable=True).save(f"{out}/maskable-192.png")
    icon(512, maskable=True).save(f"{out}/maskable-512.png")
    # iOS home-screen icon: no transparency, no rounding (iOS masks it itself).
    ios = Image.new("RGBA", (180, 180), TEAL)
    draw_mark(ios, 0.62).save(f"{out}/apple-touch-icon.png")
    # Tauri wants one large square source.
    icon(1024).save(f"{out}/icon-1024.png")
    # Favicon: brighter teal so it reads on a dark browser chrome.
    favicon = icon(256, bg=INK)
    draw_mark(favicon, 0.62)
    frames = [favicon.resize((s, s), Image.LANCZOS) for s in (16, 32, 48)]
    frames[0].save("public/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
    favicon.resize((32, 32), Image.LANCZOS).save(f"{out}/favicon-32.png")
    print("wrote icons to", out)


if __name__ == "__main__":
    main()
