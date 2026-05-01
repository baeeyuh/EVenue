alter table public.venues
  add column if not exists check_in_time time,
  add column if not exists check_out_time time,
  add column if not exists allow_custom_hours boolean not null default false,
  add column if not exists allow_half_day boolean not null default false,
  add column if not exists hourly_rate numeric,
  add column if not exists half_day_price numeric;

create table if not exists public.venue_date_availability (
  venue_id uuid not null references public.venues(id) on delete cascade,
  date date not null,
  is_available boolean not null,
  updated_at timestamp with time zone not null default now(),
  primary key (venue_id, date)
);
