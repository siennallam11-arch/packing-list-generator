"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { use, useEffect, useMemo, useRef, useState } from "react";
import { browser } from "react-dom";
import { Calendar, type Range } from "@/components/Calendar";
import { Doodle } from "@/components/Doodle";
import { fmtDay, fmtRange } from "@/lib/format";
import { daysBetween, formatTripLength, tripLength } from "@/lib/packing/trip";
import { DEFAULT_QUIZ, type Activity, type QuizAnswers } from "@/lib/packing/types";
import { isInternational } from "@/lib/places/facts";
import { ACTIVITY_LABELS, ACTIVITY_ORDER, QUIZ } from "@/lib/quiz";
import { buildItems, refreshItems } from "@/lib/store/build";
import { learnFrom } from "@/lib/store/learning";
import { getTrip, loadHidden, loadTrips, newTripId, saveTrip, todayIso } from "@/lib/store/storage";
import type { SavedStop, SavedTrip } from "@/lib/store/types";
import { withWeather } from "@/lib/store/weather";
import { searchPlaces, type Place } from "@/lib/weather/openMeteo";

type Step = "cities" | "activities" | "quiz" | "packing";

interface Draft {
  id: string;
  destination: string;
  country?: string;
  countryCode?: string;
  latitude: number;
  longitude: number;
  startDate?: string;
  endDate?: string;
  existing?: SavedStop;
}

function initialState(params: URLSearchParams) {
  const editing = params.get("edit") ? getTrip(params.get("edit") as string) : undefined;
  if (editing) {
    return {
      editing,
      query: "",
      drafts: editing.stops.map((s): Draft => ({ ...s, existing: s })),
      activities: editing.activities,
      quiz: editing.quiz,
    };
  }
  const last = loadTrips().sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  return { editing: undefined, query: params.get("q") ?? "", drafts: [] as Draft[], activities: [] as Activity[], quiz: last?.quiz ?? DEFAULT_QUIZ };
}

export function NewTrip() {
  const params = useSearchParams();
  const key = `${params.get("edit") ?? ""}|${params.get("q") ?? ""}`;
  return <NewTripFlow key={key} params={new URLSearchParams(params.toString())} />;
}

function NewTripFlow({ params }: { params: URLSearchParams }) {
  use(browser("Trips are saved in this browser."));
  const router = useRouter();
  const [init] = useState(() => initialState(params));
  const { editing } = init;
  const today = todayIso();

  const [step, setStep] = useState<Step>("cities");
  const [query, setQuery] = useState(init.query);
  const [results, setResults] = useState<Place[]>([]);
  const [searchState, setSearchState] = useState<"idle" | "loading" | "error" | "none">("idle");
  const [drafts, setDrafts] = useState<Draft[]>(init.drafts);
  const [open, setOpen] = useState<number | null>(null);
  const [activities, setActivities] = useState<Activity[]>(init.activities);
  const [quiz, setQuiz] = useState<QuizAnswers>(init.quiz);
  const [chosen, setChosen] = useState<Record<string, string>>({});
  const [q, setQ] = useState(0);
  const nextId = useRef(init.drafts.length);

  // Look up places as you type.
  useEffect(() => {
    const text = query.trim();
    if (text.length < 2) return;
    let live = true;
    const t = setTimeout(() => {
      searchPlaces(text)
        .then((r) => {
          if (!live) return;
          setResults(r);
          setSearchState(r.length ? "idle" : "none");
        })
        .catch(() => live && setSearchState("error"));
    }, 250);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [query]);

  function typeQuery(value: string) {
    setQuery(value);
    if (value.trim().length >= 2) setSearchState("loading");
    else {
      setResults([]);
      setSearchState("idle");
    }
  }

  function addPlace(p: Place) {
    nextId.current += 1;
    const draft: Draft = {
      id: `s-${nextId.current}-${p.latitude.toFixed(2)}`,
      destination: p.name,
      country: p.country,
      countryCode: p.countryCode,
      latitude: p.latitude,
      longitude: p.longitude,
    };
    const prev = drafts[drafts.length - 1];
    if (prev?.endDate) draft.startDate = prev.endDate; // next city usually starts where the last one ends
    setDrafts([...drafts, draft]);
    typeQuery("");
    setOpen(drafts.length);
  }

  function setRange(i: number, r: Range) {
    setDrafts(drafts.map((d, j) => (j === i ? { ...d, startDate: r.start, endDate: r.end } : d)));
  }

  const missing = drafts.findIndex((d) => !d.startDate || !d.endDate);
  const ready = drafts.length > 0 && missing === -1;
  const whole = useMemo(() => {
    if (!ready) return null;
    const start = drafts.map((d) => d.startDate as string).sort()[0];
    const end = drafts.map((d) => d.endDate as string).sort().slice(-1)[0];
    const { nights, days } = tripLength(start, end);
    return `${fmtRange(start, end)} · ${formatTripLength(nights, days)}`;
  }, [drafts, ready]);

  const minDay = editing ? [today, ...drafts.map((d) => d.startDate ?? today)].sort()[0] : today;

  function goToQuiz() {
    // Your cities already answer "leaving the country?"
    setQuiz((cur) => ({ ...cur, international: isInternational(drafts.map((d) => d.countryCode)) }));
    setQ(0);
    setStep("quiz");
  }

  function answer(key: keyof QuizAnswers, label: string, value: QuizAnswers[keyof QuizAnswers]) {
    setQuiz({ ...quiz, [key]: value });
    setChosen({ ...chosen, [key]: label });
    setQ(q + 1);
  }

  async function pack() {
    setStep("packing");
    const started = Date.now();
    const stops: SavedStop[] = await Promise.all(
      drafts.map(async (d) => {
        const base: SavedStop = {
          id: d.id,
          destination: d.destination,
          country: d.country,
          countryCode: d.countryCode,
          latitude: d.latitude,
          longitude: d.longitude,
          startDate: d.startDate as string,
          endDate: d.endDate as string,
          weather: [],
        };
        const ex = d.existing;
        if (ex && ex.startDate === base.startDate && ex.endDate === base.endDate && ex.summary) return ex;
        try {
          return await withWeather(base, today);
        } catch {
          return base; // offline: the trip page tries again later
        }
      }),
    );
    const now = new Date().toISOString();
    const hidden = new Set(loadHidden().map((h) => h.ruleId));
    let trip: SavedTrip;
    if (editing) {
      trip = refreshItems({ ...editing, activities, quiz }, stops, now, hidden);
      if (trip.change && trip.change.at === now) trip.change = { ...trip.change, why: "You updated the trip, so the list changed a little." };
    } else {
      const learned = learnFrom(loadTrips());
      const { items, removedRuleIds } = buildItems({ stops, activities, quiz }, learned, hidden);
      trip = {
        v: 1, id: newTripId(), cover: "strawberry", stops, activities, quiz, items, removedRuleIds,
        dismissedSuggestions: [], createdAt: now, updatedAt: now,
      };
    }
    saveTrip(trip);
    const wait = Math.max(0, 1200 - (Date.now() - started));
    setTimeout(() => router.replace(`/trip?id=${trip.id}`), wait);
  }

  const stepNo = { cities: 1, activities: 2, quiz: 3, packing: 3 }[step];
  const back =
    step === "cities" ? (
      <Link className="back" href={editing ? `/trip?id=${editing.id}` : "/"}>‹ back</Link>
    ) : (
      <button type="button" className="back" style={{ background: "none", border: 0, cursor: "pointer" }} onClick={() => setStep(step === "quiz" ? "activities" : "cities")}>‹ back</button>
    );

  if (step === "packing") {
    return (
      <main className="page">
        <div className="center">
          <Doodle name="suitcase" size={140} className="bob" />
          <h1 className="h1" style={{ fontSize: 34 }}>{editing ? "updating your list…" : "packing your bag…"}</h1>
          <span className="cb-caption">Checking the weather in {drafts.map((d) => d.destination).join(" and ")}</span>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="topbar">
        {back}
        <span className="cb-label">Step {stepNo} of 3</span>
      </div>

      {step === "cities" && (
        <>
          <div className="stack">
            <label htmlFor="city" className="h1">{editing ? "Your cities" : "Where are you off to?"}</label>
            <input className="cb-input" id="city" value={query} onChange={(e) => typeQuery(e.target.value)} placeholder={drafts.length ? "Add another city" : "Type a city"} autoComplete="off" autoFocus={!editing} />
            {searchState === "loading" && <span className="cb-caption">Looking…</span>}
            {searchState === "error" && <span className="cb-caption danger">Couldn’t search right now. Check your connection and try again.</span>}
            {searchState === "none" && <span className="cb-caption">No places called “{query.trim()}”. Check the spelling?</span>}
            {results.length > 0 && (
              <div className="suggest">
                {results.map((p) => (
                  <button key={`${p.latitude},${p.longitude}`} type="button" onClick={() => addPlace(p)}>
                    <span>{p.name}</span>
                    <span className="cb-caption">{[p.region !== p.name ? p.region : null, p.country].filter(Boolean).join(", ")}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {drafts.length > 0 && (
            <div className="stack">
              <span className="cb-label">Your cities, in order</span>
              {drafts.map((d, i) => (
                <div key={d.id} className="stop-row">
                  <span className="n">{i + 1}</span>
                  <span className="city">{d.destination}</span>
                  <button type="button" className={`dates-btn${d.startDate && d.endDate ? "" : " missing"}`} onClick={() => setOpen(i)}>
                    {d.startDate && d.endDate ? `${fmtDay(d.startDate)} – ${fmtDay(d.endDate)}` : d.startDate ? `${fmtDay(d.startDate)} – ?` : "pick dates"}
                  </button>
                  <button type="button" className="icon-btn" aria-label={`Remove ${d.destination}`} onClick={() => setDrafts(drafts.filter((_, j) => j !== i))}>×</button>
                </div>
              ))}
              <p className="hand-note">each city gets its own dates, so we can check the weather in each one.</p>
            </div>
          )}

          <div className="bottom">
            {whole && <span className="cb-caption" style={{ textAlign: "center" }}>Whole trip: {whole}</span>}
            {ready ? (
              <button type="button" className="cb-btn" onClick={() => setStep("activities")}>Next: what are you up to?</button>
            ) : drafts.length > 0 ? (
              <button type="button" className="cb-btn" onClick={() => setOpen(missing)}>Pick dates for {drafts[missing].destination}</button>
            ) : null}
          </div>

          {open !== null && drafts[open] && (
            <>
              <button type="button" className="scrim" aria-label="Close the calendar" onClick={() => setOpen(null)} />
              <div className="sheet" role="dialog" aria-label={`Dates for ${drafts[open].destination}`}>
                <div className="sheet-head">
                  <b>{drafts[open].destination}</b>
                  <button type="button" className="cb-btn cb-btn--text" onClick={() => setOpen(null)}>Done</button>
                </div>
                <Calendar
                  value={{ start: drafts[open].startDate, end: drafts[open].endDate }}
                  onChange={(r) => setRange(open, r)}
                  others={drafts.filter((d, j) => j !== open && d.startDate && d.endDate).map((d) => ({ start: d.startDate as string, end: d.endDate as string }))}
                  min={minDay}
                />
                <span className="cb-cal-foot">
                  {drafts[open].startDate && drafts[open].endDate
                    ? (() => {
                        const s = drafts[open].startDate as string;
                        const e = drafts[open].endDate as string;
                        const n = daysBetween(s, e);
                        return `${drafts[open].destination} · ${fmtRange(s, e)} · ${n} ${n === 1 ? "night" : "nights"}`;
                      })()
                    : drafts.length > 1 ? "Your other cities are underlined." : " "}
                </span>
              </div>
            </>
          )}
        </>
      )}

      {step === "activities" && (
        <>
          <div className="stack" style={{ gap: 6 }}>
            <h1 className="h1">What are you up to?</h1>
            <span className="cb-caption">Tap everything that applies. You can change it later.</span>
          </div>
          <div className="chips">
            {ACTIVITY_ORDER.map((a) => (
              <button key={a} type="button" className="cb-opt" aria-pressed={activities.includes(a)} onClick={() => setActivities(activities.includes(a) ? activities.filter((x) => x !== a) : [...activities, a])}>
                {ACTIVITY_LABELS[a]}
              </button>
            ))}
          </div>
          <p className="hand-note">your activities help us plan for what you’ll actually be doing, so nothing’s missing and nothing’s extra.</p>
          <div className="bottom">
            <button type="button" className="cb-btn" onClick={goToQuiz}>Next: a few quick questions</button>
          </div>
        </>
      )}

      {step === "quiz" && (
        <>
          <div className="dots" aria-hidden="true">
            {QUIZ.map((_, i) => <span key={i} className={i < q ? "done" : i === q ? "here" : ""} />)}
          </div>
          {q < QUIZ.length ? (
            (() => {
              const cur = QUIZ[q];
              const selected = chosen[cur.key] ?? cur.options.find((o) => o.value === quiz[cur.key])?.label;
              return (
                <div className="cb-quiz" style={{ gap: 16 }}>
                  <span className="step">Question {q + 1} of {QUIZ.length}</span>
                  <p className="q" style={{ fontSize: 28 }}><Doodle name={cur.doodle} size={44} />{cur.question}</p>
                  <div className="cb-opts">
                    {cur.options.map((o) => (
                      <button key={o.label} type="button" className="cb-opt" aria-pressed={o.label === selected} onClick={() => answer(cur.key, o.label, o.value)}>
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="stack" style={{ justifyItems: "start" }}>
              <h1 className="h1" style={{ fontSize: 32 }}>That’s everything!</h1>
              <span className="cb-caption">We’ll remember your answers for next time.</span>
            </div>
          )}
          <div className="quiz-nav">
            <button type="button" className="arrow" aria-label="Previous question" disabled={q === 0} onClick={() => setQ(q - 1)}>←</button>
            {q < QUIZ.length && <span className="cb-caption">tap an answer, or use the arrows</span>}
            <button type="button" className="arrow" aria-label="Next question" disabled={q >= QUIZ.length} onClick={() => setQ(q + 1)}>→</button>
          </div>
          {q >= QUIZ.length && (
            <div className="bottom">
              <button type="button" className="cb-btn" onClick={pack}>{editing ? "Update my list" : "Pack my bag"}</button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
