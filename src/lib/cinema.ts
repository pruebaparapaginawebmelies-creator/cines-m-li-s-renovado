export const CINES = [
  { id: "arahal", name: "Arahal", place: "Casa del Aire", addr: "C/ Veracruz 2, Arahal (Sevilla)" },
  { id: "estepa", name: "Estepa", place: "Casa de la Cultura", addr: "Calle Saladillo 12, Estepa (Sevilla)" },
  { id: "saucejo", name: "El Saucejo", place: "Teatro Alberquilla", addr: "C/ Alberquilla 2, El Saucejo (Sevilla)" },
  { id: "corrales", name: "Los Corrales", place: "Casa de la Cultura", addr: "Avda. Andalucía s/n, Los Corrales (Sevilla)" },
  { id: "osuna", name: "Osuna", place: "Conservatorio de Música", addr: "C/ Manuel Losada Villasante 23, Osuna (Sevilla)" },
  { id: "olvera", name: "Olvera", place: "Casa de la Cultura", addr: "C/ Lepanto 2, Olvera (Cádiz)" },
] as const;

export const PRICE = 4.5;
export const SENIOR_PRICE = 2; // viernes, mayores de 65
export const TZ = "Europe/Madrid";
export const ROWS = "ABCDEFG".split("");
export const COLS = 10;

export const eur = (n: number) => n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });

/** Fecha local de Madrid como YYYY-MM-DD */
export const madridDate = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);
export const madridTime = (d: Date) =>
  new Intl.DateTimeFormat("es-ES", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(d);
export const isFridayInMadrid = (d: Date) =>
  new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short" }).format(d) === "Fri";

export function bookingTotal(tickets: number, seniors: number, friday: boolean) {
  const s = friday ? Math.max(0, Math.min(seniors, tickets)) : 0;
  return s * SENIOR_PRICE + (tickets - s) * PRICE;
}

export const cineName = (id: string) => CINES.find((c) => c.id === id)?.name ?? id;
