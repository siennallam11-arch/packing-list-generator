# packing-list-generator

Tell it where you're going, when, and what you'll do there, answer a few quick
questions, and get a packing checklist you can tick off — and share with the
people you're traveling with.

## Status

Early days. The packing logic and weather lookup are built and tested; the
design and pages come next.

## Where things are

| Path | What it is |
|---|---|
| `src/lib/packing/rules.ts` | **The packing rules.** Every item, when it's added, how many. Edit this to change lists. |
| `src/lib/packing/generate.ts` | Turns a trip + quiz answers + weather into a grouped checklist. |
| `src/lib/weather/openMeteo.ts` | Place search and weather forecast (Open-Meteo, free, no key). |
| `src/lib/trip/model.ts` | Shape of a saved, shareable group trip. |
| `docs/packing-rules.md` | The rules as a readable table (generated). |

## Commands

```bash
npm install        # once
npm run dev        # run the site at http://localhost:3000
npm test           # run the tests
npm run rules      # regenerate docs/packing-rules.md after editing rules.ts
```
