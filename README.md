# Caboodle

The whole kit and caboodle, packed. Tell it where you're going, when, and what you'll do there, answer a few quick
questions, and get a packing checklist you can tick off — and share with the
people you're traveling with.

## Status

Version 1 works for your own trips, saved in your browser:

- Start a trip: cities (each with its own dates, picked in a pop-up calendar), activities, a 7-question quiz
- Live weather per city (Open-Meteo), with a short blurb in °F; trips further out use last year's weather
- A checklist grouped by category: tick, edit, add, remove, quantities, "why's this here?", undo
- "What changed" notes when the forecast changes the list
- Destination facts (plugs, currency, cash) and airline reminders on items
- Learns from your past trips (what you always remove, add or change)
- Backup links to move a trip to another device
- Installs to your home screen and works offline

- Group trips: invite friends with a link, a shared list with "I'll bring it", spotting doubles,
  and everyone's progress, through Supabase (`supabase/schema.sql`); personal lists stay private

## Where things are

| Path | What it is |
|---|---|
| `src/app/` | The pages: home (`Home.tsx`), new trip (`new/`), the trip checklist (`trip/`), backup import (`import/`) |
| `src/components/` | Doodles, the calendar, painted covers, the undo toast |
| `src/lib/packing/rules.ts` | **The packing rules.** Every item, when it's added, how many. Edit this to change lists. |
| `src/lib/store/` | Saved trips: building and refreshing lists, learning, backups |
| `src/lib/weather/` | City search, forecasts and the weather blurbs |
| `src/lib/group/` | Group trips: talking to Supabase and keeping lists in step |
| `src/lib/banner/` | The hand-drawn city banners and the live sky |
| `supabase/schema.sql` | The database setup for group trips (paste into Supabase's SQL editor) |
| `src/lib/places/facts.ts` | Plugs, currency and cash tips per country |
| `public/sw.js` | Offline support |
| `design/` | The brand kit and the clickable prototype |
| `docs/` | Packing rules table and product decisions |

## Commands

```bash
npm install        # once
npm run dev        # run the site at http://localhost:3000
npm test           # run the tests
npm run rules      # regenerate docs/packing-rules.md after editing rules.ts
```
