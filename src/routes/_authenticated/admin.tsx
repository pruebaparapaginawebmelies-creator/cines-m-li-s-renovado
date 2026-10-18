import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CINES, cineName, eur, madridDate, madridTime, TZ } from "@/lib/cinema";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Gestión de cartelera – Méliès Cines" },
      { name: "description", content: "Panel privado para gestionar películas, sesiones y reservas." },
      { property: "og:title", content: "Gestión de cartelera – Méliès Cines" },
      { property: "og:description", content: "Panel privado de Méliès Cines." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

const input = "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-gold";
const btn = "rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50";

/** "2026-10-20" + "20:30" (hora de Madrid) -> ISO UTC */
function madridToIso(date: string, time: string) {
  const guess = new Date(`${date}T${time}:00Z`);
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: TZ, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
    .formatToParts(guess).reduce<Record<string, string>>((a, p) => ({ ...a, [p.type]: p.value }), {});
  const asMadrid = Date.UTC(+parts.year!, +parts.month! - 1, +parts.day!, +parts.hour!, +parts.minute!);
  return new Date(guess.getTime() - (asMadrid - guess.getTime())).toISOString();
}

function Admin() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"pelis" | "sesiones" | "reservas">("pelis");

  const role = useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", u.user!.id).eq("role", "admin");
      return !!data?.length;
    },
  });
  const movies = useQuery({
    queryKey: ["admin-movies"],
    queryFn: async () => (await supabase.from("movies").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  if (role.isLoading) return <p className="p-10 text-muted-foreground">Cargando…</p>;
  if (!role.data) return (
    <div className="p-10">
      <p>Esta cuenta no tiene permisos de gestión.</p>
      <button className="mt-4 underline" onClick={async () => { await supabase.auth.signOut(); nav({ to: "/auth" }); }}>Salir</button>
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <div className="flex items-center justify-between">
        <a href="/" className="font-display text-2xl font-bold">Méliès <span className="text-gold">Gestión</span></a>
        <button className="text-sm text-muted-foreground underline" onClick={async () => { await supabase.auth.signOut(); nav({ to: "/auth" }); }}>Salir</button>
      </div>
      <div className="mt-6 flex gap-2">
        {([["pelis", "Películas"], ["sesiones", "Sesiones"], ["reservas", "Reservas"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`rounded-full border px-4 py-2 text-sm ${tab === k ? "border-gold bg-gold text-accent-foreground" : ""}`}>{l}</button>
        ))}
      </div>
      <div className="mt-6">
        {tab === "pelis" && <Movies movies={movies.data ?? []} refresh={() => { qc.invalidateQueries({ queryKey: ["admin-movies"] }); qc.invalidateQueries({ queryKey: ["cartelera"] }); }} />}
        {tab === "sesiones" && <Sessions movies={movies.data ?? []} />}
        {tab === "reservas" && <Bookings />}
      </div>
    </div>
  );
}

type MovieRow = { id: string; title: string; genre: string; duration_min: number; age_rating: string; tag: string; poster_url: string | null };

function Movies({ movies, refresh }: { movies: MovieRow[]; refresh: () => void }) {
  const empty = { title: "", genre: "", duration_min: 100, age_rating: "TP", tag: "", poster_url: "" };
  const [f, setF] = useState(empty);
  const [busy, setBusy] = useState(false);
  async function add(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    const { error } = await supabase.from("movies").insert({ ...f, poster_url: f.poster_url || null });
    setBusy(false);
    if (error) return alert(error.message);
    setF(empty); refresh();
  }
  async function del(id: string) {
    if (!confirm("¿Borrar la película y todas sus sesiones?")) return;
    await supabase.from("movies").delete().eq("id", id); refresh();
  }
  return (
    <div className="grid gap-6 md:grid-cols-[1fr_1.3fr]">
      <form onSubmit={add} className="space-y-3 rounded-xl border bg-card p-5">
        <h2 className="font-bold">Añadir película</h2>
        <input required placeholder="Título" className={input} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        <input placeholder="Género" className={input} value={f.genre} onChange={(e) => setF({ ...f, genre: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <input type="number" min={1} placeholder="Minutos" className={input} value={f.duration_min} onChange={(e) => setF({ ...f, duration_min: +e.target.value })} />
          <select className={input} value={f.age_rating} onChange={(e) => setF({ ...f, age_rating: e.target.value })}>
            {["TP", "+7", "+12", "+16", "+18"].map((a) => <option key={a}>{a}</option>)}
          </select>
        </div>
        <input placeholder="Etiqueta (Estreno, Familiar…)" className={input} value={f.tag} onChange={(e) => setF({ ...f, tag: e.target.value })} />
        <input type="url" placeholder="Enlace a la imagen del cartel" className={input} value={f.poster_url} onChange={(e) => setF({ ...f, poster_url: e.target.value })} />
        <button disabled={busy} className={btn}>Guardar</button>
      </form>
      <div className="space-y-2">
        {movies.map((m) => (
          <div key={m.id} className="flex items-center gap-3 rounded-xl border bg-card p-3">
            <div className="h-16 w-11 shrink-0 overflow-hidden rounded bg-muted">{m.poster_url && <img src={m.poster_url} alt="" className="h-full w-full object-cover" />}</div>
            <div className="flex-1">
              <p className="font-semibold">{m.title}</p>
              <p className="text-xs text-muted-foreground">{m.genre} · {m.duration_min} min · {m.age_rating} {m.tag && `· ${m.tag}`}</p>
            </div>
            <button onClick={() => del(m.id)} className="text-xs text-muted-foreground underline">Borrar</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Sessions({ movies }: { movies: MovieRow[] }) {
  const qc = useQueryClient();
  const today = madridDate(new Date());
  const [f, setF] = useState({ movie_id: "", cinema: CINES[0].id as string, from: today, to: today, times: "18:00, 20:30" });
  const [busy, setBusy] = useState(false);
  const list = useQuery({
    queryKey: ["admin-shows"],
    queryFn: async () => (await supabase.from("showtimes").select("id,cinema,starts_at,movies(title)").gte("starts_at", new Date().toISOString()).order("starts_at").limit(300)).data ?? [],
  });
  async function add(e: React.FormEvent) {
    e.preventDefault();
    const times = f.times.split(/[,\s]+/).filter((t) => /^\d{1,2}:\d{2}$/.test(t)).map((t) => t.padStart(5, "0"));
    if (!f.movie_id || !times.length) return alert("Elige película y al menos una hora (ej. 18:00, 20:30)");
    const rows = [];
    for (let d = new Date(`${f.from}T12:00:00Z`); madridDate(d) <= f.to; d = new Date(d.getTime() + 86400000)) {
      for (const t of times) rows.push({ movie_id: f.movie_id, cinema: f.cinema, starts_at: madridToIso(d.toISOString().slice(0, 10), t) });
    }
    if (rows.length > 200) return alert("Demasiadas sesiones de golpe (máx. 200).");
    setBusy(true);
    const { error } = await supabase.from("showtimes").insert(rows);
    setBusy(false);
    if (error) return alert(error.message);
    qc.invalidateQueries({ queryKey: ["admin-shows"] }); qc.invalidateQueries({ queryKey: ["cartelera"] });
  }
  async function del(id: string) {
    if (!confirm("¿Borrar esta sesión? Se borrarán también sus reservas.")) return;
    await supabase.from("showtimes").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-shows"] }); qc.invalidateQueries({ queryKey: ["cartelera"] });
  }
  return (
    <div className="grid gap-6 md:grid-cols-[1fr_1.3fr]">
      <form onSubmit={add} className="space-y-3 rounded-xl border bg-card p-5">
        <h2 className="font-bold">Programar sesiones</h2>
        <select required className={input} value={f.movie_id} onChange={(e) => setF({ ...f, movie_id: e.target.value })}>
          <option value="">Película…</option>
          {movies.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
        </select>
        <select className={input} value={f.cinema} onChange={(e) => setF({ ...f, cinema: e.target.value })}>
          {CINES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs text-muted-foreground">Desde<input type="date" className={input} value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} /></label>
          <label className="text-xs text-muted-foreground">Hasta<input type="date" className={input} value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} /></label>
        </div>
        <label className="block text-xs text-muted-foreground">Horas (separadas por comas)<input className={input} value={f.times} onChange={(e) => setF({ ...f, times: e.target.value })} /></label>
        <button disabled={busy} className={btn}>Añadir sesiones</button>
      </form>
      <div className="max-h-[70vh] space-y-1.5 overflow-y-auto">
        {(list.data ?? []).map((s) => {
          const d = new Date(s.starts_at);
          return (
            <div key={s.id} className="flex items-center justify-between rounded-lg border bg-card px-3 py-2 text-sm">
              <span><b>{madridDate(d)} {madridTime(d)}</b> · {cineName(s.cinema)} · {(s.movies as { title: string } | null)?.title}</span>
              <button onClick={() => del(s.id)} className="text-xs text-muted-foreground underline">Borrar</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Bookings() {
  const list = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: async () => (await supabase.from("bookings").select("*, showtimes(cinema,starts_at,movies(title))").order("created_at", { ascending: false }).limit(200)).data ?? [],
  });
  if (!list.data?.length) return <p className="text-muted-foreground">Todavía no hay reservas.</p>;
  return (
    <div className="space-y-2">
      {list.data.map((b) => {
        const s = b.showtimes as { cinema: string; starts_at: string; movies: { title: string } | null } | null;
        const d = s ? new Date(s.starts_at) : null;
        return (
          <div key={b.id} className="rounded-xl border bg-card p-4 text-sm">
            <div className="flex justify-between"><b>{s?.movies?.title}</b><span className="text-gold">{eur(Number(b.total))}</span></div>
            <p className="text-muted-foreground">{s && cineName(s.cinema)} · {d && `${madridDate(d)} ${madridTime(d)}`} · Butacas {b.seats.join(", ")}{b.seniors ? ` (${b.seniors} +65)` : ""}</p>
            <p>{b.customer_name} · {b.customer_email} {b.customer_phone && `· ${b.customer_phone}`}</p>
          </div>
        );
      })}
    </div>
  );
}
