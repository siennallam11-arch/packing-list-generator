-- Caboodle group trips. Paste this whole file into Supabase → SQL Editor → Run.
-- Safe to run again: it only creates what's missing and replaces the functions.
--
-- How access works:
--   * The tables are locked: nobody can read or write them directly.
--   * The app only talks to the functions below, and every function needs the trip's
--     secret share token (the random part of the invite link).
--   * Personal packing lists never come here. Only each person's name and packing
--     progress, plus the shared items ("who's bringing the speaker"), are stored.

create extension if not exists pgcrypto;

create table if not exists public.group_trips (
  id uuid primary key default gen_random_uuid(),
  token text not null unique check (char_length(token) >= 20),
  name text not null default '',
  stops jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.group_trips (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  packed integer not null default 0 check (packed >= 0),
  total integer not null default 0 check (total >= 0),
  joined_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists group_members_trip on public.group_members (trip_id);

create table if not exists public.group_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.group_trips (id) on delete cascade,
  rule_id text,
  name text not null check (char_length(name) between 1 and 80),
  category text not null default 'extras',
  claimed_by uuid references public.group_members (id) on delete set null,
  note text check (note is null or char_length(note) <= 140),
  note_by uuid references public.group_members (id) on delete set null,
  added_by uuid references public.group_members (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists group_items_trip on public.group_items (trip_id);
-- One of each suggested item per trip: this is what spots doubles.
create unique index if not exists group_items_one_rule on public.group_items (trip_id, rule_id) where rule_id is not null;

alter table public.group_trips enable row level security;
alter table public.group_members enable row level security;
alter table public.group_items enable row level security;
revoke all on public.group_trips, public.group_members, public.group_items from anon, authenticated;

-- ── Helpers ────────────────────────────────────────────────────────────────────

create or replace function public.caboodle_trip_id(p_token text) returns uuid
language sql stable security definer set search_path = public as $$
  select id from group_trips where token = p_token
$$;
revoke all on function public.caboodle_trip_id(text) from public, anon, authenticated;

-- Everything a member sees: the trip, everyone's name and progress, the shared items.
create or replace function public.caboodle_get(p_token text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  t group_trips;
begin
  select * into t from group_trips where token = p_token;
  if not found then return null; end if;
  return jsonb_build_object(
    'trip', jsonb_build_object('id', t.id, 'name', t.name, 'stops', t.stops, 'updatedAt', t.updated_at),
    'members', coalesce((select jsonb_agg(jsonb_build_object('id', m.id, 'name', m.name, 'packed', m.packed, 'total', m.total) order by m.joined_at)
                         from group_members m where m.trip_id = t.id), '[]'::jsonb),
    'items', coalesce((select jsonb_agg(jsonb_build_object('id', i.id, 'ruleId', i.rule_id, 'name', i.name, 'category', i.category,
                                                           'claimedBy', i.claimed_by, 'note', i.note, 'noteBy', i.note_by, 'addedBy', i.added_by) order by i.created_at)
                       from group_items i where i.trip_id = t.id), '[]'::jsonb)
  );
end $$;

-- Start sharing a trip. Returns the new member id for the person sharing it.
create or replace function public.caboodle_create(p_token text, p_name text, p_stops jsonb, p_member text) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_trip uuid;
  v_member uuid;
begin
  insert into group_trips (token, name, stops) values (p_token, left(coalesce(p_name, ''), 120), coalesce(p_stops, '[]'::jsonb))
  returning id into v_trip;
  insert into group_members (trip_id, name) values (v_trip, left(trim(p_member), 40)) returning id into v_member;
  return v_member;
end $$;

-- Keep the trip's cities and dates up to date (the person who shared it changed them).
create or replace function public.caboodle_update_trip(p_token text, p_name text, p_stops jsonb) returns void
language sql security definer set search_path = public as $$
  update group_trips set name = left(coalesce(p_name, name), 120), stops = coalesce(p_stops, stops), updated_at = now() where token = p_token
$$;

-- Join with a name. Returns the member id.
create or replace function public.caboodle_join(p_token text, p_member text) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_trip uuid := caboodle_trip_id(p_token);
  v_member uuid;
begin
  if v_trip is null then raise exception 'trip not found'; end if;
  if (select count(*) from group_members where trip_id = v_trip) >= 30 then raise exception 'trip is full'; end if;
  insert into group_members (trip_id, name) values (v_trip, left(trim(p_member), 40)) returning id into v_member;
  return v_member;
end $$;

create or replace function public.caboodle_progress(p_token text, p_member uuid, p_packed integer, p_total integer) returns void
language sql security definer set search_path = public as $$
  update group_members set packed = greatest(p_packed, 0), total = greatest(p_total, 0), updated_at = now()
  where id = p_member and trip_id = caboodle_trip_id(p_token)
$$;

create or replace function public.caboodle_leave(p_token text, p_member uuid) returns void
language sql security definer set search_path = public as $$
  delete from group_members where id = p_member and trip_id = caboodle_trip_id(p_token)
$$;

-- Add a shared item. Suggested items (with a rule id) are only added once per trip,
-- so two people with a hairdryer on their list end up with one shared hairdryer.
create or replace function public.caboodle_add_item(p_token text, p_member uuid, p_name text, p_category text, p_rule_id text) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_trip uuid := caboodle_trip_id(p_token);
  v_item uuid;
begin
  if v_trip is null then raise exception 'trip not found'; end if;
  if (select count(*) from group_items where trip_id = v_trip) >= 200 then raise exception 'too many items'; end if;
  if p_rule_id is not null then
    select id into v_item from group_items where trip_id = v_trip and rule_id = p_rule_id;
    if found then return v_item; end if;
  end if;
  insert into group_items (trip_id, rule_id, name, category, added_by)
  values (v_trip, p_rule_id, left(trim(p_name), 80), coalesce(p_category, 'extras'), p_member)
  returning id into v_item;
  return v_item;
end $$;

-- Claim an item ("I'll bring it"), or pass null to unclaim.
create or replace function public.caboodle_claim(p_token text, p_item uuid, p_member uuid) returns void
language sql security definer set search_path = public as $$
  update group_items set claimed_by = p_member where id = p_item and trip_id = caboodle_trip_id(p_token)
$$;

create or replace function public.caboodle_note(p_token text, p_item uuid, p_member uuid, p_note text) returns void
language sql security definer set search_path = public as $$
  update group_items set note = nullif(left(trim(coalesce(p_note, '')), 140), ''), note_by = p_member
  where id = p_item and trip_id = caboodle_trip_id(p_token)
$$;

create or replace function public.caboodle_remove_item(p_token text, p_item uuid) returns void
language sql security definer set search_path = public as $$
  delete from group_items where id = p_item and trip_id = caboodle_trip_id(p_token)
$$;

-- Only these functions are open to the app.
revoke all on function public.caboodle_get(text) from public;
revoke all on function public.caboodle_create(text, text, jsonb, text) from public;
revoke all on function public.caboodle_update_trip(text, text, jsonb) from public;
revoke all on function public.caboodle_join(text, text) from public;
revoke all on function public.caboodle_progress(text, uuid, integer, integer) from public;
revoke all on function public.caboodle_leave(text, uuid) from public;
revoke all on function public.caboodle_add_item(text, uuid, text, text, text) from public;
revoke all on function public.caboodle_claim(text, uuid, uuid) from public;
revoke all on function public.caboodle_note(text, uuid, uuid, text) from public;
revoke all on function public.caboodle_remove_item(text, uuid) from public;
grant execute on function
  public.caboodle_get(text),
  public.caboodle_create(text, text, jsonb, text),
  public.caboodle_update_trip(text, text, jsonb),
  public.caboodle_join(text, text),
  public.caboodle_progress(text, uuid, integer, integer),
  public.caboodle_leave(text, uuid),
  public.caboodle_add_item(text, uuid, text, text, text),
  public.caboodle_claim(text, uuid, uuid),
  public.caboodle_note(text, uuid, uuid, text),
  public.caboodle_remove_item(text, uuid)
to anon, authenticated;
