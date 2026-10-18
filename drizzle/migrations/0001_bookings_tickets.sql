alter table public.bookings add column tickets integer not null default 0;
alter table public.bookings alter column customer_email set default '';
comment on column public.bookings.seats is 'DEPRECATED: seat map removed, use tickets';