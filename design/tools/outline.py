import sys, json
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

font = TTFont(sys.argv[1])
text = sys.argv[2]
size = float(sys.argv[3])
gs = font.getGlyphSet()
cmap = font.getBestCmap()
upm = font["head"].unitsPerEm
scale = size / upm
asc = font["hhea"].ascent
x = 0.0
paths = []
for ch in text:
    name = cmap[ord(ch)]
    pen = SVGPathPen(gs)
    # flip y, put baseline at ascender*scale
    tp = TransformPen(pen, (scale, 0, 0, -scale, x, asc * scale))
    gs[name].draw(tp)
    paths.append(pen.getCommands())
    x += gs[name].width * scale
print(json.dumps({"d": " ".join(paths), "width": round(x, 1), "baseline": round(asc * scale, 1), "height": round((asc - font["hhea"].descent) * scale, 1)}))
