"use client";

import { useState } from "react";
import { addDays, daysBetween, toIsoDate } from "@/lib/packing/trip";

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export interface Range {
  start?: string;
  end?: string;
}

interface Props {
  value: Range;
  onChange: (range: Range) => void;
  /** Other cities' dates, underlined so you can see how they fit together. */
  others?: { start: string; end: string }[];
  /** Earliest pickable day. */
  min: string;
}

function monthStart(iso: string) {
  return iso.slice(0, 8) + "01";
}

function shiftMonth(first: string, by: number) {
  const [y, m] = first.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + by, 1));
  return toIsoDate(d);
}

/** Tap a start day, then an end day. Weeks start on Monday. */
export function Calendar({ value, onChange, others = [], min }: Props) {
  const [month, setMonth] = useState(() => monthStart(value.start ?? min));
  const [y, m] = month.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const lead = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;

  function pick(day: string) {
    if (!value.start || value.end || daysBetween(value.start, day) < 0) onChange({ start: day });
    else onChange({ start: value.start, end: day });
  }

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < lead; i++) cells.push(<span key={`lead-${i}`} />);
  for (let d = 1; d <= daysInMonth; d++) {
    const day = `${month.slice(0, 8)}${String(d).padStart(2, "0")}`;
    const disabled = daysBetween(min, day) < 0;
    let cls = "cb-day";
    if (day === value.start) cls += " start";
    else if (day === value.end) cls += " end";
    else if (value.start && value.end && daysBetween(value.start, day) > 0 && daysBetween(day, value.end) > 0) cls += " in-range";
    else if (others.some((o) => daysBetween(o.start, day) >= 0 && daysBetween(day, o.end) >= 0)) cls += " other";
    if (disabled) cls += " out";
    cells.push(
      <button key={day} type="button" className={cls} disabled={disabled} aria-pressed={day === value.start || day === value.end} aria-label={`${MONTH_NAMES[m - 1]} ${d}`} onClick={() => pick(day)}>
        {d}
      </button>,
    );
  }

  const canGoBack = daysBetween(min, addDays(month, -1)) >= 0;
  return (
    <div className="cb-cal">
      <div className="cb-cal-head">
        <button type="button" className="cal-nav" onClick={() => setMonth(shiftMonth(month, -1))} disabled={!canGoBack} aria-label="Previous month">‹</button>
        <b>{MONTH_NAMES[m - 1]} {y}</b>
        <button type="button" className="cal-nav" onClick={() => setMonth(shiftMonth(month, 1))} aria-label="Next month">›</button>
      </div>
      <div className="cb-cal-grid">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <span key={i} className="dow">{d}</span>
        ))}
        {cells}
      </div>
    </div>
  );
}
