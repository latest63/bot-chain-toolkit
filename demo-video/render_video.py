#!/usr/bin/env python3
"""
BOT Chain Toolkit — Demo Video Generator
Captures each scene HTML via Playwright, renders with Ken Burns zoom,
and stitches with crossfade transitions via FFmpeg.
"""

import subprocess, json, os, sys, time
from pathlib import Path

SCENES = [
    {"file": "scene-1-invitation.html",     "duration": 8.0, "label": "The Invitation"},
    {"file": "scene-2-batch-splitter.html", "duration": 10.0, "label": "Batch Splitter"},
    {"file": "scene-3-raffle.html",         "duration": 12.0, "label": "Raffle System"},
    {"file": "scene-4-cta.html",            "duration": 10.0, "label": "Call to Action"},
]

HERE = Path(__file__).parent
OUTPUT = HERE / "output"
SCREENSHOTS_DIR = OUTPUT / "screenshots"
OUTPUT.mkdir(exist_ok=True)
SCREENSHOTS_DIR.mkdir(exist_ok=True)

def run(cmd, timeout=120, **kw):
    """Run a command and return result."""
    print(f"  $ {' '.join(str(c) for c in cmd[:8])}...")
    return subprocess.run(cmd, capture_output=True, text=True, timeout=timeout, **kw)

def main():
    print("=== BOT Chain Toolkit Demo Video Generator ===\n")

    # ---- Step 1: Capture screenshots via Playwright ----
    print("Step 1: Capturing scene screenshots...")
    
    scenes_json = json.dumps([{"file": s["file"], "path": str(HERE / s["file"])} for s in SCENES])
    out_dir = str(SCREENSHOTS_DIR)
    
    js_code = f"""
const {{ chromium }} = require('playwright');
const path = require('path');

const scenes = {scenes_json};
const outDir = {json.dumps(out_dir)};

(async () => {{
    const browser = await chromium.launch({{ headless: true, args: ['--no-sandbox'] }});
    const context = await browser.newContext({{
        viewport: {{ width: 1920, height: 1080 }},
        deviceScaleFactor: 2,
    }});
    
    for (const scene of scenes) {{
        const page = await context.newPage();
        await page.goto('file://' + scene.path, {{ waitUntil: 'networkidle', timeout: 30000 }});
        await page.waitForTimeout(2500);
        const outPath = path.join(outDir, scene.file.replace('.html', '.png'));
        await page.screenshot({{ path: outPath, fullPage: false }});
        console.log('OK ' + scene.file.replace('.html', '.png'));
        await page.close();
    }}
    
    await browser.close();
    console.log('DONE');
}})().catch(e => {{ console.error(e); process.exit(1); }});
"""
    js_path = OUTPUT / "_capture.cjs"
    js_path.write_text(js_code)
    
    result = run(["node", str(js_path)], timeout=60)
    if result.returncode != 0:
        print("CAPTURE FAILED:", result.stderr)
        sys.exit(1)
    for line in result.stdout.strip().split("\n"):
        if line.startswith("OK "):
            print(f"  ✓ {line[3:]}")
    
    # ---- Step 2: Render each scene as a video clip with Ken Burns zoom ----
    print("\nStep 2: Rendering scene videos with Ken Burns effect...")
    
    clip_paths = []
    for i, scene in enumerate(SCENES):
        img = SCREENSHOTS_DIR / scene["file"].replace(".html", ".png")
        if not img.exists():
            print(f"  ✗ Screenshot missing: {img}")
            continue
        
        dur = scene["duration"]
        fps = 30
        nframes = int(dur * fps)
        out = OUTPUT / f"_clip_{i}.mp4"
        clip_paths.append(str(out))
        
        # Slight constant zoom (1.02x) — Ken Burns style
        # x stays centered on the image center
        pan_x = "iw/2-(iw/zoom/2)"
        
        cmd = [
            "ffmpeg", "-y",
            "-loop", "1",
            "-i", str(img),
            "-vf",
            f"zoompan=z=1.02:x={pan_x}:d={nframes}:fps={fps}",
            "-c:v", "libx264",
            "-pix_fmt", "yuv420p",
            "-preset", "fast",
            "-crf", "20",
            "-t", str(dur),
            "-an",
            str(out)
        ]
        
        r = run(cmd, timeout=60)
        if r.returncode != 0:
            print(f"  ✗ Scene {i+1} render error: {r.stderr[-200:]}")
        else:
            sz = out.stat().st_size
            print(f"  ✓ Scene {i+1} ({scene['label']}): {sz/1024:.0f} KB")
    
    # ---- Step 3: Stitch with crossfade transitions ----
    print("\nStep 3: Stitching with crossfade transitions...")
    
    t_dur = 1.0  # transition duration in seconds
    total_dur = sum(s["duration"] for s in SCENES)
    
    # Build offset list: where each xfade starts
    offsets = []
    cum = 0.0
    for i in range(len(SCENES) - 1):
        cum += SCENES[i]["duration"]
        offsets.append(cum - t_dur)
    
    # Crossfade using chained xfade filter
    prev = "0"
    filters = []
    for i in range(1, len(clip_paths)):
        label = f"v{i}"
        filters.append(
            f"[{prev}][{i}]xfade=transition=fade:duration={t_dur}:offset={offsets[i-1]}[{label}]"
        )
        prev = label
    
    filter_str = ";".join(filters)
    last_label = f"v{len(clip_paths)-1}"
    
    final = OUTPUT / "bot-chain-toolkit-demo.mp4"
    
    if len(clip_paths) > 1:
        inputs = []
        for cp in clip_paths:
            inputs.extend(["-i", cp])
        
        cmd = ["ffmpeg", "-y"] + inputs + [
            "-filter_complex", filter_str,
            "-map", f"[{last_label}]",
            "-c:v", "libx264",
            "-pix_fmt", "yuv420p",
            "-preset", "medium",
            "-crf", "18",
            str(final)
        ]
        
        r = run(cmd, timeout=180)
        if r.returncode != 0:
            print(f"  ✗ Crossfade failed, trying direct concat...")
            concat_txt = OUTPUT / "_concat.txt"
            with open(concat_txt, "w") as f:
                for cp in clip_paths:
                    f.write(f"file '{cp}'\n")
            r2 = run([
                "ffmpeg", "-y", "-f", "concat", "-safe", "0",
                "-i", str(concat_txt), "-c", "copy", str(final)
            ], timeout=60)
            if r2.returncode == 0:
                print(f"  ✓ Direct concatenation: {final.stat().st_size/1024:.0f} KB")
    else:
        # Single clip, just copy
        import shutil
        shutil.copy(clip_paths[0], final)
    
    # ---- Step 4: Cleanup ----
    print("\nStep 4: Cleanup...")
    for cp in clip_paths:
        Path(cp).unlink(missing_ok=True)
    for f in ["_capture.cjs", "_concat.txt"]:
        (OUTPUT / f).unlink(missing_ok=True)
    
    out_path = OUTPUT / "bot-chain-toolkit-demo.mp4"
    if out_path.exists() and out_path.stat().st_size > 1024:
        sz = out_path.stat().st_size / 1024
        print(f"\n✓ Video ready: {out_path}")
        print(f"  Size: {sz:.0f} KB")
        print(f"  Duration: {total_dur:.0f}s")
    else:
        print("\n✗ Video generation failed")
        sys.exit(1)

if __name__ == "__main__":
    main()
