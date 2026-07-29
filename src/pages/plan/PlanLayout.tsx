import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { erPlanlegger, supabase } from "../../lib/supabase";
import { MODULER } from "../../lib/moduler";
import { dagerIgjen } from "../../lib/utils";
import Login from "./Login";
import AiAssistent from "../../components/AiAssistent";

const HOVEDMENY = [
  { to: "/plan", nr: "00", navn: "Dashboard", emoji: "📊", end: true },
  { to: "/plan/masterplan", nr: "01", navn: "Masterplan", emoji: "✅" },
  { to: "/plan/budsjett", nr: "02", navn: "Budsjett", emoji: "💰" },
  { to: "/plan/gjester", nr: "03", navn: "Gjesteliste", emoji: "👥" },
  { to: "/plan/bord", nr: "04", navn: "Bordplassering", emoji: "🪑" },
  { to: "/plan/tidslinje", nr: "05", navn: "Tidslinje", emoji: "🗓️" },
  { to: "/plan/kjoreplan", nr: "06", navn: "Bryllupshelgen", emoji: "⏱️" },
];

const EKSTRA = [
  { to: "/plan/svar", navn: "Innkomne svar", emoji: "💌" },
  { to: "/plan/onskeliste", navn: "Ønskeliste", emoji: "🎁" },
  { to: "/plan/innstillinger", navn: "Innstillinger", emoji: "⚙️" },
];

export default function PlanLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [klar, setKlar] = useState(false);
  const [visMeny, setVisMeny] = useState(false);
  const [visAi, setVisAi] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setKlar(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!klar) {
    return <div className="flex min-h-screen items-center justify-center text-sage-600">Laster …</div>;
  }

  if (!session) return <Login />;

  if (!erPlanlegger(session.user.email)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-lg text-sage-800">Denne delen er kun for brudeparet. 💍</p>
        <p className="text-sm text-sage-600">Du er logget inn som {session.user.email}.</p>
        <button className="btn-secondary" onClick={() => supabase.auth.signOut()}>
          Logg ut
        </button>
      </div>
    );
  }

  const navKlasse = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
      isActive ? "bg-sage-700 text-white" : "text-sage-800 hover:bg-cream-200"
    }`;

  const meny = (
    <nav className="space-y-6 pb-10">
      <div className="space-y-0.5">
        {HOVEDMENY.map((m) => (
          <NavLink key={m.to} to={m.to} end={m.end} className={navKlasse} onClick={() => setVisMeny(false)}>
            <span>{m.emoji}</span>
            <span className="text-xs text-sage-400 tabular-nums">{m.nr}</span>
            <span>{m.navn}</span>
          </NavLink>
        ))}
      </div>
      <div>
        <p className="px-3 pb-1.5 text-xs font-semibold uppercase tracking-wider text-sage-400">Arbeidsbok 07–24</p>
        <div className="space-y-0.5">
          {MODULER.map((m) => (
            <NavLink key={m.key} to={`/plan/modul/${m.key}`} className={navKlasse} onClick={() => setVisMeny(false)}>
              <span>{m.emoji}</span>
              <span className="text-xs text-sage-400 tabular-nums">{m.nr}</span>
              <span>{m.tittel}</span>
            </NavLink>
          ))}
        </div>
      </div>
      <div>
        <p className="px-3 pb-1.5 text-xs font-semibold uppercase tracking-wider text-sage-400">Annet</p>
        <div className="space-y-0.5">
          {EKSTRA.map((m) => (
            <NavLink key={m.to} to={m.to} className={navKlasse} onClick={() => setVisMeny(false)}>
              <span>{m.emoji}</span>
              <span>{m.navn}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Topplinje */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-cream-300 bg-cream-50/95 px-4 py-3 backdrop-blur">
        <button className="rounded-lg border border-cream-300 p-2 lg:hidden" onClick={() => setVisMeny(!visMeny)} aria-label="Meny">
          ☰
        </button>
        <NavLink to="/plan" className="font-display text-xl font-semibold text-sage-800">
          Richard &amp; Jennie <span className="text-gold-500">·</span> Bryllup 2027
        </NavLink>
        <span className="hidden rounded-full bg-sage-100 px-3 py-1 text-xs font-medium text-sage-700 sm:inline">
          {dagerIgjen()} dager igjen 💍
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setVisAi(true)} className="btn-primary" title="AI-assistent">
            ✨ Assistent
          </button>
          <button onClick={() => supabase.auth.signOut()} className="hidden text-sm text-sage-600 hover:text-sage-800 sm:block">
            Logg ut
          </button>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1400px]">
        {/* Sidemeny desktop */}
        <aside className="sticky top-[57px] hidden h-[calc(100vh-57px)] w-64 shrink-0 overflow-y-auto border-r border-cream-300 px-3 py-4 lg:block">
          {meny}
        </aside>

        {/* Sidemeny mobil */}
        {visMeny && (
          <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setVisMeny(false)}>
            <div className="absolute inset-0 bg-sage-900/40" />
            <aside className="absolute left-0 top-0 h-full w-72 overflow-y-auto bg-cream-50 px-3 py-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
              {meny}
            </aside>
          </div>
        )}

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-8">
          <Outlet />
        </main>
      </div>

      {visAi && <AiAssistent onLukk={() => setVisAi(false)} />}
    </div>
  );
}
