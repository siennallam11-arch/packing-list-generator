# The Caboodle doodle set: (default fill, fill shapes, ink shapes, wrapper transform)
INK_G = '<g fill="none" stroke="{ink}" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" filter="url(#{fid})">'
DOODLES = {
  "passport": ("#F6C4CA", '<rect x="11" y="7" width="25" height="34" rx="3"/>',
    '<path d="M13 7h20a3 3 0 0 1 3 3v28a3 3 0 0 1-3 3H13a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z"/><circle cx="23.5" cy="20" r="6"/><path d="M23.5 14c-3 3.5-3 8.5 0 12M23.5 14c3 3.5 3 8.5 0 12M17.5 20h12"/><path d="M18 32h11M20 35.5h7"/>', None),
  "sock": ("#BFD9A6", '<path d="M17 5h13v19c0 2 1 3.4 3 5.4l5.6 5.6c3 3 1.8 7.8-2 8.8-2.2.6-4.3-.2-6-2L20 31.6c-2-2-3-4-3-7z"/>',
    '<path d="M17 5h13v19c0 2 1 3.4 3 5.4l5.6 5.6c3 3 1.8 7.8-2 8.8-2.2.6-4.3-.2-6-2L20 31.6c-2-2-3-4-3-7z"/><path d="M17 11h13M17 14.5h13M30.5 36.5l4.5-4.5"/>', None),
  "toothbrush": ("#CFE3F3", '<rect x="21.5" y="17" width="5" height="27" rx="2.5"/>',
    '<rect x="21.5" y="17" width="5" height="27" rx="2.5"/><path d="M24 17V5.5"/><path d="M17 6h7M17 9.3h7M17 12.6h7M17 15.8h7"/>', "rotate(32 24 24)"),
  "plug": ("#C5E8E4", '<path d="M14 17h20v8a10 10 0 0 1-20 0z"/>',
    '<path d="M14 17h20v8a10 10 0 0 1-20 0z"/><path d="M19 17V8M29 17V8"/><path d="M24 35c0 4-3 5-6 6.5s-3.5 4-1 5"/>', None),
  "backpack": ("#D9B79C", '<path d="M13 19a11 11 0 0 1 22 0v19a4 4 0 0 1-4 4H17a4 4 0 0 1-4-4z"/>',
    '<path d="M13 19a11 11 0 0 1 22 0v19a4 4 0 0 1-4 4H17a4 4 0 0 1-4-4z"/><path d="M19.5 9.2a4.5 4.5 0 0 1 9 0"/><path d="M13 23h22"/><rect x="18" y="29" width="12" height="8" rx="1.5"/><path d="M24 29v3"/>', None),
  "bottle": ("#CFE3F3", '<path d="M20 13h8v3.5c3.2 1.2 5 3.4 5 6.5v17a3 3 0 0 1-3 3H18a3 3 0 0 1-3-3V23c0-3.1 1.8-5.3 5-6.5z"/>',
    '<path d="M20 13h8v3.5c3.2 1.2 5 3.4 5 6.5v17a3 3 0 0 1-3 3H18a3 3 0 0 1-3-3V23c0-3.1 1.8-5.3 5-6.5z"/><rect x="19" y="5.5" width="10" height="7.5" rx="1.5"/><path d="M15 27h18M15 35h18"/>', None),
  "suitcase": ("#F6C4CA", '<rect x="5" y="16" width="38" height="25" rx="3"/>',
    '<rect x="5" y="16" width="38" height="25" rx="3"/><path d="M18 16v-5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5"/><path d="M14 16v25M34 16v25"/><path d="M21 26.5l1.8 1.8 3.6-3.8"/><circle cx="23.8" cy="27" r="4.6"/>', None),
  "umbrella": ("#CFE3F3", '<path d="M5 24a19 16 0 0 1 38 0c-3.2-3-6.3-3-9.5 0-3.2-3-6.3-3-9.5 0-3.2-3-6.3-3-9.5 0-3.2-3-6.3-3-9.5 0z"/>',
    '<path d="M5 24a19 16 0 0 1 38 0c-3.2-3-6.3-3-9.5 0-3.2-3-6.3-3-9.5 0-3.2-3-6.3-3-9.5 0-3.2-3-6.3-3-9.5 0z"/><path d="M24 24v14a3 3 0 0 1-6 0M24 8V5"/>', None),
  "snow": ("#E4EEF6", '<circle cx="24" cy="24" r="13"/>',
    '<path d="M24 8v32M10.1 16l27.8 16M10.1 32l27.8-16"/><path d="M20 11l4 4 4-4M20 37l4-4 4 4M11 21.5l5.5-1.5-1.5-5.5M37 26.5l-5.5 1.5 1.5 5.5M11 26.5l5.5 1.5-1.5 5.5M37 21.5l-5.5-1.5 1.5-5.5"/>', None),
  "sun": ("#C5E8E4", '<circle cx="24" cy="24" r="9.5"/>',
    '<circle cx="24" cy="24" r="9.5"/><path d="M24 5v5M24 38v5M5 24h5M38 24h5M10.6 10.6l3.5 3.5M33.9 33.9l3.5 3.5M10.6 37.4l3.5-3.5M33.9 14.1l3.5-3.5"/>', None),
  "people": ("#BFD9A6", '<circle cx="17" cy="17" r="6"/><circle cx="31" cy="17" r="6"/>',
    '<circle cx="17" cy="17" r="6"/><circle cx="31" cy="17" r="6"/><path d="M7 40c0-6.5 4.5-11 10-11s10 4.5 10 11"/><path d="M27.5 30.5c1.1-.9 2.3-1.5 3.5-1.5 5.5 0 10 4.5 10 11"/>', None),
}
LABELS = {"passport": "Documents", "sock": "Clothes", "toothbrush": "Toiletries", "plug": "Tech",
  "backpack": "Activity gear", "bottle": "Odds & ends", "suitcase": "Trip / all packed", "umbrella": "Rain",
  "snow": "Cold / snow", "sun": "Warm / sun", "people": "Group trip / shared"}

def wobble_filter(fid):
    return (f'<filter id="{fid}" x="-10%" y="-10%" width="120%" height="120%">'
            '<feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="3" result="n"/>'
            '<feDisplacementMap in="SourceGraphic" in2="n" scale="2.4" xChannelSelector="R" yChannelSelector="G"/></filter>')

def body(name, fill, ink, fid):
    dfill, fills, inks, wrap = DOODLES[name]
    inner = (f'<g transform="translate(1.8 1.6)" fill="{fill or dfill}">{fills}</g>'
             + INK_G.format(ink=ink, fid=fid) + inks + '</g>')
    return f'<g transform="{wrap}">{inner}</g>' if wrap else inner

def standalone(name, ink="#222020"):
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="96" height="96">'
            f'<defs>{wobble_filter("w")}</defs>{body(name, None, ink, "w")}</svg>\n')

def symbol(name):
    """For inline sprites: ink follows currentColor, fill follows --df (falls back to the doodle's own)."""
    dfill = DOODLES[name][0]
    b = body(name, "var(--df, %s)" % dfill, "currentColor", "cb-wobble")
    b = b.replace('fill="var(--df, %s)"' % dfill, 'style="fill:var(--df, %s)"' % dfill)
    return f'<symbol id="cb-{name}" viewBox="0 0 48 48">{b}</symbol>'

PAINT = ('<filter id="cb-paint" x="-6%" y="-10%" width="112%" height="120%">'
  '<feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="3" seed="7" result="edge"/>'
  '<feDisplacementMap in="SourceGraphic" in2="edge" scale="12" xChannelSelector="R" yChannelSelector="G" result="shape"/>'
  '<feTurbulence type="fractalNoise" baseFrequency="0.005 0.11" numOctaves="2" seed="4" result="streak"/>'
  '<feColorMatrix in="streak" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.1 -0.56" result="light"/>'
  '<feComposite in="light" in2="shape" operator="in" result="lightIn"/>'
  '<feMerge><feMergeNode in="shape"/><feMergeNode in="lightIn"/></feMerge></filter>')

def sprite(names, paint=False):
    return ('<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>'
            + wobble_filter("cb-wobble") + (PAINT if paint else "") + "".join(symbol(n) for n in names) + '</defs></svg>')
