"""Generate the dot-grid logo, banner and publication thumbnails.

Run from the repo root after adding papers:  python3 scripts/make_art.py images
"""
import math, random, sys, os, re, zlib
out = sys.argv[1]

# ---- logo: "cw" on a 10x5 grid of cells ----
C = [".###", "#...", "#...", "#...", ".###"]
W = ["#...#", "#...#", "#.#.#", "#.#.#", ".#.#."]
rows = [c + "." + w for c, w in zip(C, W)]
maroon = ["#8c2a36", "#a5505b", "#c17d85"]   # dark -> light, ordered (not random)
blue = ["#4d719a", "#6d8fb5", "#94b0cf"]
s, r = 10, 4.2
cells = []
for y, row in enumerate(rows):
    for x, ch in enumerate(row):
        cx, cy = x * s + s / 2, y * s + s / 2
        if ch == "#":
            lx = x if x < 4 else x - 5                      # letter-local column
            t = (lx + y) / (7 if x < 4 else 8)              # 0 top-left -> 1 bottom-right
            col = (maroon if x < 4 else blue)[min(2, int(t * 3))]
            cells.append(f'<circle class="d" cx="{cx}" cy="{cy}" r="{r}" fill="{col}"/>')
        else:
            cells.append(f'<circle class="g" cx="{cx}" cy="{cy}" r="1.5" fill="#e6e0dc"/>')
vb = f'0 0 {len(rows[0])*s} {len(rows)*s}'
svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" role="img" aria-label="CWan Lab">' + "".join(cells) + "</svg>"
open(os.path.join(out, "logo-cw.svg"), "w").write(svg)
# Inline copy for the page header: a faint static "ghost" of the letters plus the live
# cells, which burst outward on hover and spring back (see assets/js/site.js).
ghost = "".join(c.replace('class="d"', 'class="ghost"') for c in cells if 'class="d"' in c)
inline = (f'<svg class="logo-cw" viewBox="{vb}" overflow="visible" aria-hidden="true">'
          + "".join(c for c in cells if 'class="g"' in c)
          + f'<g opacity=".16">{ghost}</g>'
          + "".join(c for c in cells if 'class="d"' in c) + "</svg>\n")
open(os.path.join(out, "..", "_includes", "logo-cw.svg"), "w").write(inline)

# ---- banner: wide pastel spatial-cell field ----
def field(w, h, centers, n, seed, cols, edge=40, stroke="#b3aaa5", m=14, accents=(), grid=10, sigma=None):
    rnd = random.Random(seed)
    sigma = sigma or min(w, h) / 5
    pts = []
    for cx, cy, ci in centers:
        for _ in range(n):
            rr = abs(rnd.gauss(0, sigma)); a = rnd.random() * 6.283
            x, y = cx + rr * math.cos(a), cy + rr * math.sin(a)
            if m < x < w - m and m < y < h - m:
                pts.append((x, y, ci if rnd.random() < .82 or not accents else rnd.choice(accents)))
    lines = []
    for i, (x, y, _) in enumerate(pts):
        for d, j in sorted((math.hypot(x - u, y - v), j) for j, (u, v, _) in enumerate(pts) if j != i)[:2]:
            if d < edge and i < j:
                lines.append(f'<line x1="{x:.1f}" y1="{y:.1f}" x2="{pts[j][0]:.1f}" y2="{pts[j][1]:.1f}"/>')
    dots = [f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{rnd.choice([2.5,3.5,3.5,4.5,5.5,7])}" fill="{cols[c]}" fill-opacity="{rnd.choice([.7,.85,1])}"/>' for x, y, c in pts]
    lattice = "".join(f'<circle cx="{gx}" cy="{gy}" r=".9"/>' for gx in range(grid // 2, w, grid) for gy in range(grid // 2, h, grid))
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">'
            f'<g fill="#ebe6e2">{lattice}</g>'
            f'<g stroke="{stroke}" stroke-opacity=".35" stroke-width="1" stroke-linecap="round">' + "".join(lines) + "</g>" + "".join(dots) + "</svg>")

# rose | blue | sage niches left->right = the three theme columns under the banner; sand/lilac only as stray accents
pastel = ["#ecbfc3", "#b2d0ed", "#add7c4", "#e2c7a8", "#d8c3e5"]
centers = [(70, 150, 0), (190, 80, 0), (300, 160, 0), (440, 90, 1), (540, 170, 1), (640, 80, 1), (770, 150, 2), (870, 70, 2), (950, 170, 2)]
open(os.path.join(out, "banner-cells.svg"), "w").write(field(1000, 232, centers, 22, 11, pastel, sigma=40, accents=(3, 4)))

# ---- theme thumbnails (one per publication group) ----
themes = {
    "aim":      (["#ecbfc3", "#d29aa1", "#e2c7a8"], 21),
    "graph":    (["#b2d0ed", "#8aafd4", "#d8c3e5"], 22),
    "clinical": (["#add7c4", "#86bba2", "#e2c7a8"], 23),
}
layouts = [[(40, 40, 0), (110, 50, 1), (80, 100, 2)],
           [(30, 85, 0), (85, 35, 1), (130, 90, 2)],
           [(80, 60, 0), (35, 30, 1), (125, 95, 2)]]
for name, (cols, seed) in themes.items():
    for k, ctr in enumerate(layouts):
        open(os.path.join(out, f"thumb-{name}-{k}.svg"), "w").write(field(160, 120, ctr, 18, seed + 10 * k, cols, edge=26, m=8, grid=8))

# ---- one thumbnail per paper (pub.html: p.title | slugify | truncate: 40, "") ----
src = open(os.path.join(out, "..", "_data", "publications.yml")).read()
os.makedirs(os.path.join(out, "thumbs"), exist_ok=True)
for grp, title in re.findall(r'-\s*group:\s*(\w+).*?\n\s*title:\s*"(.*?)"', src, re.S):
    slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")[:40]
    cols, _ = themes[grp]; pr = random.Random(zlib.crc32(slug.encode()))
    ctr = [(pr.uniform(30, 130), pr.uniform(25, 95), i) for i in range(3)]
    open(os.path.join(out, "thumbs", slug + ".svg"), "w").write(field(160, 120, ctr, 18, zlib.crc32(slug.encode()), cols, edge=26, m=8, grid=8))
print("ok")
