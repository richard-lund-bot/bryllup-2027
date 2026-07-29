import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import type { BudgetItem, Guest, Milestone, Rsvp, Task } from "../../lib/types";
import { dagerIgjen, formatDato, formatMnd, formatNOK, PRIORITET_FARGE, useLast } from "../../lib/utils";

export default function Dashboard() {
  const [oppgaver, setOppgaver] = useState<Task[]>([]);
  const [budsjett, setBudsjett] = useState<BudgetItem[]>([]);
  const [gjester, setGjester] = useState<Guest[]>([]);
  const [svar, setSvar] = useState<Rsvp[]>([]);
  const [milepaler, setMilepaler] = useState<Milestone[]>([]);
  const [totalramme, setTotalramme] = useState<number>(0);

  const last = useCallback(async () => {
    const [t, b, g, r, m, s] = await Promise.all([
      supabase.from("tasks").select("*"),
      supabase.from("budget_items").select("*"),
      supabase.from("guests").select("*"),
      supabase.from("rsvps").select("*").order("created_at", { ascending: false }),
      supabase.from("milestones").select("*").order("month").order("sort_order"),
      supabase.from("settings").select("value").eq("key", "budsjett"),
    ]);
    setOppgaver((t.data as Task[]) ?? []);
    setBudsjett((b.data as BudgetItem[]) ?? []);
    setGjester((g.data as Guest[]) ?? []);
    setSvar((r.data as Rsvp[]) ?? []);
    setMilepaler((m.data as Milestone[]) ?? []);
    setTotalramme(Number((s.data?.[0]?.value as { totalramme?: number } | undefined)?.totalramme ?? 0));
  }, []);

  const { laster } = useLast(last);
  if (laster) return <p className="text-sage-600">Laster dashboard …</p>;

  const ferdige = oppgaver.filter((o) => o.status === "ferdig").length;
  const fremdrift = oppgaver.length ? Math.round((ferdige / oppgaver.length) * 100) : 0;

  const estimert = budsjett.reduce((sum, p) => sum + Number(p.estimate || 0), 0);
  const faktisk = budsjett.reduce((sum, p) => sum + Number(p.actual ?? 0), 0);
  const betalt = budsjett.reduce((sum, p) => sum + Number(p.paid || 0), 0);

  const kommer = gjester.filter((g) => g.rsvp_status === "kommer").length;
  const venter = gjester.filter((g) => g.rsvp_status === "venter").length;
  const rsvpKommer = svar.filter((s) => s.attending).reduce((sum, s) => sum + s.num_adults + s.num_children, 0);
  const ubehandlede = svar.filter((s) => !s.processed).length;

  const naMnd = new Date().toISOString().slice(0, 7);
  const nesteMilepal = milepaler.find((m) => !m.done && m.month >= naMnd) ?? milepaler.find((m) => !m.done);

  const kritiske = oppgaver
    .filter((o) => o.status !== "ferdig" && (o.priority === "kritisk" || o.priority === "hoy"))
    .sort((a, b) => (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999"))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-sage-800">00 · Dashboard</h1>
          <p className="text-sm text-sage-600">Prosjektets kontrollsenter</p>
        </div>
        <p className="text-sm text-sage-600">Bryllupsdag: lørdag 7. august 2027</p>
      </div>

      {/* Nøkkeltall */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kort tittel="Dager igjen" verdi={String(dagerIgjen())} under="til 7. august 2027" emoji="💍" />
        <Kort tittel="Fremdrift masterplan" verdi={`${fremdrift} %`} under={`${ferdige} av ${oppgaver.length} oppgaver ferdig`} emoji="✅">
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-cream-200">
            <div className="h-full rounded-full bg-sage-600 transition-all" style={{ width: `${fremdrift}%` }} />
          </div>
        </Kort>
        <Kort
          tittel="Budsjett"
          verdi={formatNOK(estimert)}
          under={`${totalramme ? `ramme ${formatNOK(totalramme)} · ` : ""}betalt ${formatNOK(betalt)}`}
          emoji="💰"
        >
          {totalramme > 0 && (
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-cream-200">
              <div
                className={`h-full rounded-full transition-all ${estimert > totalramme ? "bg-red-500" : "bg-gold-500"}`}
                style={{ width: `${Math.min(100, Math.round((estimert / totalramme) * 100))}%` }}
              />
            </div>
          )}
        </Kort>
        <Kort
          tittel="Gjester"
          verdi={`${kommer + rsvpKommer}`}
          under={`bekreftet · ${venter} venter svar${ubehandlede ? ` · ${ubehandlede} nye svar!` : ""}`}
          emoji="👥"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Kritiske oppgaver */}
        <div className="rounded-2xl border border-cream-300 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl text-sage-800">Viktigste oppgaver nå</h2>
            <Link to="/plan/masterplan" className="text-sm text-gold-600 hover:underline">
              Masterplan →
            </Link>
          </div>
          <ul className="mt-4 space-y-2">
            {kritiske.length === 0 && <li className="text-sm text-sage-600">Ingen åpne høyprioritetsoppgaver. 🎉</li>}
            {kritiske.map((o) => (
              <li key={o.id} className="flex items-center gap-3 rounded-lg border border-cream-200 px-3 py-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITET_FARGE[o.priority]}`}>
                  {o.priority === "kritisk" ? "Kritisk" : "Høy"}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-sage-800">{o.title}</span>
                <span className="shrink-0 text-xs text-sage-500">{formatDato(o.due_date)}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Neste milepæl + nye svar */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-cream-300 bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl text-sage-800">Neste milepæl</h2>
              <Link to="/plan/tidslinje" className="text-sm text-gold-600 hover:underline">
                Tidslinje →
              </Link>
            </div>
            {nesteMilepal ? (
              <div className="mt-4 rounded-xl bg-sage-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-sage-500">{formatMnd(nesteMilepal.month)}</p>
                <p className="font-display mt-1 text-lg text-sage-800">{nesteMilepal.title}</p>
                {nesteMilepal.description && <p className="mt-1 text-sm text-sage-600">{nesteMilepal.description}</p>}
              </div>
            ) : (
              <p className="mt-4 text-sm text-sage-600">Alle milepæler er fullført!</p>
            )}
          </div>

          <div className="rounded-2xl border border-cream-300 bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl text-sage-800">Siste svar fra gjester</h2>
              <Link to="/plan/svar" className="text-sm text-gold-600 hover:underline">
                Alle svar →
              </Link>
            </div>
            <ul className="mt-4 space-y-2">
              {svar.length === 0 && <li className="text-sm text-sage-600">Ingen svar ennå – del nettsiden med gjestene!</li>}
              {svar.slice(0, 5).map((s) => (
                <li key={s.id} className="flex items-center gap-3 text-sm">
                  <span>{s.attending ? "🎉" : "😢"}</span>
                  <span className="min-w-0 flex-1 truncate text-sage-800">{s.name}</span>
                  <span className="text-xs text-sage-500">
                    {s.attending ? `${s.num_adults + s.num_children} pers.` : "kommer ikke"}
                    {!s.processed && <span className="ml-2 rounded-full bg-gold-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">NY</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function Kort({
  tittel,
  verdi,
  under,
  emoji,
  children,
}: {
  tittel: string;
  verdi: string;
  under: string;
  emoji: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-cream-300 bg-white p-5">
      <div className="flex items-center justify-between text-sm text-sage-600">
        <span>{tittel}</span>
        <span className="text-lg">{emoji}</span>
      </div>
      <div className="font-display mt-1 text-3xl font-semibold text-sage-900">{verdi}</div>
      <p className="mt-0.5 text-xs text-sage-500">{under}</p>
      {children}
    </div>
  );
}
