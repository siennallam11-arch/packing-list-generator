# Product decisions

A running log of what we decided and why. Newest at the bottom.

## Basics
- **Name:** Caboodle.
- **Platform:** a website that works well on phones. Hosted on Vercel, code on GitHub.
- **Audience:** family and friends. Personal project.
- **List logic:** hand-written rules (`src/lib/packing/rules.ts`), no AI.
- **Weather:** Open-Meteo (free, no key). Forecasts reach ~2 weeks out; further-out trips ask "what's it usually like?" until the forecast arrives.
- **Reminders:** left out.

## Brand direction
- Leaning towards **B's look in C's structure**: handwritten headings, typewriter items with dotted
  leaders, matcha / hojicha / strawberry colours, lots of white; laid out with a painted cover per trip,
  a progress bar and foldable categories.
- Doodles are drawn in code. **No emoji.**

## Starting a trip
- Type the city, with **"+ add another city"** for multi-city trips.
- Pick dates from a **simple calendar** (tap start, tap end). Show nights and days.
- Then activities (tap chips), then the quiz (one card per question, every question skippable,
  answers prefilled from your last trip).

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
- **Post-trip check-in** (proposed): "Anything you didn't use?" / "Anything you wished you'd brought?"
- Learned items appear as **suggestions** in a "From your past trips" section with a reason, never
  added silently.
- Until sign-in exists, learning lives in one browser; sign-in later makes it follow you.

## Open questions
- Multi-city: one date range for the whole trip, or dates per city?
- Keep the post-trip check-in?
- Final "go" on the brand direction.
