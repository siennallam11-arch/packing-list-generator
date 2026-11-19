"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { browser } from "react-dom";
import { Doodle, type DoodleName } from "@/components/Doodle";
import { Paint } from "@/components/Paint";
import { Toast, type ToastData } from "@/components/Toast";
import { fmtRange, tripTitle, weatherDoodle } from "@/lib/format";
import { formatTripLength, tripDates, tripLength } from "@/lib/packing/trip";
import { CATEGORY_LABELS, CATEGORY_ORDER, type Category } from "@/lib/packing/types";
import { describeFacts } from "@/lib/places/facts";
import { backupLink } from "@/lib/store/backup";
import { refreshItems } from "@/lib/store/build";
import { learnFrom, suggestionsFor } from "@/lib/store/learning";
import * as ops from "@/lib/store/ops";
import { deleteTrip, getTrip, loadTrips, saveTrip, todayIso } from "@/lib/store/storage";
import type { CoverColour, SavedItem, SavedTrip } from "@/lib/store/types";
import { refreshTripWeather } from "@/lib/store/weather";
import { describeWeather, formatRange } from "@/lib/weather/describe";

const CATEGORY_DOODLES: Record<Category, { name: DoodleName; fill: string }> = {
  documents: { name: "passport", fill: "var(--fill-pink)" },
  clothes: { name: "sock", fill: "var(--fill-green)" },
  toiletries: { name: "toothbrush", fill: "var(--fill-blue)" },
  tech: { name: "plug", fill: "var(--fill-robin)" },
  gear: { name: "backpack", fill: "var(--fill-tan)" },
  extras: { name: "bottle", fill: "var(--fill-blue)" },
};
const SCRIBBLES = ["M2 5C30 1.5 70 7.5 116 3.5", "M2 4C34 7.5 66 1.5 104 5", "M2 5C40 2 80 7 112 4"];

function Box() {
  return (
    <svg className="cb-box" viewBox="0 0 24 24" aria-hidden="true">
      <path className="edge" d="M5 6C9 4.6 15 5.2 19.4 5c.4 4-.2 9 .2 14-5.6.4-10.6-.2-15 .3.3-5.3.7-9.3.4-13.3z" />
      <path className="tick" d="M6 12.5l4.5 4.5L21 3" />
    </svg>
  );
}

export function Trip() {
  const id = useSearchParams().get("id") ?? "";
  return <TripView key={id} id={id} />;
}

function TripView({ id }: { id: string }) {
  use(browser("Trips are saved in this browser."));
  const router = useRouter();
  const [trip, setTrip] = useState<SavedTrip | undefined>(() => getTrip(id));
  const latest = useRef(trip);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [editing, setEditing] = useState(false);
  const [folded, setFolded] = useState<Partial<Record<Category, boolean>>>({});
  const [whyOpen, setWhyOpen] = useState<Record<string, boolean>>({});
  const [adding, setAdding] = useState<Partial<Record<Category, string>>>({});
  const [menu, setMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const [checking, setChecking] = useState(false);

  const commit = useCallback((next: SavedTrip, toastText?: string, undoable = true) => {
    const prev = latest.current;
    latest.current = next;
    saveTrip(next);
    setTrip(next);
    if (toastText) {
      setToast({
        id: Date.now(),
        text: toastText,
        onUndo: undoable && prev ? () => {
          latest.current = prev;
          saveTrip(prev);
          setTrip(prev);
        } : undefined,
      });
    }
  }, []);

  // Look up (or refresh) the weather. If it changed the list, a note explains what changed.
  useEffect(() => {
    const t = latest.current;
    if (!t) return;
    let live = true;
    setChecking(true);
    refreshTripWeather(t, todayIso())
      .then((fresh) => {
        if (!live || !fresh || !latest.current) return;
        commit(refreshItems(latest.current, fresh.stops, new Date().toISOString()));
      })
      .finally(() => live && setChecking(false));
    return () => {
      live = false;
    };
  }, [commit]);

  const learned = useMemo(() => learnFrom(loadTrips().filter((t) => t.id !== id)), [id]);

  // Celebrate when the last thing gets packed.
  const packed = trip ? ops.packedCount(trip) : 0;
  const total = trip?.items.length ?? 0;
  const wasComplete = useRef(total > 0 && packed === total);
  useEffect(() => {
    const complete = total > 0 && packed === total;
    if (complete && !wasComplete.current) setCelebrate(true);
    wasComplete.current = complete;
  }, [packed, total]);

  if (!trip) {
    return (
      <main className="page">
        <Link className="back" href="/">‹ trips</Link>
        <h1 className="h1">We can’t find this trip here</h1>
        <p className="cb-caption">Trips are saved in the browser they were made in. If you made it on another phone or computer, open its backup link here instead.</p>
        <Link className="cb-btn" href="/new" style={{ justifySelf: "start" }}>Start a new trip</Link>
      </main>
    );
  }

  const { startDate, endDate } = tripDates(trip.stops);
  const { nights, days } = tripLength(startDate, endDate);
  const pastSuggestions = suggestionsFor(trip, learned);

  async function copyBackup() {
    const link = await backupLink(latest.current as SavedTrip, window.location.origin);
    try {
      await navigator.clipboard.writeText(link);
      setCopied("Copied! Save it somewhere safe, like a note or an email to yourself.");
    } catch {
      setCopied(link);
    }
  }

  function addTo(category: Category) {
    const name = adding[category]?.trim();
    if (!name) return;
    commit(ops.addItem(trip as SavedTrip, name, category), `Added ${name}`);
    setAdding({ ...adding, [category]: "" });
  }

  const groups = CATEGORY_ORDER.map((category) => ({ category, items: trip.items.filter((i) => i.category === category) })).filter((g) => g.items.length > 0 || editing);

  return (
    <>
      <div className="trip-top">
        <Paint colour={trip.cover} className="paint" />
        <Link className="pill left" href="/">‹ trips</Link>
        <button type="button" className="pill right" onClick={() => setMenu(true)} aria-haspopup="dialog">Trip options</button>
        <div className="badge"><Doodle name="suitcase" size={46} /></div>
      </div>

      <main className="trip-wrap">
        <div className="trip-head">
          <h1 className="cb-trip-title" style={{ fontSize: "clamp(36px, 7vw, 52px)" }}>{tripTitle(trip.stops)}</h1>
          <div className="cb-trip-meta">{fmtRange(startDate, endDate)} · {formatTripLength(nights, days)}</div>
        </div>

        <div className="stops">
          {trip.stops.map((s) => {
            const facts = describeFacts(s.countryCode);
            return (
              <div key={s.id} className="cb-stop">
                <div className="cb-stop-head">
                  <Doodle name={weatherDoodle(s.weather)} size={26} />
                  <span className="city">{s.destination}</span>
                  <span className="when">
                    {fmtRange(s.startDate, s.endDate)}
                    {s.summary ? ` · ${formatRange(s.summary.low, s.summary.high)}` : ""}
                  </span>
                </div>
                <p className="cb-blurb">
                  {s.summary
                    ? describeWeather(s.summary)
                    : checking
                      ? "checking the weather…"
                      : "couldn’t get the weather yet. we’ll try again next time you open this with signal."}
                </p>
                {facts && <div className="facts">{facts}</div>}
              </div>
            );
          })}
        </div>

        {trip.change && (
          <div className="change" role="status">
            <p className="hand-note">{trip.change.why}</p>
            {trip.change.added.length > 0 && <p className="cb-caption" style={{ color: "var(--ink)" }}>Added: {trip.change.added.join(", ")}</p>}
            {trip.change.maybeNot.length > 0 && <p className="cb-caption" style={{ color: "var(--ink)" }}>You might not need: {trip.change.maybeNot.join(", ")} (marked below)</p>}
            <button type="button" className="cb-btn cb-btn--text" style={{ justifySelf: "start" }} onClick={() => commit(ops.dismissChange(trip), undefined, false)}>Got it</button>
          </div>
        )}

        <div className="cb-progress" style={{ maxWidth: 560 }}>
          <div className="cb-bar"><i style={{ width: `${total ? (packed / total) * 100 : 0}%` }} /></div>
          <span className="cb-count">{total > 0 && packed === total ? "all packed!" : `${packed} of ${total} packed`}</span>
        </div>

        <div className="toolbar">
          <span className="cb-caption">Tap things as they go in the bag.</span>
          <button type="button" className="cb-btn cb-btn--quiet" style={{ minHeight: 36, padding: "8px 12px" }} onClick={() => setEditing(!editing)} aria-pressed={editing}>
            {editing ? "Done editing" : "Edit list"}
          </button>
        </div>

        <div className="groups">
          {groups.map(({ category, items }, gi) => {
            const done = items.filter((i) => i.packed).length;
            const all = items.length > 0 && done === items.length;
            const isFolded = folded[category] ?? all;
            const d = CATEGORY_DOODLES[category];
            return (
              <section key={category} className="group">
                <button type="button" className={`cb-ghead${all ? " is-done" : ""}`} aria-expanded={!isFolded} onClick={() => setFolded({ ...folded, [category]: !isFolded })}>
                  <span className="tri">▼</span>
                  <Doodle name={d.name} fill={d.fill} size={36} />
                  <span>
                    <span className="h">The {CATEGORY_LABELS[category].toLowerCase()}</span>
                    <svg className="u" viewBox="0 0 118 9" aria-hidden="true"><path d={SCRIBBLES[gi % 3]} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" filter="url(#cb-wobble)" /></svg>
                  </span>
                  <span className="n">{all ? `${done}/${items.length} packed` : `${done}/${items.length}`}</span>
                </button>

                {!isFolded && (
                  <>
                    <ul className="cb-items">
                      {items.map((item) =>
                        editing ? (
                          <EditRow key={item.key} item={item} trip={trip} commit={commit} />
                        ) : (
                          <li key={item.key}>
                            <div className={`item-row${item.maybeNotNeeded ? " maybe-row" : ""}`}>
                              <button type="button" className="cb-item" aria-pressed={item.packed} onClick={() => commit(ops.togglePacked(trip, item.key))}>
                                <Box />
                                <span className="name">
                                  {item.name}
                                  {item.isNew && <span className="tag new">new</span>}
                                  {item.maybeNotNeeded && <span className="tag maybe">might not need</span>}
                                  {item.note && <span className="cb-note">{item.note}</span>}
                                  {item.travelNote && <span className="travel">{item.travelNote}</span>}
                                </span>
                                {item.quantity > 1 && (
                                  <>
                                    <span className="cb-lead" />
                                    <span className="cb-qty">×{item.quantity}</span>
                                  </>
                                )}
                              </button>
                              {item.reasons.length > 0 && (
                                <button type="button" className="why-btn" aria-expanded={!!whyOpen[item.key]} aria-label={`Why is ${item.name} on the list?`} onClick={() => setWhyOpen({ ...whyOpen, [item.key]: !whyOpen[item.key] })}>?</button>
                              )}
                              {item.maybeNotNeeded && (
                                <button type="button" className="icon-btn" aria-label={`Remove ${item.name}`} onClick={() => commit(ops.removeItem(trip, item.key), `Removed ${item.name}`)}>×</button>
                              )}
                            </div>
                            {whyOpen[item.key] && <p className="cb-why">because: {item.reasons.map((r) => r.toLowerCase()).join(", ")}</p>}
                          </li>
                        ),
                      )}
                    </ul>
                    <form className="add-row" onSubmit={(e) => { e.preventDefault(); addTo(category); }}>
                      <label className="visually-hidden" htmlFor={`add-${category}`}>Add to {CATEGORY_LABELS[category]}</label>
                      <input id={`add-${category}`} placeholder="+ add an item" value={adding[category] ?? ""} onChange={(e) => setAdding({ ...adding, [category]: e.target.value })} />
                      {adding[category]?.trim() && <button type="submit" className="cb-claim">Add</button>}
                    </form>
                  </>
                )}
              </section>
            );
          })}
        </div>

        {pastSuggestions.length > 0 && (
          <div className="past-suggest">
            <span className="cb-label">From your past trips</span>
            {pastSuggestions.slice(0, 4).map((s) => (
              <div key={s.name} className="row">
                <span className="grow">{s.name}</span>
                <button type="button" className="cb-claim" onClick={() => commit(ops.addItem(trip, s.name, s.category), `Added ${s.name}`)}>Add it</button>
                <button type="button" className="cb-btn cb-btn--text" style={{ fontWeight: 400, fontSize: 12 }} onClick={() => commit(ops.dismissSuggestion(trip, s.name), undefined, false)}>No thanks</button>
              </div>
            ))}
            <span className="hand-note">you added {pastSuggestions.length === 1 ? "this" : "these"} by hand on your last few trips.</span>
          </div>
        )}
      </main>

      {menu && (
        <>
          <button type="button" className="scrim" aria-label="Close" onClick={() => { setMenu(false); setConfirmDelete(false); setCopied(null); }} />
          <div className="sheet" role="dialog" aria-label="Trip options">
            <div className="sheet-head">
              <b>Trip options</b>
              <button type="button" className="cb-btn cb-btn--text" onClick={() => { setMenu(false); setConfirmDelete(false); setCopied(null); }}>Done</button>
            </div>
            <span className="cb-label">Cover colour</span>
            <div className="row">
              {(["strawberry", "matcha", "hojicha"] as CoverColour[]).map((c) => (
                <button key={c} type="button" className="cb-opt" aria-pressed={trip.cover === c} onClick={() => commit(ops.setCover(trip, c), undefined, false)} style={{ display: "grid", gap: 6, padding: 8, minWidth: 96 }}>
                  <Paint colour={c} style={{ width: "100%", height: 28, display: "block" }} />
                  <span className="cb-caption" style={{ color: "var(--ink)" }}>{c}</span>
                </button>
              ))}
            </div>
            <Link className="cb-btn cb-btn--quiet" href={`/new?edit=${trip.id}`}>Change cities, dates or answers</Link>
            <button type="button" className="cb-btn cb-btn--quiet" onClick={copyBackup}>Copy backup link</button>
            {copied && (copied.startsWith("http") ? (
              <div className="stack" style={{ gap: 4 }}>
                <span className="cb-caption">Copy this link and save it somewhere safe:</span>
                <input className="cb-input" readOnly value={copied} onFocus={(e) => e.currentTarget.select()} aria-label="Backup link" />
              </div>
            ) : <span className="cb-caption">{copied}</span>)}
            <span className="cb-caption">The backup link holds the whole trip. Open it on another phone or computer to bring the trip there.</span>
            {confirmDelete ? (
              <div className="row">
                <span className="grow cb-caption">Delete {tripTitle(trip.stops)} from this browser?</span>
                <button type="button" className="cb-btn" onClick={() => { deleteTrip(trip.id); router.push("/"); }}>Delete</button>
                <button type="button" className="cb-btn cb-btn--text" onClick={() => setConfirmDelete(false)}>Keep it</button>
              </div>
            ) : (
              <button type="button" className="cb-btn cb-btn--text danger" style={{ justifySelf: "start" }} onClick={() => setConfirmDelete(true)}>Delete this trip</button>
            )}
          </div>
        </>
      )}

      {celebrate && (
        <div className="celebrate" role="dialog" aria-label="All packed">
          <Doodle name="suitcase" size={160} fill="var(--fill-green)" className="wiggle" />
          <h2>all packed!</h2>
          <p className="hand-note" style={{ fontSize: 20 }}>see you in {trip.stops[0].destination}. have the best time.</p>
          <button type="button" className="cb-btn" onClick={() => setCelebrate(false)}>Back to my list</button>
        </div>
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}

function EditRow({ item, trip, commit }: { item: SavedItem; trip: SavedTrip; commit: (t: SavedTrip, text?: string) => void }) {
  const [name, setName] = useState(item.name);
  return (
    <li className="edit-row">
      <label className="visually-hidden" htmlFor={`name-${item.key}`}>Item name</label>
      <input
        id={`name-${item.key}`}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => name.trim() && name.trim() !== item.name && commit(ops.renameItem(trip, item.key, name), `Renamed to ${name.trim()}`)}
      />
      <span className="stepper">
        <button type="button" aria-label={`Fewer ${item.name}`} onClick={() => commit(ops.setQuantity(trip, item.key, item.quantity - 1))} disabled={item.quantity <= 1}>−</button>
        <span>{item.quantity}</span>
        <button type="button" aria-label={`More ${item.name}`} onClick={() => commit(ops.setQuantity(trip, item.key, item.quantity + 1))}>+</button>
      </span>
      <button type="button" className="icon-btn" aria-label={`Remove ${item.name}`} onClick={() => commit(ops.removeItem(trip, item.key), `Removed ${item.name}`)}>×</button>
    </li>
  );
}
