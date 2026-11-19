Caboodle makes packing lists for trips: type where you're going, answer a few one-tap questions, and tick things off as you pack. It looks like a café menu someone doodled on: lots of white paper, typewriter text, handwritten headings, and small hand-drawn pictures in soft matcha, hojicha and strawberry. Calm enough to use every day, with a little charm in the margins.

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
