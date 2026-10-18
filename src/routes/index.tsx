import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import hero from "@/assets/hero.jpg";

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
  component: Index,
});

const CINES = [
  { id: "arahal", name: "Arahal", place: "Casa del Aire", addr: "C/ Veracruz 2, Arahal (Sevilla)" },
  { id: "estepa", name: "Estepa", place: "Casa de la Cultura", addr: "Calle Saladillo 12, Estepa (Sevilla)" },
  { id: "saucejo", name: "El Saucejo", place: "Teatro Alberquilla", addr: "C/ Alberquilla 2, El Saucejo (Sevilla)" },
  { id: "corrales", name: "Los Corrales", place: "Casa de la Cultura", addr: "Avda. Andalucía s/n, Los Corrales (Sevilla)" },
  { id: "osuna", name: "Osuna", place: "Conservatorio de Música", addr: "C/ Manuel Losada Villasante 23, Osuna (Sevilla)" },
  { id: "olvera", name: "Olvera", place: "Casa de la Cultura", addr: "C/ Lepanto 2, Olvera (Cádiz)" },
];

// Películas de ejemplo: sustituir por la cartelera real
const PELIS = [
  { id: 1, title: "La última luz", genre: "Drama", dur: 118, age: "+12", hue: 25, times: ["17:30", "20:00", "22:15"], tag: "Estreno" },
  { id: 2, title: "Rumbo a Marte", genre: "Ciencia ficción", dur: 132, age: "+7", hue: 220, times: ["18:00", "21:00"], tag: "Esta semana" },
  { id: 3, title: "El pequeño zorro", genre: "Animación", dur: 94, age: "TP", hue: 60, times: ["16:30", "18:30"], tag: "Familiar" },
  { id: 4, title: "Noche cerrada", genre: "Thriller", dur: 109, age: "+16", hue: 280, times: ["20:30", "22:45"], tag: "Seguimos" },
];

const PRICE = 5;
const ROWS = "ABCDEFG".split("");
const COLS = 10;

function days() {
  const f = new Intl.DateTimeFormat("es-ES", { weekday: "short", day: "numeric" });
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return { key: i, label: i === 0 ? "Hoy" : i === 1 ? "Mañana" : f.format(d) };
  });
}

type Peli = (typeof PELIS)[number];

function Index() {
  const [cine, setCine] = useState(CINES[0].id);
  const [day, setDay] = useState(0);
  const [booking, setBooking] = useState<{ peli: Peli; time: string } | null>(null);
  const dayList = useMemo(days, []);
  const current = CINES.find((c) => c.id === cine)!;

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
            <span className="text-sm text-muted-foreground">Entradas desde <b className="text-foreground">{PRICE} €</b></span>
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
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-gold">Paso 3 · Elige película y sesión</p>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PELIS.map((p) => (
            <article key={p.id} className="overflow-hidden rounded-xl border bg-card">
              <div className="relative flex aspect-[2/3] items-end p-4"
                style={{ background: `linear-gradient(160deg, oklch(0.45 0.15 ${p.hue}), oklch(0.18 0.03 ${p.hue}))` }}>
                <span className="absolute left-3 top-3 rounded-full bg-background/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider">{p.tag}</span>
                <span className="absolute right-3 top-3 rounded border border-foreground/40 px-1.5 text-[10px] font-bold">{p.age}</span>
                <h3 className="text-2xl font-bold leading-tight">{p.title}</h3>
              </div>
              <div className="p-4">
                <p className="text-xs text-muted-foreground">{p.genre} · {p.dur} min</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {p.times.map((t) => (
                    <button key={t} onClick={() => setBooking({ peli: p, time: t })}
                      className="rounded-md border border-gold/40 px-3 py-1.5 text-sm font-semibold text-gold transition hover:bg-gold hover:text-accent-foreground">
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
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
          </div>
        </div>
      </footer>

      {booking && (
        <BookingSheet peli={booking.peli} time={booking.time} cine={current.name}
          day={dayList[day].label} onClose={() => setBooking(null)} />
      )}
    </div>
  );
}

function BookingSheet({ peli, time, cine, day, onClose }: { peli: Peli; time: string; cine: string; day: string; onClose: () => void }) {
  const taken = useMemo(() => new Set(["C4", "C5", "D5", "D6", "E2", "F8", "B7"]), []);
  const [sel, setSel] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const toggle = (s: string) => setSel((x) => (x.includes(s) ? x.filter((y) => y !== s) : [...x, s]));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm md:items-center" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border bg-card p-6 md:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        {done ? (
          <div className="py-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">Reserva confirmada</p>
            <h3 className="mt-3 text-3xl font-bold">¡Nos vemos en el cine!</h3>
            <p className="mt-3 text-muted-foreground">{peli.title} · {cine} · <span className="capitalize">{day}</span> {time}<br />Butacas {sel.join(", ")}</p>
            <button onClick={onClose} className="mt-6 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground">Cerrar</button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold">{peli.title}</h3>
                <p className="text-sm text-muted-foreground">Méliès {cine} · <span className="capitalize">{day}</span> · {time}</p>
              </div>
              <button onClick={onClose} aria-label="Cerrar" className="text-2xl leading-none text-muted-foreground">×</button>
            </div>
            <div className="mx-auto mt-6 h-1.5 w-3/4 rounded-full bg-gold/70" />
            <p className="mt-1 text-center text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Pantalla</p>
            <div className="mt-5 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0,1fr))` }}>
              {ROWS.flatMap((r) => Array.from({ length: COLS }, (_, i) => {
                const id = `${r}${i + 1}`;
                const isTaken = taken.has(id);
                const on = sel.includes(id);
                return (
                  <button key={id} disabled={isTaken} onClick={() => toggle(id)} aria-label={`Butaca ${id}`}
                    className={`aspect-square rounded-t-md text-[9px] transition ${isTaken ? "bg-muted opacity-40" : on ? "bg-primary text-primary-foreground" : "border border-foreground/25 hover:border-gold"}`}>
                    {on ? id : ""}
                  </button>
                );
              }))}
            </div>
            <div className="mt-4 flex justify-center gap-5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded-sm border border-foreground/25" />Libre</span>
              <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded-sm bg-primary" />Tu selección</span>
              <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded-sm bg-muted" />Ocupada</span>
            </div>
            <div className="mt-6 flex items-center justify-between border-t pt-5">
              <div>
                <p className="text-sm text-muted-foreground">{sel.length} entrada{sel.length === 1 ? "" : "s"}</p>
                <p className="font-display text-2xl font-bold">{sel.length * PRICE} €</p>
              </div>
              <button disabled={!sel.length} onClick={() => setDone(true)}
                className="rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow disabled:opacity-40 disabled:shadow-none">
                Confirmar reserva
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
