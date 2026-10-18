import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { bookingTotal, cineName, COLS, eur, isFridayInMadrid, madridDate, madridTime, ROWS } from "./cinema";

const NOTIFY_TO = "pruebaparapaginawebmelies@gmail.com";

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const getCartelera = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const since = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  const [movies, shows] = await Promise.all([
    sb.from("movies").select("id,title,genre,duration_min,age_rating,tag,poster_url").order("created_at"),
    sb.from("showtimes").select("id,movie_id,cinema,starts_at").gte("starts_at", since).order("starts_at"),
  ]);
  if (movies.error) throw new Error(movies.error.message);
  if (shows.error) throw new Error(shows.error.message);
  return { movies: movies.data, showtimes: shows.data };
});

export const createBooking = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({
      showtimeId: z.string().uuid(),
      tickets: z.number().int().min(1).max(20),
      seniors: z.number().int().min(0).max(20),
      name: z.string().trim().min(3).max(100),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: show, error: se } = await supabaseAdmin
      .from("showtimes").select("id,cinema,starts_at,movies(title)").eq("id", data.showtimeId).single();
    if (se || !show) return { ok: false as const, error: "La sesión ya no existe." };

    const start = new Date(show.starts_at);
    const friday = isFridayInMadrid(start);
    const seniors = friday ? Math.min(data.seniors, data.tickets) : 0;
    const total = bookingTotal(data.tickets, seniors, friday);

    const { data: booking, error } = await supabaseAdmin.from("bookings").insert({
      showtime_id: show.id, seats: [], tickets: data.tickets, seniors, total,
      customer_name: data.name,
    }).select("id").single();
    if (error) throw new Error(error.message);

    const title = (show.movies as { title: string } | null)?.title ?? "Película";
    try {
      await sendGmail(
        NOTIFY_TO,
        `Nueva reserva: ${data.name} · ${data.tickets} plaza${data.tickets === 1 ? "" : "s"} · ${title} · ${cineName(show.cinema)} ${madridDate(start)} ${madridTime(start)}`,
        [
          `Nueva reserva en Méliès ${cineName(show.cinema)}`,
          ``,
          `Nombre: ${data.name}`,
          `Plazas: ${data.tickets}${seniors ? ` (${seniors} mayores de 65)` : ""}`,
          `Película: ${title}`,
          `Fecha: ${madridDate(start)} a las ${madridTime(start)}`,
          `A cobrar en taquilla: ${eur(total)}`,
          ``,
          `Referencia: ${booking.id}`,
        ].join("\n"),
      );
    } catch (e) {
      console.error("No se pudo enviar el aviso de reserva", e);
    }
    return { ok: true as const, id: booking.id, total };
  });

async function sendGmail(to: string, subject: string, body: string) {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const gmailKey = process.env["GOOGLE_MAIL_API_KEY"];
  if (!lovableKey || !gmailKey) throw new Error("Gmail no está configurado");
  const b64 = (s: string) => btoa(Array.from(new TextEncoder().encode(s), (b) => String.fromCharCode(b)).join(""));
  const header = (v: string) => (/^[\x00-\x7F]*$/.test(v) ? v : `=?UTF-8?B?${b64(v)}?=`);
  const raw = b64(
    [`To: ${to}`, `Subject: ${header(subject)}`, "MIME-Version: 1.0", 'Content-Type: text/plain; charset="UTF-8"', "Content-Transfer-Encoding: base64", "", b64(body)].join("\r\n"),
  ).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const res = await fetch("https://connector-gateway.lovable.dev/google_mail/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": gmailKey, "Content-Type": "application/json" },
    body: JSON.stringify({ raw }),
  });
  if (!res.ok) throw new Error(`Gmail [${res.status}]: ${await res.text()}`);
}
