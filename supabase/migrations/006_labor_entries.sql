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
