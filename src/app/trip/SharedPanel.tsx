"use client";

import { useState } from "react";
import { Doodle } from "@/components/Doodle";
import type { GroupData, GroupItem } from "@/lib/group/api";
import type { GroupStatus } from "./useGroup";

const AVATAR = ["var(--strawberry)", "var(--matcha)", "var(--hojicha)", "var(--fill-robin)", "var(--fill-pink)", "var(--fill-tan)"];

interface Props {
  data: GroupData | null;
  status: GroupStatus;
  memberId?: string;
  onClaim: (item: GroupItem, mine: boolean) => void;
  onNote: (item: GroupItem, text: string) => void;
  onRemove: (item: GroupItem) => void;
  onAdd: (name: string) => Promise<"added" | "double" | "failed">;
  onInvite: () => void;
}

/** "The shared stuff": who's bringing what, short notes, and everyone's progress. */
export function SharedPanel({ data, status, memberId, onClaim, onNote, onRemove, onAdd, onInvite }: Props) {
  const [adding, setAdding] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [noting, setNoting] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  if (status === "gone") {
    return (
      <section className="shared-panel">
        <p className="cb-caption">This group trip isn’t available any more. Your own list is still here.</p>
      </section>
    );
  }
  if (!data) {
    return (
      <section className="shared-panel" aria-busy="true">
        <p className="cb-caption">{status === "offline" ? "You’re offline. The shared list will show up when you’re back online." : "Loading the shared stuff…"}</p>
      </section>
    );
  }

  const nameOf = (id: string | null) => (id === memberId ? "you" : data.members.find((m) => m.id === id)?.name ?? "someone");
  const colourOf = (id: string | null) => AVATAR[Math.max(0, data.members.findIndex((m) => m.id === id)) % AVATAR.length];
  const claimed = data.items.filter((i) => i.claimedBy).length;
  const offline = status === "offline";

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const result = await onAdd(adding);
    if (result === "double") setMessage(`“${adding.trim()}” is already on the shared list.`);
    else if (result === "failed") setMessage("Couldn’t add that. Check your connection.");
    else {
      setMessage(null);
      setAdding("");
    }
  }

  return (
    <section className="shared-panel" aria-labelledby="shared-h">
      <div className="row" style={{ gap: 10 }}>
        <Doodle name="people" size={44} fill="var(--fill-green)" />
        <div className="grow" style={{ display: "grid", gap: 2 }}>
          <h2 id="shared-h" className="h1" style={{ fontSize: 28 }}>The shared stuff</h2>
          <span className="cb-caption">
            {data.items.length ? `${claimed} of ${data.items.length} claimed` : "Nothing yet"} · {data.members.length} {data.members.length === 1 ? "person" : "people"} on this trip
          </span>
        </div>
        <button type="button" className="cb-btn cb-btn--quiet" style={{ minHeight: 36, padding: "8px 12px" }} onClick={onInvite}>Invite</button>
      </div>
      {offline && <p className="cb-caption danger">You’re offline. Showing the last saved version.</p>}

      <ul className="shared-items">
        {data.items.map((item) => (
          <li key={item.id}>
            <div className="shared-row">
              <span className="grow">{item.name}</span>
              {item.claimedBy === memberId ? (
                <button type="button" className="cb-claimed as-btn" onClick={() => onClaim(item, false)} disabled={offline} aria-label={`You're bringing ${item.name}. Tap to unclaim`}>
                  <span className="cb-avatar" style={{ background: colourOf(memberId ?? null) }}>✓</span>you
                </button>
              ) : item.claimedBy ? (
                <span className="cb-claimed"><span className="cb-avatar" style={{ background: colourOf(item.claimedBy) }}>{nameOf(item.claimedBy)[0]?.toUpperCase()}</span>{nameOf(item.claimedBy)}’s got it</span>
              ) : (
                <button type="button" className="cb-claim" onClick={() => onClaim(item, true)} disabled={offline}>I’ll bring it</button>
              )}
              <button type="button" className="icon-btn remove-x" aria-label={`Note on ${item.name}`} onClick={() => { setNoting(item.id); setNoteText(item.note ?? ""); }} disabled={offline}>✎</button>
              <button type="button" className="icon-btn remove-x" aria-label={`Remove ${item.name} from the shared list`} onClick={() => onRemove(item)} disabled={offline}>×</button>
            </div>
            {noting === item.id ? (
              <form className="add-row" onSubmit={(e) => { e.preventDefault(); onNote(item, noteText); setNoting(null); }}>
                <label className="visually-hidden" htmlFor={`note-${item.id}`}>Note on {item.name}</label>
                <input id={`note-${item.id}`} autoFocus maxLength={140} placeholder="e.g. I have a travel one!" value={noteText} onChange={(e) => setNoteText(e.target.value)} />
                <button type="submit" className="cb-claim">Save</button>
              </form>
            ) : (
              item.note && <p className="shared-note">{nameOf(item.noteBy)}: {item.note}</p>
            )}
          </li>
        ))}
      </ul>

      <form className="add-row" onSubmit={add}>
        <label className="visually-hidden" htmlFor="add-shared">Add something for everyone</label>
        <input id="add-shared" placeholder="+ add something for everyone" value={adding} onChange={(e) => setAdding(e.target.value)} disabled={offline} />
        {adding.trim() && <button type="submit" className="cb-claim">Add</button>}
      </form>
      {message && <p className="cb-caption">{message}</p>}

      <div className="stack" style={{ gap: 8, marginTop: 6 }}>
        <span className="cb-label">Everyone’s progress</span>
        {data.members.map((m) => {
          const pct = m.total ? Math.round((m.packed / m.total) * 100) : 0;
          return (
            <div key={m.id} className="cb-friend">
              <span className="cb-avatar" style={{ background: colourOf(m.id) }}>{m.name[0]?.toUpperCase()}</span>
              <div className="cb-bar"><i style={{ width: `${pct}%` }} /></div>
              <span className="cb-caption">{m.id === memberId ? "you" : m.name} · {m.total ? `${pct}%` : "not started"}</span>
            </div>
          );
        })}
        <span className="hand-note" style={{ fontSize: 16, color: "var(--ink-soft)" }}>just percentages. everyone’s own list stays private.</span>
      </div>
    </section>
  );
}
