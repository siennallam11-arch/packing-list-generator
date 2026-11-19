// Backup links: the whole trip, compressed into the part of a link after "#".
// Nothing is uploaded anywhere; opening the link on another device restores the trip.

import type { SavedTrip } from "./types";

function toBase64Url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(text: string): Uint8Array {
  const b64 = text.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((text.length + 3) % 4);
  const s = atob(b64);
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Blob([bytes as BlobPart]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

/** "z" + compressed, or "p" + plain where the browser can't compress. */
export async function encodeTrip(trip: SavedTrip): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(trip));
  if (typeof CompressionStream !== "undefined") {
    return "z" + toBase64Url(await pipe(bytes, new CompressionStream("deflate-raw")));
  }
  return "p" + toBase64Url(bytes);
}

export async function decodeTrip(code: string): Promise<SavedTrip | null> {
  try {
    const kind = code[0];
    let bytes = fromBase64Url(code.slice(1));
    if (kind === "z") bytes = await pipe(bytes, new DecompressionStream("deflate-raw"));
    else if (kind !== "p") return null;
    const trip = JSON.parse(new TextDecoder().decode(bytes)) as SavedTrip;
    return trip && trip.v === 1 && Array.isArray(trip.stops) && Array.isArray(trip.items) ? trip : null;
  } catch {
    return null;
  }
}

export async function backupLink(trip: SavedTrip, origin: string): Promise<string> {
  return `${origin}/import#${await encodeTrip(trip)}`;
}
