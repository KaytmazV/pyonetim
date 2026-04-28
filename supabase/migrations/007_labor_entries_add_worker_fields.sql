alter table public.labor_entries
  add column if not exists calisan_adi text,
  add column if not exists gorev text;
