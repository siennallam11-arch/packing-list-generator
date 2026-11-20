"use client";

import { useState } from "react";
import { Doodle } from "@/components/Doodle";
import type { SavedTrip } from "@/lib/store/types";

interface Props {
  trip: SavedTrip;
  onStart: (name: string) => Promise<boolean>;
  onClose: () => void;
}

/** Invite friends: first your name, then a link to send them. */
export function InviteSheet({ trip, onStart, onClose }: Props) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const link = trip.group ? `${window.location.origin}/join#${trip.group.token}` : null;

  async function start(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    const ok = await onStart(name);
    setBusy(false);
    if (!ok) setError("Couldn’t create the invite. Check your connection and try again.");
  }

  async function copy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <>
      <button type="button" className="scrim" aria-label="Close" onClick={onClose} />
      <div className="sheet" role="dialog" aria-labelledby="invite-h">
        <div className="sheet-head">
          <span className="row" style={{ gap: 8 }}>
            <Doodle name="people" size={40} fill="var(--fill-green)" />
            <b id="invite-h">Invite your people</b>
          </span>
          <button type="button" className="cb-btn cb-btn--text" onClick={onClose}>Done</button>
        </div>

        {!link ? (
          <form className="stack" onSubmit={start}>
            <label htmlFor="your-name" className="cb-caption" style={{ color: "var(--ink)" }}>First, your name, so friends know who’s who:</label>
            <input id="your-name" className="cb-input" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="Your first name" autoFocus autoComplete="given-name" />
            <button type="submit" className="cb-btn" disabled={!name.trim() || busy}>{busy ? "Creating the link…" : "Create invite link"}</button>
            {error && <span className="cb-caption danger">{error}</span>}
          </form>
        ) : (
          <div className="stack">
            <p className="cb-caption" style={{ color: "var(--ink)", margin: 0 }}>Anyone with this link can join. They pick their name, answer the quick questions and get their own list.</p>
            <div className="row" style={{ border: "1.6px solid var(--ink)", borderRadius: "var(--radius-sm)", padding: "6px 6px 6px 12px" }}>
              <input className="grow" readOnly value={link} onFocus={(e) => e.currentTarget.select()} aria-label="Invite link" style={{ border: 0, background: "transparent", font: "400 13px/1.3 var(--font-type)", color: "var(--ink)" }} />
              <button type="button" className="cb-btn" style={{ minHeight: 36, padding: "8px 12px" }} onClick={copy}>{copied ? "Copied" : "Copy link"}</button>
            </div>
          </div>
        )}

        <div className="stack" style={{ gap: 6, background: "var(--paper)", borderRadius: "var(--radius-md)", padding: "12px 14px" }}>
          <span className="cb-label">What friends can see</span>
          <span className="cb-caption" style={{ color: "var(--ink)" }}>Your packing progress, and the shared stuff (who’s bringing the speaker, the hairdryer…).</span>
          <span className="cb-label" style={{ marginTop: 6 }}>What they can’t</span>
          <span className="cb-caption" style={{ color: "var(--ink)" }}>Your own list. Nobody sees what’s in your bag.</span>
        </div>
        <p className="hand-note" style={{ fontSize: 16 }}>only share it with people on the trip: anyone with the link can join and edit the shared stuff.</p>
      </div>
    </>
  );
}
