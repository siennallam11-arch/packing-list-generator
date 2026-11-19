# Design

The Caboodle brand kit, as published at https://claude.ai/artifact/HBNJBGWLmiUP1HxdE8ksv3

- `brand-kit/README.md`: the brand book (voice, colour, type, doodles, layout, motion, dark mode)
- `brand-kit/tokens.json` / `tokens.css`: colours (light + dark), type, spacing, radii
- `brand-kit/components/`: each component's guidelines and HTML preview; `bundle.css` styles them
- `brand-kit/assets/`: the logo (outlined, light and dark) and the doodle SVGs

`tools/` holds the scripts that generated the kit (`build_kit.py`, the doodle set in `doodles.py`,
and `outline.py`, which turns the Gaegu wordmark into vector outlines with fontTools).
