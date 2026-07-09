#!/usr/bin/env python3
"""Render the nav SVG icon as a high-quality PNG"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math, os

size = 512
pad = 40
inner = size - pad * 2
cx = cy = size // 2
r = inner // 2 - 4
stroke = 10
teal = (0, 212, 170)

img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

# Outer circle
draw.ellipse([cx-r, cy-r, cx+r, cy+r], outline=teal, width=stroke)

# Inner dot
dot_r = r // 4  # ~22
draw.ellipse([cx-dot_r, cy-dot_r, cx+dot_r, cy+dot_r], fill=teal)

# Crosshairs (the 4 lines extending out)
lh = r + 18  # length from center
for dx, dy in [(0, -1), (0, 1), (-1, 0), (1, 0)]:
    x1 = cx + dx * r
    y1 = cy + dy * r
    x2 = cx + dx * int(r * 1.35)
    y2 = cy + dy * int(r * 1.35)
    draw.line([x1, y1, x2, y2], fill=teal, width=stroke)

img.save('/home/ubuntu/bot-chain-toolkit/public/toolkit-nav-icon.png', 'PNG')
img.resize((256, 256), Image.Resampling.LANCZOS).save('/home/ubuntu/bot-chain-toolkit/public/toolkit-nav-icon-256.png', 'PNG')
print("✓ Nav icon rendered")
