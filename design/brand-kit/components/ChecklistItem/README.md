# ChecklistItem

One line on the packing list: a hand-drawn box, the item name in typewriter, and, only when it's more than one, a dotted leader to the quantity.

**Provide:** the item name, `aria-pressed` for packed, an optional quantity (shown only when >1) and an optional note.

- Tapping anywhere on the row toggles it. Packed items get a `matcha-ink` tick, a strike-through and 45% opacity; they stay in place so the list doesn't jump.
- Never show "×1".
- Notes ("Travel size (100 ml or less)") sit under the name in `type-meta`.
- "Why's this here?" opens a handwritten line in `pen`: "because: Kyoto drops to 34°F at night".
