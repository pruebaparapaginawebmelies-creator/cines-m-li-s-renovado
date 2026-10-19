import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import hero from "@/assets/hero.jpg";
import { createBooking, getCartelera } from "@/lib/cartelera.functions";
import { bookingTotal, CINES, eur, isFridayInMadrid, madridDate, madridTime, PRICE, SENIOR_PRICE, TZ } from "@/lib/cinema";

const carteleraQuery = queryOptions({ queryKey: ["cartelera"], queryFn: () => getCartelera() });

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Méliès Cines – Cartelera y reserva de entradas" },
      { name: "description", content: "Consulta la cartelera de los cines Méliès en Arahal, Estepa, Osuna, Olvera y más, y reserva tus entradas en tres pasos." },
      { property: "og:title", content: "Méliès Cines – Cartelera y reservas" },
      { property: "og:description", content: "El mejor cine al mejor precio en la Sierra Sur y Campiña. Reserva tu butaca online." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(carteleraQuery),
  component: Index,
});

type Cartelera = Awaited<ReturnType<typeof getCartelera>>;
type Movie = Cartelera["movies"][number];
type Show = Cartelera["showtimes"][number];

function days() {
  const f = new Intl.DateTimeFormat("es-ES", { timeZone: TZ, weekday: "short", day: "numeric" });
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() + i * 86400000);
    return { key: madridDate(d), friday: isFridayInMadrid(d), label: i === 0 ? "Hoy" : i === 1 ? "Mañana" : f.format(d) };
  });
}

function Index() {
  const { data } = useSuspenseQuery(carteleraQuery);
  const [cine, setCine] = useState<string>(CINES[0].id);
  const dayList = useMemo(days, []);
  const [day, setDay] = useState(dayList[0]!.key);
  const [booking, setBooking] = useState<{ movie: Movie; show: Show } | null>(null);
  const current = CINES.find((c) => c.id === cine)!;

  const byMovie = useMemo(() => {
    const shows = data.showtimes.filter((s) => s.cinema === cine && madridDate(new Date(s.starts_at)) === day);
    return data.movies
      .map((m) => ({ movie: m, shows: shows.filter((s) => s.movie_id === m.id) }))
      .filter((x) => x.shows.length);
  }, [data, cine, day]);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <a href="#" className="font-display text-2xl font-bold tracking-tight">
            Méliès <span className="text-gold">Cines</span>
          </a>
          <nav className="hidden gap-8 text-sm text-muted-foreground md:flex">
            <a href="#cartelera" className="hover:text-foreground">Cartelera</a>
            <a href="#cines" className="hover:text-foreground">Nuestros cines</a>
            <a href="#contacto" className="hover:text-foreground">Contacto</a>
          </nav>
          <a href="#cartelera" className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow">
            Reservar
          </a>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <img src={hero} alt="Sala de cine Méliès" width={1600} height={912} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-hero-fade" />
        <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-28 md:pb-24 md:pt-40">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-gold">El mejor cine al mejor precio</p>
          <h1 className="max-w-2xl text-5xl font-bold leading-[1.05] md:text-7xl">El cine de tu pueblo, como nunca.</h1>
          <p className="mt-5 max-w-lg text-muted-foreground">Seis salas en Sevilla y Cádiz. Elige tu cine, tu película y tu butaca en menos de un minuto.</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href="#cartelera" className="rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow">Ver cartelera</a>
            <span className="text-sm text-muted-foreground">Entradas a <b className="text-foreground">{eur(PRICE)}</b> · Viernes mayores de 65: <b className="text-gold">{eur(SENIOR_PRICE)}</b></span>
          </div>
        </div>
      </section>

      <section id="cartelera" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-14">
        <div className="mb-8 flex flex-col gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">Paso 1 · Elige tu cine</p>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {CINES.map((c) => (
                <button key={c.id} onClick={() => setCine(c.id)}
                  className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition ${cine === c.id ? "border-gold bg-gold text-accent-foreground" : "hover:border-gold/60"}`}>
                  {c.name}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{current.place} · {current.addr}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">Paso 2 · Elige el día</p>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {dayList.map((d) => (
                <button key={d.key} onClick={() => setDay(d.key)}
                  className={`shrink-0 rounded-lg border px-4 py-2 text-sm capitalize transition ${day === d.key ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary/60"}`}>
                  {d.label}{d.friday && <span className="ml-1 text-[10px] text-gold">· +65 a 2 €</span>}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-gold">Paso 3 · Elige película y sesión</p>
        {byMovie.length === 0 ? (
          <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">
            No hay sesiones programadas en Méliès {current.name} para este día. Prueba otro día u otro cine.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {byMovie.map(({ movie: m, shows }) => (
              <article key={m.id} className="overflow-hidden rounded-xl border bg-card">
                <div className="relative flex aspect-[2/3] items-end bg-muted p-4">
                  {m.poster_url ? (
                    <img src={m.poster_url} alt={`Cartel de ${m.title}`} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
                  {m.tag && <span className="absolute left-3 top-3 rounded-full bg-background/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider">{m.tag}</span>}
                  <span className="absolute right-3 top-3 rounded border border-foreground/40 bg-background/50 px-1.5 text-[10px] font-bold">{m.age_rating}</span>
                  <h3 className="relative text-2xl font-bold leading-tight">{m.title}</h3>
                </div>
                <div className="p-4">
                  <p className="text-xs text-muted-foreground">{m.genre} · {m.duration_min} min</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {shows.map((s) => (
                      <button key={s.id} onClick={() => setBooking({ movie: m, show: s })}
                        className="rounded-md border border-gold/40 px-3 py-1.5 text-sm font-semibold text-gold transition hover:bg-gold hover:text-accent-foreground">
                        {madridTime(new Date(s.starts_at))}
                      </button>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section id="cines" className="border-t bg-card/40">
        <div className="mx-auto max-w-6xl scroll-mt-20 px-5 py-14">
          <h2 className="text-3xl font-bold md:text-4xl">Nuestros cines</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CINES.map((c) => (
              <button key={c.id} onClick={() => { setCine(c.id); document.getElementById("cartelera")?.scrollIntoView({ behavior: "smooth" }); }}
                className="rounded-xl border bg-card p-5 text-left transition hover:border-gold/60">
                <p className="font-display text-xl font-bold">Méliès {c.name}</p>
                <p className="mt-1 text-sm text-gold">{c.place}</p>
                <p className="mt-2 text-sm text-muted-foreground">{c.addr}</p>
                <p className="mt-4 text-sm font-semibold">Ver cartelera →</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      <footer id="contacto" className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-10 text-sm text-muted-foreground md:flex-row md:justify-between">
          <div>
            <p className="font-display text-lg font-bold text-foreground">Méliès Cines</p>
            <p>© 2026 Cines Méliès · Aviso legal y privacidad</p>
          </div>
          <div className="flex flex-col gap-1 md:items-end">
            <a href="tel:638115247" className="hover:text-foreground">638 115 247</a>
            <a href="mailto:info@cinesmelies.es" className="hover:text-foreground">info@cinesmelies.es</a>
            <a href="/admin" className="text-xs hover:text-foreground">Acceso gestión</a>
          </div>
        </div>
      </footer>

      {booking && (
        <BookingSheet movie={booking.movie} show={booking.show} cine={current.name} onClose={() => setBooking(null)} />
      )}
    </div>
  );
}

function BookingSheet({ movie, show, cine, onClose }: { movie: Movie; show: Show; cine: string; onClose: () => void }) {
  const start = new Date(show.starts_at);
  const friday = isFridayInMadrid(start);
  const dayLabel = new Intl.DateTimeFormat("es-ES", { timeZone: TZ, weekday: "long", day: "numeric", month: "long" }).format(start);
  const book = useServerFn(createBooking);
  const [tickets, setTickets] = useState(1);
  const [seniors, setSeniors] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const nSeniors = friday ? Math.min(seniors, tickets) : 0;
  const total = bookingTotal(tickets, nSeniors, friday);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true); setError("");
    try {
      const r = await book({ data: { showtimeId: show.id, tickets, seniors: nSeniors, name, email } });
      if (r.ok) { setCode(r.code); setDone(true); } else setError(r.error);
    } catch {
      setError("No se pudo completar la reserva. Inténtalo de nuevo.");
    } finally { setSending(false); }
  }

  const Stepper = ({ value, set, min, max, label }: { value: number; set: (n: number) => void; min: number; max: number; label: string }) => (
    <div className="flex items-center justify-between rounded-lg border p-3 text-sm">
      <span>{label}</span>
      <span className="flex items-center gap-4">
        <button type="button" onClick={() => set(Math.max(min, value - 1))} className="h-9 w-9 rounded-full border text-lg" aria-label={`Menos ${label}`}>−</button>
        <b className="w-5 text-center text-lg">{value}</b>
        <button type="button" onClick={() => set(Math.min(max, value + 1))} className="h-9 w-9 rounded-full border text-lg" aria-label={`Más ${label}`}>+</button>
      </span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm md:items-center" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-2xl border bg-card p-6 md:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        {done ? (
          <div className="py-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">Reserva confirmada</p>
            <h3 className="mt-3 text-3xl font-bold">¡Nos vemos en el cine!</h3>
            <p className="mt-3 text-muted-foreground">{movie.title} · {cine} · <span className="capitalize">{dayLabel}</span> {madridTime(start)}</p>
            <p className="mt-1 text-muted-foreground">{tickets} plaza{tickets === 1 ? "" : "s"} a nombre de <b className="text-foreground">{name}</b></p>
            <p className="mt-4 font-display text-3xl font-bold tracking-widest text-gold">{code}</p>
            <p className="text-xs text-muted-foreground">Te hemos enviado la confirmación a {email}</p>
            <p className="mt-4 rounded-lg border border-gold/40 p-3 text-sm">Enseña el correo o di tu nombre en taquilla: tendrás <b>prioridad de acceso</b> y pagarás allí <b>{eur(total)}</b>.</p>
            <button onClick={onClose} className="mt-6 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground">Cerrar</button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold">{movie.title}</h3>
                <p className="text-sm text-muted-foreground">Méliès {cine} · <span className="capitalize">{dayLabel}</span> · {madridTime(start)}</p>
              </div>
              <button type="button" onClick={onClose} aria-label="Cerrar" className="text-2xl leading-none text-muted-foreground">×</button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">Reserva tu plaza con prioridad de acceso. Se paga en taquilla.</p>
            {error && <p className="mt-4 rounded-lg border border-primary/50 bg-primary/10 p-3 text-sm">{error}</p>}
            <div className="mt-5 space-y-3">
              <input required minLength={3} placeholder="Nombre completo" autoComplete="name"
                className="w-full rounded-lg border bg-background px-3 py-3 text-sm outline-none focus:border-gold"
                value={name} onChange={(e) => setName(e.target.value)} />
              <input required type="email" placeholder="Correo electrónico (te enviamos la confirmación)" autoComplete="email"
                className="w-full rounded-lg border bg-background px-3 py-3 text-sm outline-none focus:border-gold"
                value={email} onChange={(e) => setEmail(e.target.value)} />
              <Stepper label="Plazas" value={tickets} set={setTickets} min={1} max={20} />
              {friday && <Stepper label={`De ellas, mayores de 65 (${eur(SENIOR_PRICE)})`} value={nSeniors} set={setSeniors} min={0} max={tickets} />}
              {!friday && <p className="text-center text-xs text-muted-foreground">Entrada {eur(PRICE)} · Los viernes, mayores de 65 a {eur(SENIOR_PRICE)}</p>}
            </div>
            <div className="mt-6 flex items-center justify-between border-t pt-5">
              <div>
                <p className="text-sm text-muted-foreground">A pagar en taquilla</p>
                <p className="font-display text-2xl font-bold">{eur(total)}</p>
              </div>
              <button type="submit" disabled={sending}
                className="rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow disabled:opacity-40">
                {sending ? "Reservando…" : "Reservar"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
