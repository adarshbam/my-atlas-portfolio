"""Create the numeral face without changing outlines, metrics or font family.

Build-time maintenance only; no application dependency. Install fonttools and
brotli into tmp/fonttools or the active Python environment before running.
"""
from pathlib import Path
import json
import sys

root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(root / "tmp/fonttools"))
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.pens.recordingPen import RecordingPen

source = root / "public/fonts/cormorant-garamond-latin-300-normal.woff2"
target = root / "public/fonts/cormorant-garamond-numerals-300.woff2"
options = subset.Options()
options.flavor = "woff2"
font = subset.load_font(str(source), options)
subsetter = subset.Subsetter(options=options)
subsetter.populate(unicodes=range(ord("0"), ord("9") + 1))
subsetter.subset(font)
subset.save_font(font, str(target), options)

original, reduced = TTFont(source), TTFont(target)
for code in range(ord("0"), ord("9") + 1):
    outlines, widths = [], []
    for face in [original, reduced]:
        name = face.getBestCmap()[code]
        pen = RecordingPen()
        face.getGlyphSet()[name].draw(pen)
        outlines.append(pen.value)
        widths.append(face["hmtx"][name])
    assert outlines[0] == outlines[1], f"Outline changed: {chr(code)}"
    assert widths[0] == widths[1], f"Metrics changed: {chr(code)}"
report = {"sourceBytes": source.stat().st_size, "subsetBytes": target.stat().st_size,
          "verifiedGlyphs": "0123456789", "outlinesAndMetricsUnchanged": True}
print(json.dumps(report, indent=2))
