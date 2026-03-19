-- Run this script in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.invitees (
    id uuid primary key,
    full_name text not null,
    display_name text,
    phone text,
    instagram text,
    max_pax integer not null default 2,
    is_active boolean not null default true,
    is_sent boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.rsvps (
    id uuid primary key default gen_random_uuid(),
    invitee_id uuid not null references public.invitees(id) on delete cascade,
    name text not null,
    pax integer not null,
    attendance text not null check (attendance in ('hadir', 'tidak-hadir')),
    submitted_at timestamptz not null default now()
);

create table if not exists public.wishes (
    id uuid primary key default gen_random_uuid(),
    invitee_id uuid not null references public.invitees(id) on delete cascade,
    name text not null,
    message text not null,
    is_approved boolean not null default true,
    submitted_at timestamptz not null default now()
);

create table if not exists public.gift_confirmations (
    id uuid primary key default gen_random_uuid(),
    invitee_id uuid not null references public.invitees(id) on delete cascade,
    sender_name text not null,
    transfer_amount numeric,
    submitted_at timestamptz not null default now()
);

alter table public.invitees enable row level security;
alter table public.rsvps enable row level security;
alter table public.wishes enable row level security;
alter table public.gift_confirmations enable row level security;

-- Public read on active invitees by UUID only is handled from server route.
-- Public insert permissions for forms.

do $$
begin
    if not exists (
        select 1 from pg_policies where schemaname = 'public' and tablename = 'rsvps' and policyname = 'Allow insert rsvps'
    ) then
        create policy "Allow insert rsvps" on public.rsvps
            for insert to anon, authenticated
            with check (true);
    end if;

    if not exists (
        select 1 from pg_policies where schemaname = 'public' and tablename = 'wishes' and policyname = 'Allow insert wishes'
    ) then
        create policy "Allow insert wishes" on public.wishes
            for insert to anon, authenticated
            with check (true);
    end if;

    if not exists (
        select 1 from pg_policies where schemaname = 'public' and tablename = 'wishes' and policyname = 'Allow select approved wishes'
    ) then
        create policy "Allow select approved wishes" on public.wishes
            for select to anon, authenticated
            using (is_approved = true);
    end if;

    if not exists (
        select 1 from pg_policies where schemaname = 'public' and tablename = 'gift_confirmations' and policyname = 'Allow insert gift confirmations'
    ) then
        create policy "Allow insert gift confirmations" on public.gift_confirmations
            for insert to anon, authenticated
            with check (true);
    end if;
end $$;

insert into public.invitees (id, full_name, display_name, max_pax, is_active)
values
    ('3f5ea228-a2db-4f57-8f12-6d4a3eb5e101', 'Bapak Ahmad Syafri', 'Bapak Ahmad', 2, true),
    ('4f6ad95a-c5b1-4d33-9c9f-d6d72e3af202', 'Ibu Rina Wulandari', 'Ibu Rina', 2, true),
    ('d77ee393-6f17-43f3-b786-5db39eacb303', 'Keluarga Fajar Nugroho', 'Keluarga Fajar', 4, true)
on conflict (id) do update
set
    full_name = excluded.full_name,
    display_name = excluded.display_name,
    max_pax = excluded.max_pax,
    is_active = excluded.is_active,
    updated_at = now();
