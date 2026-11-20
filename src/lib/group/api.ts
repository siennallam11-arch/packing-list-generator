// Talks to the Supabase database for group trips (see supabase/schema.sql).
// Every call carries the trip's secret token; personal lists never leave the device.

import { createClient, type RealtimeChannel, type SupabaseClient } from "@supabase/supabase-js";
import type { Category } from "../packing/types";
import type { SavedStop } from "../store/types";

// Public by design: the publishable key only allows calling the token-checked functions.
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wzkcmrjzwmaiajlvioqj.supabase.co";
const KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY || "sb_publishable_bTku6c4iuWKKzIiekqHmSw_C7HqTo48";

/** The parts of a city everyone on the trip shares (no weather: each device looks that up). */
export type GroupStop = Pick<
  SavedStop,
  "id" | "destination" | "country" | "countryCode" | "latitude" | "longitude" | "timezone" | "population" | "elevation" | "startDate" | "endDate"
>;

export interface GroupMember {
  id: string;
  name: string;
  packed: number;
  total: number;
}

export interface GroupItem {
  id: string;
  ruleId: string | null;
  name: string;
  category: Category;
  claimedBy: string | null;
  note: string | null;
  noteBy: string | null;
  addedBy: string | null;
}

export interface GroupData {
  trip: { id: string; name: string; stops: GroupStop[]; updatedAt: string };
  members: GroupMember[];
  items: GroupItem[];
}

let client: SupabaseClient | null = null;
function db(): SupabaseClient {
  client ??= createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await db().rpc(fn, args);
  if (error) throw new Error(error.message);
  return data as T;
}

/** A long random code: the secret part of the invite link. */
export function newToken(): string {
  const chars = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

export function toGroupStops(stops: SavedStop[]): GroupStop[] {
  return stops.map(({ id, destination, country, countryCode, latitude, longitude, timezone, population, elevation, startDate, endDate }) => ({
    id, destination, country, countryCode, latitude, longitude, timezone, population, elevation, startDate, endDate,
  }));
}

export const groupApi = {
  get: (token: string) => rpc<GroupData | null>("caboodle_get", { p_token: token }),
  create: (token: string, name: string, stops: GroupStop[], member: string) =>
    rpc<string>("caboodle_create", { p_token: token, p_name: name, p_stops: stops, p_member: member }),
  updateTrip: (token: string, name: string, stops: GroupStop[]) => rpc<void>("caboodle_update_trip", { p_token: token, p_name: name, p_stops: stops }),
  join: (token: string, member: string) => rpc<string>("caboodle_join", { p_token: token, p_member: member }),
  progress: (token: string, member: string, packed: number, total: number) =>
    rpc<void>("caboodle_progress", { p_token: token, p_member: member, p_packed: packed, p_total: total }),
  leave: (token: string, member: string) => rpc<void>("caboodle_leave", { p_token: token, p_member: member }),
  addItem: (token: string, member: string, name: string, category: Category, ruleId: string | null) =>
    rpc<string>("caboodle_add_item", { p_token: token, p_member: member, p_name: name, p_category: category, p_rule_id: ruleId }),
  claim: (token: string, item: string, member: string | null) => rpc<void>("caboodle_claim", { p_token: token, p_item: item, p_member: member }),
  note: (token: string, item: string, member: string, note: string) => rpc<void>("caboodle_note", { p_token: token, p_item: item, p_member: member, p_note: note }),
  removeItem: (token: string, item: string) => rpc<void>("caboodle_remove_item", { p_token: token, p_item: item }),
};

/**
 * Live updates: everyone on the trip listens on a channel named after the secret token.
 * After any change, a device sends a "changed" ping and the others reload the trip.
 */
const channels = new Map<string, RealtimeChannel>();

export function listen(token: string, onChange: () => void): () => void {
  const ch = db().channel(`caboodle-${token}`, { config: { broadcast: { self: false } } });
  ch.on("broadcast", { event: "changed" }, () => onChange()).subscribe();
  channels.set(token, ch);
  return () => {
    channels.delete(token);
    db().removeChannel(ch);
  };
}

export function ping(token: string): void {
  channels.get(token)?.send({ type: "broadcast", event: "changed", payload: {} }).catch(() => {});
}
