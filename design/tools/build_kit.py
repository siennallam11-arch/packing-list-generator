import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from doodles import DOODLES, LABELS, standalone, sprite

OUT = sys.argv[1]; LOGO = json.load(open(sys.argv[2]))
P = lambda *p: os.path.join(OUT, "project", *p)
def write(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    open(path, "w").write(text)

# ── Tokens ─────────────────────────────────────────────
C = [  # name, light, dark, usage
 ("paper", "#ffffff", "#1b1819", "Page and card background. Everything sits on paper."),
 ("paper-raised", "#faf7f6", "#252122", "Quiz cards, the calendar, sheets and the shared-items panel: anything that sits on top of paper."),
 ("ink", "#222020", "#f2eded", "Text, doodle outlines, checkbox outlines, filled buttons. On paper and paper-raised."),
 ("ink-soft", "#6b6466", "#aba2a4", "Secondary text: dates, quantities, counts, captions. On paper and paper-raised."),
 ("on-ink", "#ffffff", "#1b1819", "Text on an ink-filled button."),
 ("rule", "#eeeaea", "#383234", "Hairline dividers between categories and list sections."),
 ("leader", "#a79ea0", "#6e6567", "The dotted line between an item and its quantity, and the dotted rule beside each city. Decorative only."),
 ("matcha", "#86b05c", "#9cc474", "Progress-bar fill and other packed/done fills. Never text."),
 ("matcha-ink", "#4f7f3c", "#a9d182", "Tick marks and the heading of a fully packed category. On paper."),
 ("hojicha", "#a8774f", "#c9966d", "Warm accent for activity gear and the hojicha cover. Fills and marks only."),
 ("strawberry", "#e77681", "#f0919a", "Brand accent: selected states, the claimed badge, highlights. Fills and marks only."),
 ("pen", "#c04a5a", "#f29ba6", "Handwritten notes and weather blurbs, set in hand-note. On paper and paper-raised."),
 ("selected", "#fbe6e8", "#3d2a2d", "Background of a selected quiz option or calendar range."),
 ("cover-strawberry", "#f09aa3", "#c96b76", "Painted trip cover, strawberry (the default)."),
 ("cover-matcha", "#a9c98a", "#6e9150", "Painted trip cover, matcha."),
 ("cover-hojicha", "#c9a286", "#8e6a50", "Painted trip cover, hojicha."),
 ("fill-pink", "#f6c4ca", "#f6c4ca", "Doodle fill: documents, suitcase. Same in both themes."),
 ("fill-green", "#bfd9a6", "#bfd9a6", "Doodle fill: clothes, people. Same in both themes."),
 ("fill-blue", "#cfe3f3", "#cfe3f3", "Doodle fill: toiletries, water, rain. Same in both themes."),
 ("fill-butter", "#f5d58a", "#f5d58a", "Doodle fill: tech, sun. Same in both themes."),
 ("fill-tan", "#d9b79c", "#d9b79c", "Doodle fill: activity gear. Same in both themes."),
 ("focus", "#222020", "#f2eded", "Keyboard focus ring: solid 2px, 2px offset. At least 3:1 on paper and every cover."),
]
HAND = '"Gaegu", "Comic Sans MS", cursive'
TYPE = '"Courier Prime", "Courier New", ui-monospace, monospace'
tokens = {
 "name": "Caboodle", "version": 1,
 "color": {"themes": [{"id": "light", "name": "Light"}, {"id": "dark", "name": "Dark"}],
   "tokens": [{"name": n, "value": {"light": l, "dark": d}, "usage": u} for n, l, d, u in C]},
 "type": {"fonts": [],
   "families": {"hand": HAND, "type": TYPE},
   "groups": [
     {"name": "Handwriting", "family": "hand", "styles": [
       {"name": "hand-display", "fontSize": "44px", "lineHeight": 0.95, "fontWeight": 700, "sample": "tokyo + kyoto", "usage": "Trip title on the trip page, lowercase."},
       {"name": "hand-heading", "fontSize": "23px", "lineHeight": 1, "fontWeight": 700, "sample": "The clothes", "usage": "Category headings, quiz questions, section titles. Sentence case, starts with \"The\" for categories."},
       {"name": "hand-city", "fontSize": "20px", "lineHeight": 1, "fontWeight": 700, "sample": "Kyoto", "usage": "City names in the weather rows."},
       {"name": "hand-note", "fontSize": "17px", "lineHeight": 1.2, "fontWeight": 400, "sample": "rain on Friday, pack the umbrella", "usage": "Weather blurbs, \"why's this here?\", little asides. Usually in pen."}]},
     {"name": "Typewriter", "family": "type", "styles": [
       {"name": "type-item", "fontSize": "14px", "lineHeight": 1.4, "fontWeight": 400, "sample": "Warm coat", "usage": "Checklist items, form inputs, body text."},
       {"name": "type-meta", "fontSize": "12px", "lineHeight": 1.4, "fontWeight": 400, "sample": "Dec 10 – Dec 15 · 5 nights · 6 days", "usage": "Dates, counts, quantities, captions. In ink-soft."},
       {"name": "type-button", "fontSize": "14px", "lineHeight": 1, "fontWeight": 700, "sample": "Pack my bag", "usage": "Buttons and tappable chips."},
       {"name": "type-label", "fontSize": "11px", "lineHeight": 1.2, "fontWeight": 700, "letterSpacing": "0.08em", "sample": "SHARED", "usage": "Tiny uppercase labels: SHARED, CLAIMED, FROM YOUR PAST TRIPS."}]}]},
 "spacing": {"tokens": [
   {"name": "space-1", "value": "4px", "usage": "Inside a row: checkbox to its tick, doodle to its label."},
   {"name": "space-2", "value": "8px", "usage": "Between an item's parts (box, name, leader, quantity) and between chips."},
   {"name": "space-3", "value": "12px", "usage": "Between city rows; dot pitch of the dotted leader."},
   {"name": "space-4", "value": "16px", "usage": "Page gutter on phones; padding inside cards."},
   {"name": "space-5", "value": "20px", "usage": "Trip page side padding; padding inside sheets."},
   {"name": "space-6", "value": "28px", "usage": "Between categories and major sections."}]},
 "radius": {"tokens": [
   {"name": "radius-sm", "value": "4px", "usage": "Quiz options, chips, inputs."},
   {"name": "radius-md", "value": "10px", "usage": "Cards, sheets, the calendar."},
   {"name": "radius-lg", "value": "22px", "usage": "Bottom sheets and the phone-sized page frame."},
   {"name": "radius-pill", "value": "999px", "usage": "Progress bar, the cover badge, avatars."}]},
 "shadow": {"tokens": [
   {"name": "shadow-lift", "value": {"light": "0 14px 30px -20px rgba(34, 32, 32, 0.45)", "dark": "0 14px 30px -18px rgba(0, 0, 0, 0.7)"}, "usage": "Only for things that float: bottom sheets and the calendar popover. Cards use a hairline, not a shadow."}]},
 "line": {"tokens": [
   {"name": "line-doodle", "value": "2.1", "usage": "Stroke width of doodles at 48-unit size."},
   {"name": "line-box", "value": "1.6", "usage": "Checkbox and button outlines."},
   {"name": "line-tick", "value": "2.6", "usage": "The matcha tick mark."}]},
}
write(P("tokens.json"), json.dumps(tokens, indent=1, ensure_ascii=False) + "\n")

# tokens.css, laid out as the page compiles it
L = ["/* Caboodle — generated from tokens.json */"]
L.append(':root, [data-theme="light"] {')
L += [f"  --{n}: {l};" for n, l, d, u in C]
L.append("  --shadow-lift: 0 14px 30px -20px rgba(34, 32, 32, 0.45);")
L.append("}")
L.append('[data-theme="dark"] {')
L += [f"  --{n}: {d};" for n, l, d, u in C if l != d]
L.append("  --shadow-lift: 0 14px 30px -18px rgba(0, 0, 0, 0.7);")
L.append("}")
L.append(":root {")
for fam in ("spacing", "radius", "line"):
    L += [f"  --{t['name']}: {t['value']};" for t in tokens[fam]["tokens"]]
L.append(f"  --font-hand: {HAND};")
L.append(f"  --font-type: {TYPE};")
L.append("}")
for g in tokens["type"]["groups"]:
    for s in g["styles"]:
        fam = "hand" if g["family"] == "hand" else "type"
        ls = f" letter-spacing: {s['letterSpacing']};" if "letterSpacing" in s else ""
        L.append(f".{s['name']} {{ font-family: var(--font-{fam}); font-size: {s['fontSize']}; line-height: {s['lineHeight']}; font-weight: {s['fontWeight']};{ls} }}")
write(P("tokens.css"), "\n".join(L) + "\n")

# ── Component stylesheet ─────────────────────────────────
write(P("components", "bundle.css"), r'''@import url("https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&family=Gaegu:wght@400;700&display=swap");

/* Caboodle components. Every colour, size and radius comes from tokens.css. */
.cb-stage { background: var(--paper); color: var(--ink); font: 400 14px/1.4 var(--font-type); padding: var(--space-5); min-height: 100%; box-sizing: border-box; }
.cb-stage *, .cb-stage *::before, .cb-stage *::after { box-sizing: border-box; }
.cb-row { display: flex; flex-wrap: wrap; gap: var(--space-4); align-items: flex-start; }
.cb-col { display: grid; gap: var(--space-3); min-width: 0; }
.cb-caption { font: 400 12px/1.4 var(--font-type); color: var(--ink-soft); }
.cb-doodle { width: 36px; height: 36px; color: var(--ink); flex: none; }
.cb-focusable:focus-visible, .cb-btn:focus-visible, .cb-item:focus-visible, .cb-ghead:focus-visible, .cb-opt:focus-visible, .cb-day:focus-visible {
  outline: 2px solid var(--focus); outline-offset: 2px; }

/* Buttons */
.cb-btn { display: inline-flex; align-items: center; gap: var(--space-2); font: 700 14px/1 var(--font-type); padding: 12px 18px;
  border-radius: var(--radius-sm); border: var(--line-box)px solid var(--ink); border-width: 1.6px; background: var(--ink); color: var(--on-ink); cursor: pointer; }
.cb-btn--quiet { background: transparent; color: var(--ink); border-style: dashed; border-color: var(--ink-soft); }
.cb-btn--text { background: none; border: 0; padding: 6px 0; color: var(--ink); text-decoration: underline; text-decoration-style: dotted; text-underline-offset: 4px; }
.cb-btn[disabled] { opacity: .4; cursor: not-allowed; }

/* Checklist item */
.cb-items { list-style: none; margin: 0; padding: 0; }
.cb-item { width: 100%; display: flex; align-items: center; gap: var(--space-2); background: none; border: 0; padding: 6px 0;
  color: var(--ink); font: 400 14px/1.4 var(--font-type); text-align: left; cursor: pointer; }
.cb-box { width: 22px; height: 22px; flex: none; }
.cb-box .edge { fill: none; stroke: var(--ink); stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.cb-box .tick { fill: none; stroke: var(--matcha-ink); stroke-width: 2.6; stroke-linecap: round; stroke-linejoin: round; opacity: 0; transition: opacity .15s ease; }
.cb-item[aria-pressed="true"] .tick { opacity: 1; }
.cb-item .name { min-width: 0; transition: opacity .2s ease; }
.cb-item[aria-pressed="true"] .name { text-decoration: line-through; opacity: .45; }
.cb-lead { flex: 1; min-width: 12px; border-bottom: 1.5px dotted var(--leader); transform: translateY(-4px); }
.cb-qty { color: var(--ink-soft); }
.cb-note { display: block; font: 400 12px/1.3 var(--font-type); color: var(--ink-soft); }
.cb-why { font: 400 17px/1.2 var(--font-hand); color: var(--pen); margin: 0 0 4px 30px; }

/* Category header */
.cb-ghead { width: 100%; display: flex; align-items: flex-end; gap: var(--space-2); background: none; border: 0; padding: 4px 0; color: var(--ink); cursor: pointer; text-align: left; }
.cb-ghead .tri { font: 400 12px/1 var(--font-type); color: var(--ink-soft); padding-bottom: 8px; width: 10px; display: inline-block; transition: transform .2s ease; }
.cb-ghead[aria-expanded="false"] .tri { transform: rotate(-90deg); }
.cb-ghead .h { font: 700 23px/1 var(--font-hand); }
.cb-ghead .u { display: block; width: 118px; height: 9px; margin-top: 1px; color: var(--ink); }
.cb-ghead .n { margin-left: auto; font: 400 12px/1 var(--font-type); color: var(--ink-soft); padding-bottom: 6px; }
.cb-ghead.is-done .h { color: var(--matcha-ink); }
.cb-ghead.is-done .u { color: var(--matcha-ink); }

/* Trip cover */
.cb-cover { position: relative; height: 104px; color: var(--ink); }
.cb-cover > svg.paint { position: absolute; inset: 0; width: 100%; height: 100%; }
.cb-cover .badge { position: absolute; left: var(--space-5); bottom: -28px; width: 62px; height: 62px; border-radius: var(--radius-pill);
  background: var(--paper); display: grid; place-items: center; box-shadow: 0 0 0 1.6px var(--ink); }
.cb-cover .badge svg { width: 46px; height: 46px; color: var(--ink); }
.cb-trip-title { font: 700 44px/.95 var(--font-hand); margin: 0; }
.cb-trip-meta { font: 400 12px/1.4 var(--font-type); color: var(--ink-soft); margin-top: 4px; }

/* City weather row */
.cb-stop { border-left: 2px dotted var(--leader); padding-left: 10px; }
.cb-stop-head { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.cb-stop-head svg { width: 26px; height: 26px; color: var(--ink); flex: none; }
.cb-stop-head .city { font: 700 20px/1 var(--font-hand); }
.cb-stop-head .when { font: 400 12px/1.4 var(--font-type); color: var(--ink-soft); margin-left: auto; }
.cb-blurb { margin: 4px 0 0; font: 400 17px/1.2 var(--font-hand); color: var(--pen); }

/* Progress */
.cb-progress { display: flex; align-items: center; gap: 10px; }
.cb-bar { flex: 1; height: 8px; border: 1.4px solid var(--ink); border-radius: var(--radius-pill); overflow: hidden; }
.cb-bar i { display: block; height: 100%; background: var(--matcha); transition: width .3s ease; }
.cb-count { font: 700 17px/1 var(--font-hand); white-space: nowrap; }

/* Quiz */
.cb-quiz { background: var(--paper-raised); border-radius: var(--radius-md); padding: var(--space-5); display: grid; gap: var(--space-3); max-width: 340px; }
.cb-quiz .q { display: flex; align-items: center; gap: var(--space-2); font: 700 23px/1.05 var(--font-hand); margin: 0; }
.cb-quiz .step { font: 700 11px/1.2 var(--font-type); letter-spacing: .08em; text-transform: uppercase; color: var(--ink-soft); }
.cb-opts { display: grid; gap: var(--space-2); }
.cb-opt { text-align: left; font: 400 14px/1.3 var(--font-type); color: var(--ink); background: var(--paper); border: 1.4px dashed var(--leader);
  border-radius: var(--radius-sm); padding: 10px 12px; cursor: pointer; }
.cb-opt[aria-pressed="true"] { border: 1.6px solid var(--ink); background: var(--selected); }
.cb-quiz .skip { justify-self: end; }

/* Calendar */
.cb-cal { background: var(--paper-raised); border-radius: var(--radius-md); padding: var(--space-4); width: 100%; max-width: 300px; }
.cb-cal-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-2); }
.cb-cal-head b { font: 700 20px/1 var(--font-hand); }
.cb-cal-head span { font: 400 14px/1 var(--font-type); color: var(--ink-soft); }
.cb-cal-grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 2px; text-align: center; }
.cb-cal-grid .dow { font: 700 11px/2 var(--font-type); color: var(--ink-soft); }
.cb-day { font: 400 13px/1 var(--font-type); color: var(--ink); background: none; border: 0; height: 34px; border-radius: var(--radius-sm); cursor: pointer; }
.cb-day.out { color: var(--leader); }
.cb-day.in-range { background: var(--selected); border-radius: 0; }
.cb-day.start, .cb-day.end { background: var(--ink); color: var(--on-ink); border-radius: var(--radius-pill); }
.cb-cal-foot { margin-top: var(--space-3); font: 400 12px/1.4 var(--font-type); color: var(--ink-soft); }

/* City input */
.cb-field { display: grid; gap: 6px; }
.cb-field label { font: 700 23px/1 var(--font-hand); }
.cb-input { font: 400 16px/1.3 var(--font-type); color: var(--ink); background: transparent; border: 0; border-bottom: 1.6px solid var(--ink); padding: 8px 2px; width: 100%; }
.cb-input::placeholder { color: var(--ink-soft); }
.cb-chip { display: inline-flex; align-items: center; gap: 6px; font: 700 14px/1 var(--font-type); border: 1.6px solid var(--ink); border-radius: var(--radius-sm); padding: 7px 10px; background: var(--paper); color: var(--ink); }
.cb-chip .x { color: var(--ink-soft); font-weight: 400; }
.cb-chip--add { border-style: dashed; border-color: var(--ink-soft); font-weight: 400; color: var(--ink-soft); }

/* Shared items */
.cb-shared { background: var(--paper-raised); border-radius: var(--radius-md); padding: var(--space-4); display: grid; gap: var(--space-2); max-width: 360px; }
.cb-label { font: 700 11px/1.2 var(--font-type); letter-spacing: .08em; text-transform: uppercase; color: var(--ink-soft); }
.cb-shared-item { display: flex; align-items: center; gap: var(--space-2); padding: 6px 0; border-bottom: 1px solid var(--rule); }
.cb-shared-item:last-child { border-bottom: 0; }
.cb-claim { margin-left: auto; font: 700 12px/1 var(--font-type); padding: 6px 9px; border-radius: var(--radius-sm); border: 1.4px dashed var(--ink-soft); color: var(--ink); background: none; cursor: pointer; white-space: nowrap; }
.cb-claimed { margin-left: auto; display: inline-flex; align-items: center; gap: 6px; font: 400 17px/1 var(--font-hand); color: var(--ink); white-space: nowrap; }
.cb-avatar { width: 22px; height: 22px; border-radius: var(--radius-pill); background: var(--strawberry); color: var(--ink); font: 700 11px/22px var(--font-type); text-align: center; flex: none; }
.cb-avatar.g { background: var(--matcha); }
.cb-avatar.h { background: var(--hojicha); }
.cb-friend { display: grid; grid-template-columns: 22px minmax(0, 1fr) auto; align-items: center; gap: var(--space-2); font: 400 14px/1.3 var(--font-type); }
.cb-friend .cb-bar { height: 6px; }

@media (prefers-reduced-motion: reduce) { .cb-stage * { transition: none !important; } }
''')

# ── Doodle sprite + shared bits for previews ─────────────────
def underline(d):
    return f'<svg class="u" viewBox="0 0 118 9" aria-hidden="true"><path d="{d}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" filter="url(#cb-wobble)"/></svg>'
BOX = '<svg class="cb-box" viewBox="0 0 24 24" aria-hidden="true"><path class="edge" d="M5 6C9 4.6 15 5.2 19.4 5c.4 4-.2 9 .2 14-5.6.4-10.6-.2-15 .3.3-5.3.7-9.3.4-13.3z"/><path class="tick" d="M6 12.5l4.5 4.5L21 3"/></svg>'
def use(name, df=None, cls="cb-doodle"):
    st = f' style="--df: var(--{df})"' if df else ""
    return f'<svg class="{cls}" aria-hidden="true"{st}><use href="#cb-{name}"/></svg>'
TOGGLE_JS = '''<script>
document.querySelectorAll('.cb-item').forEach(function (b) { b.addEventListener('click', function () {
  b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true')); }); });
</script>'''
def item(name, pressed=False, qty=None, note=None):
    q = f'<span class="cb-lead"></span><span class="cb-qty">×{qty}</span>' if qty else ""
    n = f'<span class="name">{name}' + (f'<span class="cb-note">{note}</span>' if note else "") + '</span>'
    return f'<li><button class="cb-item" aria-pressed="{str(pressed).lower()}">{BOX}{n}{q}</button></li>'

previews = {}
previews["Doodle"] = ('group="Foundations" height=230', f'''{sprite(list(DOODLES))}
<div class="cb-stage"><div class="cb-row" style="gap:18px 22px">
''' + "".join(f'<div class="cb-col" style="justify-items:center;gap:4px;width:84px">{use(n, cls="cb-doodle")}<span class="cb-caption" style="text-align:center">{LABELS[n]}</span></div>' for n in DOODLES) + '''
</div></div>''')
previews["Button"] = ('group="Actions" height=120', '''<div class="cb-stage"><div class="cb-row" style="align-items:center">
<button class="cb-btn">Pack my bag</button>
<button class="cb-btn cb-btn--quiet">+ add another city</button>
<button class="cb-btn cb-btn--text">Skip</button>
<button class="cb-btn" disabled>Pack my bag</button>
</div></div>''')
previews["ChecklistItem"] = ('group="Checklist" height=250', f'''{sprite([])}
<div class="cb-stage" style="max-width:360px"><ul class="cb-items">
{item("Passport", True)}
{item("Underwear", False, 7)}
{item("T-shirts", True, 6)}
{item("Shampoo &amp; conditioner", False, None, "Travel size (100 ml or less)")}
{item("Warm coat")}
</ul><p class="cb-why">because: Kyoto drops to 34°F at night</p></div>{TOGGLE_JS}''')
previews["CategoryHeader"] = ('group="Checklist" height=200', f'''{sprite(["passport","sock","toothbrush"])}
<div class="cb-stage" style="max-width:360px;display:grid;gap:10px">
<button class="cb-ghead" aria-expanded="true"><span class="tri">▼</span>{use("passport","fill-pink")}<span><span class="h">The documents</span>{underline("M2 5C30 1.5 70 7.5 116 3.5")}</span><span class="n">1/3</span></button>
<button class="cb-ghead is-done" aria-expanded="false"><span class="tri">▼</span>{use("sock","fill-green")}<span><span class="h">The clothes</span>{underline("M2 4C34 7.5 66 1.5 104 5")}</span><span class="n">9/9 packed</span></button>
<button class="cb-ghead" aria-expanded="false"><span class="tri">▼</span>{use("toothbrush","fill-blue")}<span><span class="h">The toiletries</span>{underline("M2 5C40 2 80 7 112 4")}</span><span class="n">0/12</span></button>
</div>''')
COVER_PAINT = lambda tok: f'<svg class="paint" viewBox="0 0 320 104" preserveAspectRatio="none" aria-hidden="true"><rect x="-10" y="-12" width="340" height="118" style="fill:var(--{tok})" filter="url(#cb-paint)"/></svg>'
previews["TripCover"] = ('group="Trip" height=250', f'''{sprite(["suitcase"], paint=True)}
<div class="cb-stage" style="padding:0;max-width:360px">
<div class="cb-cover">{COVER_PAINT("cover-strawberry")}<div class="badge">{use("suitcase","fill-pink","")}</div></div>
<div style="padding:40px 20px 20px"><p class="cb-trip-title">tokyo + kyoto</p><div class="cb-trip-meta">Dec 10 – Dec 15 · 5 nights · 6 days</div></div>
</div>''')
previews["CoverColours"] = ('group="Trip" height=150', f'''{sprite([], paint=True)}
<div class="cb-stage"><div class="cb-row">''' + "".join(
 f'<div class="cb-col" style="gap:6px;width:150px"><svg viewBox="0 0 150 60" preserveAspectRatio="none" style="width:150px;height:60px;display:block" aria-hidden="true"><rect x="-6" y="-6" width="162" height="72" style="fill:var(--{t})" filter="url(#cb-paint)"/></svg><span class="cb-caption">{lbl}</span></div>'
 for t, lbl in [("cover-strawberry","Strawberry (default)"),("cover-matcha","Matcha"),("cover-hojicha","Hojicha")]) + '</div></div>')
previews["CityWeather"] = ('group="Trip" height=210', f'''{sprite(["umbrella","snow","sun"])}
<div class="cb-stage" style="max-width:360px;display:grid;gap:12px">
<div class="cb-stop"><div class="cb-stop-head">{use("umbrella","fill-blue")}<span class="city">Tokyo</span><span class="when">Dec 10–13 · 36–55°F</span></div>
<p class="cb-blurb">Chilly, with highs around 52°F and lows near 39°F. Rain likely on one day, so keep an umbrella handy.</p></div>
<div class="cb-stop"><div class="cb-stop-head">{use("snow","fill-blue")}<span class="city">Kyoto</span><span class="when">Dec 13–15 · 30–50°F</span></div>
<p class="cb-blurb">Last year around these dates it was cold, with highs around 48°F and lows near 34°F. Looks dry.</p></div>
</div>''')
previews["ProgressBar"] = ('group="Trip" height=120', '''<div class="cb-stage" style="max-width:360px;display:grid;gap:14px">
<div class="cb-progress"><div class="cb-bar"><i style="width:34%"></i></div><span class="cb-count">15 of 44 packed</span></div>
<div class="cb-progress"><div class="cb-bar"><i style="width:100%"></i></div><span class="cb-count">all packed!</span></div>
</div>''')
previews["QuizCard"] = ('group="Start a trip" height=330', f'''{sprite(["suitcase"])}
<div class="cb-stage"><div class="cb-quiz">
<span class="step">Question 1 of 7</span>
<p class="q">{use("suitcase","fill-pink")}Do you overpack?</p>
<div class="cb-opts">
<button class="cb-opt" aria-pressed="false">I pack light</button>
<button class="cb-opt" aria-pressed="true">Just right</button>
<button class="cb-opt" aria-pressed="false">I bring everything, just in case</button>
</div>
<button class="cb-btn cb-btn--text skip">Skip</button>
</div></div>
<script>document.querySelectorAll('.cb-opt').forEach(function (o) {{ o.addEventListener('click', function () {{
 document.querySelectorAll('.cb-opt').forEach(function (x) {{ x.setAttribute('aria-pressed', String(x === o)); }}); }}); }});</script>''')
days = []
for d in range(30, 31): days.append(f'<button class="cb-day out">{d}</button>')
for d in range(1, 32):
    cls = "cb-day"
    if d == 10: cls += " start"
    elif d == 13: cls += " end"
    elif 10 < d < 13: cls += " in-range"
    days.append(f'<button class="{cls}">{d}</button>')
for d in range(1, 4): days.append(f'<button class="cb-day out">{d}</button>')
previews["Calendar"] = ('group="Start a trip" height=380', '''<div class="cb-stage"><div class="cb-cal">
<div class="cb-cal-head"><span>‹</span><b>December 2026</b><span>›</span></div>
<div class="cb-cal-grid">''' + "".join(f'<span class="dow">{d}</span>' for d in "MTWTFSS") + "".join(days) + '''</div>
<div class="cb-cal-foot">Tokyo · Dec 10 – Dec 13 · 3 nights</div>
</div></div>''')
previews["CityInput"] = ('group="Start a trip" height=200', '''<div class="cb-stage" style="max-width:360px;display:grid;gap:14px">
<div class="cb-field"><label for="city">Where are you off to?</label>
<input class="cb-input" id="city" placeholder="Type a city" value="Kyo"></div>
<div class="cb-row" style="gap:8px"><span class="cb-chip">Tokyo <span class="x">×</span></span><span class="cb-chip">Kyoto <span class="x">×</span></span><span class="cb-chip cb-chip--add">+ add another city</span></div>
</div>''')
previews["SharedItems"] = ('group="Group trips" height=330', f'''{sprite(["people"])}
<div class="cb-stage"><div style="display:grid;gap:14px;max-width:360px">
<div class="cb-shared">
<div class="cb-row" style="align-items:center;gap:8px">{use("people","fill-green")}<span class="hand-heading" style="font:700 23px/1 var(--font-hand)">The shared stuff</span></div>
<div class="cb-shared-item"><span>Hairdryer</span><span class="cb-claimed"><span class="cb-avatar">M</span>Mia's got it</span></div>
<div class="cb-shared-item"><span>Portable speaker</span><button class="cb-claim">I'll bring it</button></div>
<div class="cb-shared-item"><span>Sunscreen</span><span class="cb-claimed"><span class="cb-avatar g">S</span>you</span></div>
</div>
<div class="cb-shared"><span class="cb-label">Everyone's progress</span>
<div class="cb-friend"><span class="cb-avatar">M</span><div class="cb-bar"><i style="width:80%"></i></div><span class="cb-caption">80%</span></div>
<div class="cb-friend"><span class="cb-avatar h">J</span><div class="cb-bar"><i style="width:25%"></i></div><span class="cb-caption">25%</span></div>
</div></div></div>''')

for comp, (marker, html) in previews.items():
    write(P("components", comp, "preview.html"), f"<!-- @dsCard {marker} -->\n{html}\n")

READMES = {
 "Doodle": "Hand-drawn icons for categories, weather and group trips: a wobbly ink outline over a soft, slightly off-register fill.\n\n**Provide:** a doodle name and, optionally, a fill token as `--df`.\n\n- Ink follows `currentColor` (so `ink` in both themes); the fill defaults to the doodle's own pastel (`fill-pink`, `fill-green`, `fill-blue`, `fill-butter`, `fill-tan`).\n- Sizes: 26px beside a city, 28–36px beside a heading, 46px in the cover badge, 64px+ on empty states. Never below 24px: the wobble turns to noise.\n- One doodle per heading or row. Don't line them up as decoration.\n- Uploaded SVGs in **Assets → Doodles** have the ink fixed at `#222020`; use them only on light grounds. In the app, draw them inline so the ink can follow the theme.\n",
 "Button": "Buttons in typewriter bold: one filled ink button per screen for the main action, a dashed quiet button for secondary actions, and a dotted-underline text button for skipping.\n\n**Provide:** a label that says exactly what happens (\"Pack my bag\", \"+ add another city\", \"Skip\").\n\n- Filled: `ink` background, `on-ink` text, `radius-sm`. One per screen.\n- Quiet: dashed `ink-soft` outline, `ink` text. For adding things.\n- Text: no box, dotted underline. For Skip and Cancel.\n- Disabled: 40% opacity, and say why nearby.\n",
 "ChecklistItem": "One line on the packing list: a hand-drawn box, the item name in typewriter, and, only when it's more than one, a dotted leader to the quantity.\n\n**Provide:** the item name, `aria-pressed` for packed, an optional quantity (shown only when >1) and an optional note.\n\n- Tapping anywhere on the row toggles it. Packed items get a `matcha-ink` tick, a strike-through and 45% opacity; they stay in place so the list doesn't jump.\n- Never show \"×1\".\n- Notes (\"Travel size (100 ml or less)\") sit under the name in `type-meta`.\n- \"Why's this here?\" opens a handwritten line in `pen`: \"because: Kyoto drops to 34°F at night\".\n",
 "CategoryHeader": "The heading for each category: a toggle triangle, the category doodle, a handwritten \"The …\" title with a scribbled underline, and a count.\n\n**Provide:** the category, its doodle, packed/total counts and `aria-expanded`.\n\n- Titles always read \"The documents\", \"The clothes\", \"The toiletries\", \"The tech\", \"The activity gear\", \"The odds & ends\".\n- When everything in it is packed, the title and underline turn `matcha-ink`, the count reads \"9/9 packed\", and the category folds itself.\n",
 "TripCover": "The top of every trip page: a painted cover band, a round sticker badge with the suitcase doodle, the trip title in lowercase handwriting, and the dates.\n\n**Provide:** the cover colour (strawberry by default), the cities joined with \" + \", and the overall dates with nights and days.\n\n- The paint texture is an SVG filter on a plain rect: never a photo.\n- Title in `hand-display`, lowercase: \"tokyo + kyoto\". Meta in `type-meta`: \"Dec 10 – Dec 15 · 5 nights · 6 days\".\n",
 "CoverColours": "The three cover colours a trip can choose from: strawberry (default), matcha and hojicha.\n\n**Provide:** one of `cover-strawberry`, `cover-matcha`, `cover-hojicha`.\n\n- Only these three. Text never sits directly on a cover; the badge and title sit below or on paper.\n",
 "CityWeather": "One row per city under the trip title: a weather doodle, the city in handwriting, its dates and temperature range, and a short weather blurb.\n\n**Provide:** city, dates, low–high in °F, and the blurb text from the weather service.\n\n- Doodle by weather: umbrella for rain, snowflake for cold or snow, sun for warm.\n- Temperatures always in Fahrenheit: \"36–55°F\".\n- The blurb is in `hand-note`, `pen`. Forecasts read \"Chilly, with highs around…\"; trips beyond two weeks say \"Last year around these dates it was…\" so it's clear it's not a forecast.\n",
 "ProgressBar": "A hand-drawn-looking progress bar with a handwritten count.\n\n**Provide:** packed and total counts.\n\n- Fill is `matcha` inside an `ink` outline. The count reads \"15 of 44 packed\", and \"all packed!\" at 100%.\n- On group trips each friend gets a thin version with their initial (see SharedItems). Friends see percentages, never items.\n",
 "QuizCard": "One quiz question per card, answered with one tap; every question can be skipped.\n\n**Provide:** the question, 2–4 options, the step (\"Question 1 of 7\") and the previous answer if there is one.\n\n- Question in `hand-heading` with a doodle; options in typewriter on dashed outlines. The selected option gets a solid `ink` outline on `selected`.\n- Answers carry over from your last trip; show them already selected.\n- Copy is casual and short: \"Do you overpack?\", \"Fancy dinner?\", \"Laundry where you're staying?\"\n",
 "Calendar": "A simple month calendar for picking one city's dates: tap the start day, then the end day.\n\n**Provide:** the month, the selected start and end, and the city it's for.\n\n- Start and end are `ink` discs; the days between sit on `selected`.\n- The footer repeats the choice in words: \"Tokyo · Dec 10 – Dec 13 · 3 nights\".\n- Each city gets its own range; the next city's calendar opens on the previous city's end date.\n",
 "CityInput": "The first step of a new trip: \"Where are you off to?\" with a typewriter input, the cities so far as chips, and \"+ add another city\".\n\n**Provide:** the typed text, matching places from the place search, and the chosen cities in order.\n\n- Each chip is one stop; tapping a chip opens its calendar. × removes it.\n",
 "SharedItems": "The group part of a trip: the shared items list with who's bringing what, and everyone's packing progress.\n\n**Provide:** shared items with their claimer (or none), and each member's initial and percentage.\n\n- Unclaimed items show a dashed \"I'll bring it\" button; claimed ones show the person in handwriting: \"Mia's got it\", or \"you\".\n- Friends only ever see percentages here, never each other's personal items or quantities.\n",
}
for comp, text in READMES.items():
    write(P("components", comp, "README.md"), f"# {comp}\n\n{text}")

# ── Cover ────────────────────────────────────────────
write(P("components", "Cover", "preview.html"), '''<!-- @dsCard height=288 -->
<style>
.cv { position: relative; width: 960px; height: 288px; background: var(--paper); overflow: hidden; }
.cv svg { position: absolute; inset: 0; }
.cv .straw { fill: var(--cover-strawberry); } .cv .matcha { fill: var(--cover-matcha); } .cv .hoji { fill: var(--cover-hojicha); }
.cv .ink { fill: var(--ink); } .cv .butter { fill: var(--fill-butter); } .cv .dot { fill: var(--ink); }
.cv .disc { rx: var(--radius-pill); } .cv .tile { rx: var(--radius-md); }
.cv .name { position: absolute; left: 40px; bottom: 40px; max-width: 440px; }
.cv .name b { display: block; font: 700 90px/.95 var(--font-hand); color: var(--ink); }
.cv .name span { display: block; margin-top: 12px; font: 400 14px/1.3 var(--font-type); color: var(--ink-soft); }
</style>
<div class="cv">
<svg width="960" height="288" viewBox="0 0 960 288" aria-hidden="true">
<!-- blocks: cover-strawberry 300×168 (bleeds top), cover-matcha 220×128 (bleeds right), cover-hojicha 168×92, ink disc 64 (radius-pill), fill-butter 56 tile (radius-md)
     arrangement: a staggered stack of painted slabs, like trip covers piled on a desk, all right of x=480
     pattern: the dotted leader (the line between an item and its quantity), two rows of dots at space-4 pitch, because the menu-card dotted line is the most Caboodle shape there is
     scales: dot pitch space-4 (16px), gaps space-3/space-6, radii radius-md and radius-pill -->
<defs><filter id="cvp" x="-6%" y="-10%" width="112%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="3" seed="7" result="e"/><feDisplacementMap in="SourceGraphic" in2="e" scale="12" xChannelSelector="R" yChannelSelector="G"/></filter></defs>
<rect class="straw" x="520" y="-12" width="300" height="168" filter="url(#cvp)"/>
<rect class="matcha" x="748" y="136" width="236" height="128" filter="url(#cvp)"/>
<rect class="hoji" x="560" y="184" width="168" height="92" filter="url(#cvp)"/>
<rect class="ink disc" x="864" y="32" width="64" height="64" rx="32"/>
<rect class="butter tile" x="492" y="200" width="56" height="56" rx="10"/>
''' + "".join(f'<circle class="dot" cx="{x}" cy="{y}" r="2.4"/>' for y in (72, 104) for x in range(552, 912, 16)) + '''
</svg>
<div class="name"><b>Caboodle</b><span>The whole kit &amp; caboodle, packed.</span></div>
</div>
''')

# ── README (brand book) ────────────────────────────────
write(P("README.md"), r'''Caboodle makes packing lists for trips: type where you're going, answer a few one-tap questions, and tick things off as you pack. It looks like a café menu someone doodled on: lots of white paper, typewriter text, handwritten headings, and small hand-drawn pictures in soft matcha, hojicha and strawberry. Calm enough to use every day, with a little charm in the margins.

## Voice and copy

- **Talk like a friend helping you pack.** Short, warm, plain. "Do you overpack?", "Fancy dinner?", "Mia's got it", "all packed!"
- **Handwriting is for the human bits; typewriter is for the facts.** Category titles, trip titles, notes, blurbs and counts are handwritten. Item names, dates, quantities, inputs and buttons are typewriter.
- **Trip titles are lowercase** and join cities with " + ": "tokyo + kyoto".
- **Categories always start with "The":** The documents, The clothes, The toiletries, The tech, The activity gear, The odds & ends.
- **Buttons say exactly what happens:** "Pack my bag", "+ add another city", "I'll bring it", "Skip".
- **Explain, don't warn.** "because: Kyoto drops to 34°F at night", not "Warning: cold weather".
- **No emoji, anywhere.** Doodles do that job.
- **Fahrenheit** for every temperature: "36–55°F".
- **No "×1".** Show a quantity only when it's more than one.

## Colour

- Pages are `paper`. Things that sit on top (quiz cards, the calendar, the shared panel) are `paper-raised`. Use a hairline `rule` to separate sections, not shadows.
- Text is `ink`; dates, counts and quantities are `ink-soft`. Handwritten notes and weather blurbs are `pen`.
- **Matcha means packed.** `matcha` fills the progress bar; `matcha-ink` draws ticks and recolours a finished category. Don't use green for anything else.
- `strawberry` is the brand accent: the claimed badge, avatars, highlights. `selected` backs a chosen quiz option or calendar range.
- Trip covers come in three painted colours only: `cover-strawberry` (default), `cover-matcha`, `cover-hojicha`. Never put text directly on a cover.
- Doodle fills (`fill-pink`, `fill-green`, `fill-blue`, `fill-butter`, `fill-tan`) are the same in both themes: pastel stickers read well on light and dark paper.
- `leader` is decorative only (dotted lines). Never set text in it.

## Type

- Two families: **Gaegu** (handwriting, `--font-hand`) and **Courier Prime** (typewriter, `--font-type`), both from Google Fonts.
- `hand-display` for the trip title, `hand-heading` for category titles and quiz questions, `hand-city` for city names, `hand-note` for blurbs and asides.
- `type-item` for list items and inputs, `type-meta` for dates and counts, `type-button` for buttons, `type-label` for tiny uppercase labels like SHARED.
- Never set long paragraphs in handwriting; two lines is the limit.

## Doodles (iconography)

- All icons are Caboodle doodles: a wobbly 2.1-unit ink line (`line-doodle`) on a 48-unit grid over a pastel fill nudged 1.8 units down and right, like a slightly misregistered print.
- One doodle per category, city row or quiz card. Category doodles: passport (documents), sock (clothes), toothbrush (toiletries), plug (tech), backpack (activity gear), bottle (odds & ends). Weather: umbrella, snow, sun. Suitcase for the trip and "all packed". People for group trips.
- In the app, draw doodles inline so the ink follows `ink` in both themes. The uploaded SVGs (Assets → Doodles) have ink fixed at `#222020` and belong on light grounds only.
- No emoji, no photo icons, no icon fonts. A missing doodle gets drawn in the same style, never substituted.

## Logo

- The wordmark is "caboodle" in lowercase Gaegu Bold, outlined, with a double scribble underline and the suitcase doodle at the end. Use `caboodle-logo.svg` on light grounds and `caboodle-logo-light.svg` on dark ones.
- Keep at least the suitcase's width of clear space around it. Don't recolour it, outline it, or set it in another font.

## Layout and spacing

- Phone first: one column, `space-5` side padding on the trip page, `space-4` gutter elsewhere.
- Spacing steps: `space-1` 4, `space-2` 8, `space-3` 12, `space-4` 16, `space-5` 20, `space-6` 28. Categories are `space-6` apart.
- A trip page reads top to bottom: cover → title and dates → one row per city with its weather → progress → categories → shared stuff (group trips).
- Lots of white. If a screen feels busy, remove a doodle before shrinking text.

## Shapes

- Corners: `radius-sm` for options, chips and inputs; `radius-md` for cards and the calendar; `radius-lg` for bottom sheets; `radius-pill` for the progress bar, badge and avatars.
- Checkboxes and underlines are hand-drawn paths, never perfect squares or CSS underlines.
- Only floating things (bottom sheets, the calendar popover) get `shadow-lift`.

## Motion

- Small and quick: a tick fades in over 150ms, a packed item fades to 45% over 200ms, the progress bar grows over 300ms, a category folds over 200ms.
- One celebration only: at 100%, the suitcase doodle wiggles and the count reads "all packed!".
- Respect reduced motion: drop all transitions.

## States

- **Packed:** `matcha-ink` tick, strike-through, 45% opacity, stays in place.
- **Category done:** title and underline turn `matcha-ink`, count reads "9/9 packed", it folds.
- **Selected:** solid `ink` outline on `selected`.
- **Focus:** a solid 2px `focus` ring with 2px offset on every interactive element.
- **Disabled:** 40% opacity, with the reason written nearby.

## Dark mode

- Paper turns warm near-black, ink turns warm off-white, and accents brighten slightly so they keep their contrast. Covers darken so the badge still pops.
- Doodle fills stay the same pastel: they become little stickers on dark paper.
''')

# ── Assets ──────────────────────────────────────────
for n in DOODLES:
    write(os.path.join(OUT, "assets-src", "Doodles", f"{n}.svg"), standalone(n))
def logo(ink):
    from doodles import body, wobble_filter
    d = LOGO["d"]
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="-6 -4 440 124" width="440" height="124">'
      f'<defs>{wobble_filter("w")}</defs>'
      f'<path d="{d}" fill="{ink}"/>'
      f'<path d="M6 98C70 90 170 102 336 93" fill="none" stroke="{ink}" stroke-width="3.2" stroke-linecap="round" filter="url(#w)"/>'
      f'<path d="M48 109C110 104 190 110 290 105" fill="none" stroke="{ink}" stroke-width="2.4" stroke-linecap="round" filter="url(#w)"/>'
      f'<g transform="translate(352 18) scale(1.55)">{body("suitcase", None, ink, "w")}</g></svg>\n')
write(os.path.join(OUT, "assets-src", "Logo", "caboodle-logo.svg"), logo("#222020"))
write(os.path.join(OUT, "assets-src", "Logo", "caboodle-logo-light.svg"), logo("#f2eded"))
write(P("assets", "Doodles", "README.md"), "# Doodles\n\nThe Caboodle doodle set as standalone SVGs, 48-unit grid, ink `#222020` with each doodle's own pastel fill. For light grounds only; in the app, draw doodles inline so the ink follows the theme. Category: passport (documents), sock (clothes), toothbrush (toiletries), plug (tech), backpack (activity gear), bottle (odds & ends). Weather: umbrella, snow, sun. Trip: suitcase. Group: people.\n")
write(P("assets", "Logo", "README.md"), "# Logo\n\n`caboodle-logo.svg`: ink `#222020`, for light grounds. `caboodle-logo-light.svg`: ink `#f2eded`, for dark grounds. Outlined lowercase Gaegu Bold with a double scribble underline and the suitcase doodle.\n")
print("built")
