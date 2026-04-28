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
