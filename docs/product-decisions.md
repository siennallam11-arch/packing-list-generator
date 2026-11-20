# Product decisions

A running log of what we decided and why. Newest at the bottom.

## Basics
- **Name:** Caboodle.
- **Platform:** a website that works well on phones. Hosted on Vercel, code on GitHub.
- **Audience:** family and friends. Personal project.
- **List logic:** hand-written rules (`src/lib/packing/rules.ts`), no AI.
- **Weather:** Open-Meteo (free, no key). Within ~2 weeks: the real forecast. Further out: the
  same dates last year, labelled as such, until the forecast arrives.
- **Temperatures in Fahrenheit.**
- **Reminders:** left out.

## Brand direction
- **Approved: B's look in C's structure**: handwritten headings, typewriter items with dotted
  leaders, matcha / hojicha / strawberry colours, lots of white; laid out with a painted cover per trip,
  a progress bar and foldable categories.
- Doodles are drawn in code. **No emoji.**

## Starting a trip
- Type the city, with **"+ add another city"** for multi-city trips.
- **Each city gets its own dates** from a calendar that **pops up on the same screen** (like a flight
  booking site) when you tap "pick dates", because each city has its own weather. Show nights and days for the whole trip.
- Under each city: its dates, temperature range and a **short weather blurb**
  ("Chilly, with highs around 52°F and lows near 37°F. Rain likely on one day…").
- The packing list covers every city's weather (Kyoto freezing → gloves, Tokyo rain → umbrella).
- Quantities are only shown when more than 1 (no "Passport ×1").
- Then activities (tap chips), then the quiz (one card per question, every question skippable,
  answers prefilled from your last trip, without a "last time you said" note).

## Group trips
- Joining is by magic link; first visit asks "Who are you?". No passwords.
- **Personal lists are private.** Others see only your **progress** and the **shared items**
  (who claimed what), never your personal items or quantities.

## History
- For now, trips are remembered in the browser you made them in, plus each trip's link.
- **Later:** a "My trips" page with past trips. Needs a simple sign-in (e.g. email login link).

## Learning from past trips
- Learn from edits: items you keep removing stop being suggested; quantity changes you repeat
  become the new default; items you keep adding get suggested.
- **No post-trip check-in.** Learning comes from edits only.
- Learned items appear as **suggestions** in a "From your past trips" section with a reason, never
  added silently.
- Until sign-in exists, learning lives in one browser; sign-in later makes it follow you.

## Version 1 extras (decided)
- **Works offline** and installs to the home screen.
- **"What changed" notes**: when a new forecast changes the list, new items are marked "new" and
  items you may not need are marked (never silently removed), with a note explaining why.
- **Spot doubles in a group** (version 2, with group trips).
- **Destination facts** under each city: plugs, currency, cash tips. Home is assumed to be the US.
- **Airline reminders** on specific items ("Can't go in checked bags"), without assigning bags.
- **Undo** after removing, adding, renaming or changing quantities.
- **Backup links** that carry the whole trip, until sign-in exists.

## Round 2 feedback (decided)
- **Home is simple:** big centered "caboodle" with the logo, tagline "packing, sorted.", a short
  description and why it was made, one "Start a trip" button, and your trips listed underneath.
- **Quiz has ← → arrows** to go back and change an answer; tapping an answer still moves on.
- **No "Leaving the country?" question:** the cities answer it.
- **Checklist:** no "Tap things…" line, no "?" buttons; liquid toiletries show the 3.4 fl oz
  carry-on limit in pink.
- **On computers:** trip details in a column on the left, the list in two columns on the right.
- **Cover colours** are shown as swatches only, with no names.

## Round 3 feedback (decided)
- **Trip page:** the trip header (title, cities, weather, progress) spans the full width; the
  list starts underneath in columns (1 on phones, 2 on tablets, 3 on computers).
- **Airline reminders are short, pink and in brackets** after the name: "Toothpaste (3.4 fl oz)".
- **Removing an item is one tap (×)** and it stays off future trips too. "Left off all your lists"
  at the bottom of a trip lets you bring any of them back. Undo works right after removing.

## City banners (decided)
- The plain painted cover is replaced by a **hand-drawn banner of the city**, in the doodle style.
- **The sky follows the city's local time right now** (dawn, day, dusk, night with stars), with
  the sun or moon placed where it really is, and the **current weather** (clouds, rain, snow, fog, storms).
- **~50 major cities have hand-drawn landmarks** (`src/lib/banner/landmarks.ts`); every other city
  gets its own consistent skyline sized by population, with mountains for high places.
- Multi-city trips: the banner shows the city you're in today (or the first), and the label
  ("Tokyo · 8:25 am ›") switches between cities.
- Cover colour choice removed (the banner replaces it). Home shows a small banner per trip.

## Group trips (built)
- Database: Supabase (`supabase/schema.sql`). Tables are locked; the app only calls functions
  that need the trip's secret token (the random part of the invite link).
- **Personal lists never leave the device.** Only names, packing progress (numbers) and the
  shared items are stored online.
- "Invite friends" asks for your name, then gives a link (`/join#…`). Friends pick their name
  (or tap it if they joined on another phone), answer the quiz, and get their own list.
- Shareable items (hairdryer, speaker, toiletries…) move from everyone's own list to one
  **shared list**; the same item is only added once (**doubles are spotted**, by suggestion or name).
- "I'll bring it" claims an item, and it then appears on your own list as "for everyone".
  Short notes per item. Everyone's progress shows as percentages only.
- Live updates via a broadcast channel named after the secret token, plus a check every 30 seconds.
- Changing cities or dates updates everyone's trip. "Leave the group trip" puts shared items back.

## Open questions
- None right now.
