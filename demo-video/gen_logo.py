#!/usr/bin/env python3
"""Generate BOT Chain Toolkit logo as PNG"""
from PIL import Image, ImageDraw, ImageFont
import os

size = 512
bg = (8, 8, 14)  # dark bg
teal = (0, 212, 170)

img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

# Outer ring
cx, cy = 256, 220
r1, r2 = 100, 110
draw.ellipse([cx-r2, cy-r2, cx+r2, cy+r2], outline=teal, width=6, fill=None)

# Inner dot
draw.ellipse([cx-20, cy-20, cx+20, cy+20], fill=teal)

# Crosshairs
lw = 6
# top
draw.line([cx, cy-r2-30, cx, cy-r2-8], fill=teal, width=lw)
# bottom
draw.line([cx, cy+r2+8, cx, cy+r2+30], fill=teal, width=lw)
# left
draw.line([cx-r2-30, cy, cx-r2-8, cy], fill=teal, width=lw)
# right
draw.line([cx+r2+8, cy, cx+r2+30, cy], fill=teal, width=lw)

# "BOT CHAIN" text
try:
    font_bold = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 36)
    font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 28)
except:
    font_bold = ImageFont.load_default()
    font = ImageFont.load_default()

# "BOT CHAIN" in white
text1 = "BOT CHAIN"
bbox = draw.textbbox((0, 0), text1, font=font_bold)
tw = bbox[2] - bbox[0]
draw.text(((size-tw)//2, 370), text1, fill=(255,255,255), font=font_bold)

# "TOOLKIT" in teal
text2 = "TOOLKIT"
bbox = draw.textbbox((0, 0), text2, font=font_bold)
tw = bbox[2] - bbox[0]
draw.text(((size-tw)//2, 415), text2, fill=teal, font=font_bold)

# Save as high quality PNG
img.save('/home/ubuntu/bot-chain-toolkit/public/toolkit-logo.png', 'PNG')

# Also make a smaller favicon version
favicon = img.resize((256, 256), Image.LANCZOS)
favicon.save('/home/ubuntu/bot-chain-toolkit/public/toolkit-logo-256.png', 'PNG')

print("✓ Logo generated")
print(f"  512px: toolkit-logo.png")
print(f"  256px: toolkit-logo-256.png")
