-- Supabase SQL Editor'da calistirin.
-- 1) Profil tablosu ve roller
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null default '',
  role text not null default 'gozlemci' check (role in ('yonetici', 'gozlemci')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_self" on public.profiles;
drop policy if exists "profiles_insert_self" on public.profiles;
drop policy if exists "profiles_update_self" on public.profiles;

create policy "profiles_select_self"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

create policy "profiles_insert_self"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

create policy "profiles_update_self"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Yeni kullanici gelince profile satiri ac.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, coalesce(new.email, ''), 'gozlemci')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2) Saha notlari tablosu
create table if not exists public.site_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  note text not null
);

alter table public.site_logs
  add column if not exists created_by uuid references auth.users(id) on delete set null;

alter table public.site_logs enable row level security;

drop policy if exists "site_logs_select_anon" on public.site_logs;
drop policy if exists "site_logs_insert_anon" on public.site_logs;
drop policy if exists "site_logs_select_auth" on public.site_logs;
drop policy if exists "site_logs_insert_yonetici" on public.site_logs;

create policy "site_logs_select_auth"
  on public.site_logs for select
  to authenticated
  using (true);

create policy "site_logs_insert_yonetici"
  on public.site_logs for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid() and p.role = 'yonetici'
    )
  );

drop policy if exists "site_logs_delete_yonetici" on public.site_logs;

create policy "site_logs_delete_yonetici"
  on public.site_logs for delete
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid() and p.role = 'yonetici'
    )
  );

-- 3) Kesif kalemleri
create table if not exists public.discovery_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  poz_no text,
  grup_kodu text,
  item_name text not null,
  unit text not null,
  quantity numeric(14,2) not null check (quantity > 0),
  unit_price numeric(14,2) not null check (unit_price >= 0),
  malzeme_birim_fiyat numeric(14,2) not null default 0 check (malzeme_birim_fiyat >= 0),
  montaj_birim_fiyat numeric(14,2) not null default 0 check (montaj_birim_fiyat >= 0),
  kesif_turu text not null default 'on_kesif' check (kesif_turu in ('on_kesif', 'kesin_kesif')),
  durum text not null default 'taslak' check (durum in ('taslak', 'onayli')),
  created_by_username text
);

-- 4) Bütçe
create table if not exists public.project_budgets (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  scope text not null default 'global',
  allocated_budget numeric(14,2) not null check (allocated_budget >= 0),
  note text,
  created_by_username text,
  updated_by_username text
);

-- 5) Puantaj / insan kaynagi
create table if not exists public.labor_entries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  entry_date date not null,
  ekip_adi text not null,
  taseron text,
  grup_kodu text,
  bolge text,
  vardiya text not null default 'gunduz' check (vardiya in ('gunduz', 'gece')),
  kisi_sayisi integer not null check (kisi_sayisi > 0),
  saat numeric(8,2) not null check (saat > 0),
  saatlik_maliyet numeric(14,2) not null check (saatlik_maliyet >= 0),
  notlar text,
  created_by_username text
);
