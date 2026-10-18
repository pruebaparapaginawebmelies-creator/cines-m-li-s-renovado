import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Acceso gestión – Méliès Cines" },
      { name: "description", content: "Acceso privado para gestionar la cartelera de Méliès Cines." },
      { property: "og:title", content: "Acceso gestión – Méliès Cines" },
      { property: "og:description", content: "Panel privado de cartelera y reservas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg("");
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg("Correo o contraseña incorrectos.");
      else nav({ to: "/admin" });
    } else {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/admin` } });
      setMsg(error ? error.message : "Te hemos enviado un correo para confirmar la cuenta. Ábrelo y vuelve aquí para entrar.");
    }
    setBusy(false);
  }

  const input = "w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:border-gold";
  return (
    <div className="flex min-h-screen items-center justify-center px-5">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl border bg-card p-7">
        <a href="/" className="font-display text-2xl font-bold">Méliès <span className="text-gold">Cines</span></a>
        <p className="text-sm text-muted-foreground">{mode === "in" ? "Entra para gestionar la cartelera." : "Crea la cuenta de gestión."}</p>
        <input required type="email" placeholder="Correo" className={input} value={email} onChange={(e) => setEmail(e.target.value)} />
        <input required type="password" minLength={6} placeholder="Contraseña" className={input} value={password} onChange={(e) => setPassword(e.target.value)} />
        {msg && <p className="text-sm text-gold">{msg}</p>}
        <button disabled={busy} className="w-full rounded-full bg-primary py-3 font-semibold text-primary-foreground disabled:opacity-50">
          {mode === "in" ? "Entrar" : "Crear cuenta"}
        </button>
        <button type="button" onClick={() => setMode(mode === "in" ? "up" : "in")} className="w-full text-xs text-muted-foreground underline">
          {mode === "in" ? "¿Primera vez? Crear cuenta" : "Ya tengo cuenta"}
        </button>
      </form>
    </div>
  );
}
