-- Supabase SQL Editor'da bir kez çalıştırın.
create table if not exists public.site_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  note text not null
);

alter table public.site_logs enable row level security;

-- Demo: herkes okuyup yazabilsin. Canlıda auth + sıkı politikalar kullanın.
create policy "site_logs_select_anon"
  on public.site_logs for select
  to anon, authenticated
  using (true);

create policy "site_logs_insert_anon"
  on public.site_logs for insert
  to anon, authenticated
  with check (true);
