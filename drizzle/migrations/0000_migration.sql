create type public.app_role as enum ('admin');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "own roles readable" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.handle_first_admin()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created_admin after insert on auth.users
for each row execute function public.handle_first_admin();

create table public.movies (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  genre text not null default '',
  duration_min int not null default 90,
  age_rating text not null default 'TP',
  tag text not null default '',
  poster_url text,
  created_at timestamptz not null default now()
);
grant select on public.movies to anon, authenticated;
grant insert, update, delete on public.movies to authenticated;
grant all on public.movies to service_role;
alter table public.movies enable row level security;
create policy "movies public read" on public.movies for select to anon, authenticated using (true);
create policy "movies admin write" on public.movies for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create table public.showtimes (
  id uuid primary key default gen_random_uuid(),
  movie_id uuid not null references public.movies(id) on delete cascade,
  cinema text not null,
  starts_at timestamptz not null,
  created_at timestamptz not null default now()
);
grant select on public.showtimes to anon, authenticated;
grant insert, update, delete on public.showtimes to authenticated;
grant all on public.showtimes to service_role;
alter table public.showtimes enable row level security;
create policy "showtimes public read" on public.showtimes for select to anon, authenticated using (true);
create policy "showtimes admin write" on public.showtimes for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  showtime_id uuid not null references public.showtimes(id) on delete cascade,
  seats text[] not null,
  seniors int not null default 0,
  total numeric(8,2) not null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null default '',
  created_at timestamptz not null default now()
);
grant select, delete on public.bookings to authenticated;
grant all on public.bookings to service_role;
alter table public.bookings enable row level security;
create policy "bookings admin read" on public.bookings for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "bookings admin delete" on public.bookings for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

with m as (
  insert into public.movies (title, genre, duration_min, age_rating, tag) values
  ('La última luz','Drama',118,'+12','Estreno'),
  ('El pequeño zorro','Animación',94,'TP','Familiar')
  returning id)
insert into public.showtimes (movie_id, cinema, starts_at)
select m.id, c.cinema, ((current_date + d.n) + t.t) at time zone 'Europe/Madrid'
from m cross join (values ('arahal'),('estepa'),('osuna')) c(cinema)
cross join generate_series(0,6) d(n)
cross join (values (time '18:00'), (time '20:30')) t(t);