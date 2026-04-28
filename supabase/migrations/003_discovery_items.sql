-- Kesif sayfasi icin tablo
create table if not exists public.discovery_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  item_name text not null,
  unit text not null,
  quantity numeric(14,2) not null check (quantity > 0),
  unit_price numeric(14,2) not null check (unit_price >= 0),
  created_by_username text
);
