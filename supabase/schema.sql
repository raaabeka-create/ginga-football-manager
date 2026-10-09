-- Ginga FM manager authentication and profile setup
-- Run this complete script in Supabase Dashboard > SQL Editor.
-- This script expects the existing public.clubs table to contain id, name, and city columns.

create table if not exists public.manager_profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    manager_username text not null,
    manager_name text not null,
    nationality text not null default 'Ghanaian',
    club_id text null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint manager_profiles_username_format
        check (manager_username ~ '^[A-Za-z0-9_]{3,20}$'),
    constraint manager_profiles_name_check
        check (char_length(btrim(manager_name)) between 2 and 80),
    constraint manager_profiles_nationality_check
        check (char_length(btrim(nationality)) between 2 and 60)
);

create unique index if not exists manager_profiles_manager_username_lower_uidx
    on public.manager_profiles (lower(manager_username));

-- A club can only be assigned to one manager. NULL means the manager has not
-- completed club selection yet (for example, while confirming their email).
create unique index if not exists manager_profiles_club_id_uidx
    on public.manager_profiles (club_id)
    where club_id is not null;

-- One persistent career slot per manager account.
create table if not exists public.manager_careers (
    manager_id uuid primary key references public.manager_profiles(id) on delete cascade,
    club_id text not null,
    season integer not null default 1 check (season >= 1),
    career_state jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.manager_careers enable row level security;
revoke all on table public.manager_careers from anon, authenticated;
grant select on table public.manager_careers to authenticated;

drop policy if exists "Managers can read their own career" on public.manager_careers;
create policy "Managers can read their own career"
    on public.manager_careers
    for select
    to authenticated
    using (manager_id = (select auth.uid()));

alter table public.manager_profiles enable row level security;

drop policy if exists "Managers can read their own profile" on public.manager_profiles;
create policy "Managers can read their own profile"
    on public.manager_profiles
    for select
    to authenticated
    using (id = (select auth.uid()));

revoke all on table public.manager_profiles from anon, authenticated;
grant select on table public.manager_profiles to authenticated;

create or replace function public.create_manager_profile_on_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_username text;
    v_name text;
    v_nationality text;
begin
    v_username := nullif(btrim(new.raw_user_meta_data ->> 'manager_username'), '');
    v_name := nullif(btrim(new.raw_user_meta_data ->> 'manager_name'), '');
    v_nationality := coalesce(nullif(btrim(new.raw_user_meta_data ->> 'nationality'), ''), 'Ghanaian');

    -- Users created outside the Ginga FM registration form are not silently
    -- given fabricated manager identities.
    if v_username is null or v_name is null then
        return new;
    end if;

    if v_username !~ '^[A-Za-z0-9_]{3,20}$' then
        raise exception 'Manager username must be 3-20 letters, numbers, or underscores.';
    end if;

    if char_length(v_name) < 2 or char_length(v_name) > 80 then
        raise exception 'Manager name must be between 2 and 80 characters.';
    end if;

    if char_length(v_nationality) < 2 or char_length(v_nationality) > 60 then
        raise exception 'Nationality must be between 2 and 60 characters.';
    end if;

    insert into public.manager_profiles (id, manager_username, manager_name, nationality)
    values (new.id, v_username, v_name, v_nationality);

    return new;
end;
$$;

drop trigger if exists on_auth_user_created_manager_profile on auth.users;
create trigger on_auth_user_created_manager_profile
    after insert on auth.users
    for each row
    execute function public.create_manager_profile_on_signup();

create or replace function public.get_available_clubs()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
    select coalesce(
        jsonb_agg(
            jsonb_build_object(
                'id', c.id::text,
                'name', c.name,
                'city', c.city
            )
            order by c.name
        ),
        '[]'::jsonb
    )
    from public.clubs as c
    where not exists (
        select 1
        from public.manager_profiles as p
        where p.club_id = c.id::text
    );
$$;

create or replace function public.get_my_manager_profile()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
    v_profile jsonb;
begin
    if auth.uid() is null then
        return null;
    end if;

    select jsonb_build_object(
        'id', p.id,
        'manager_username', p.manager_username,
        'manager_name', p.manager_name,
        'nationality', p.nationality,
        'club_id', p.club_id,
        'club_name', c.name,
        'club_city', c.city,
        'created_at', p.created_at
    )
    into v_profile
    from public.manager_profiles as p
    left join public.clubs as c on c.id::text = p.club_id
    where p.id = auth.uid();

    return v_profile;
end;
$$;

create or replace function public.claim_manager_club(p_club_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_current_club_id text;
begin
    if auth.uid() is null then
        raise exception 'You must be signed in to choose a club.';
    end if;

    select club_id
    into v_current_club_id
    from public.manager_profiles
    where id = auth.uid();

    if not found then
        raise exception 'Manager profile not found. Please register through Ginga FM.';
    end if;

    if v_current_club_id is not null then
        raise exception 'This account already has a club and career.';
    end if;

    if p_club_id is null or not exists (
        select 1 from public.clubs where id::text = p_club_id
    ) then
        raise exception 'That club does not exist.';
    end if;

    if exists (
        select 1 from public.manager_profiles where club_id = p_club_id
    ) then
        raise exception 'That club has already been claimed. Please choose another.';
    end if;

    begin
        update public.manager_profiles
        set club_id = p_club_id,
            updated_at = now()
        where id = auth.uid()
          and club_id is null;
    exception
        when unique_violation then
            raise exception 'That club has already been claimed. Please choose another.';
    end;

    insert into public.manager_careers (manager_id, club_id)
    values (auth.uid(), p_club_id)
    on conflict (manager_id) do nothing;

    return public.get_my_manager_profile();
end;
$;

revoke all on function public.get_available_clubs() from public;
grant execute on function public.get_available_clubs() to anon, authenticated;

revoke all on function public.get_my_manager_profile() from public;
grant execute on function public.get_my_manager_profile() to authenticated;

revoke all on function public.claim_manager_club(text) from public;
grant execute on function public.claim_manager_club(text) to authenticated;
