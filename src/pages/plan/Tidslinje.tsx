import { useCallback, useState } from "react";
import { supabase } from "../../lib/supabase";
import type { Milestone } from "../../lib/types";
import { formatMnd, useLast, varsleEndring } from "../../lib/utils";

export default function Tidslinje() {
  const [milepaler, setMilepaler] = useState<Milestone[]>([]);
  const [nyTittel, setNyTittel] = useState("");
  const [nyMnd, setNyMnd] = useState("2026-09");

  const last = useCallback(async () => {
    const { data } = await supabase.from("milestones").select("*").order("month").order("sort_order");
    setMilepaler((data as Milestone[]) ?? []);
  }, []);
  const { laster, oppdater } = useLast(last);

  const oppdaterFelt = async (id: string, felt: Partial<Milestone>) => {
    await supabase.from("milestones").update(felt).eq("id", id);
    await oppdater();
    varsleEndring();
  };

  const leggTil = async () => {
    if (!nyTittel.trim()) return;
    await supabase.from("milestones").insert({ title: nyTittel.trim(), month: nyMnd });
    setNyTittel("");
    await oppdater();
  };

  const slett = async (id: string) => {
    if (!confirm("Slette milepælen?")) return;
    await supabase.from("milestones").delete().eq("id", id);
    await oppdater();
  };

  if (laster) return <p className="text-sage-600">Laster tidslinje …</p>;

  const naMnd = new Date().toISOString().slice(0, 7);
  const grupper = [...new Set(milepaler.map((m) => m.month))].sort();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl text-sage-800">05 · Prosjekttidslinje</h1>
        <p className="text-sm text-sage-600">Planlegging måned for måned frem til bryllupet</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <input type="month" value={nyMnd} min="2026-07" max="2027-12" onChange={(e) => setNyMnd(e.target.value)} className="plan-input w-auto" />
        <input
          value={nyTittel}
          onChange={(e) => setNyTittel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && leggTil()}
          placeholder="Ny milepæl …"
          className="plan-input max-w-md"
        />
        <button onClick={leggTil} className="btn-primary">
          + Legg til
        </button>
      </div>

      <ol className="relative space-y-6 border-l-2 border-cream-300 pl-6">
        {grupper.map((mnd) => {
          const erNa = mnd === naMnd;
          const erFortid = mnd < naMnd;
          return (
            <li key={mnd} className="relative">
              <span
                className={`absolute -left-[31px] top-1 h-4 w-4 rounded-full border-2 ${
                  erNa ? "border-gold-500 bg-gold-500" : erFortid ? "border-sage-400 bg-sage-400" : "border-sage-300 bg-cream-50"
                }`}
              />
              <h2 className={`font-display text-xl capitalize ${erNa ? "text-gold-600" : "text-sage-800"}`}>
                {formatMnd(mnd)}
                {erNa && <span className="ml-2 rounded-full bg-gold-500 px-2 py-0.5 text-xs font-sans font-semibold text-white">Nå</span>}
              </h2>
              <div className="mt-2 space-y-2">
                {milepaler
                  .filter((m) => m.month === mnd)
                  .map((m) => (
                    <div key={m.id} className={`rounded-xl border bg-white p-3 ${m.done ? "border-cream-200 opacity-60" : "border-cream-300"}`}>
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={m.done}
                          onChange={(e) => oppdaterFelt(m.id, { done: e.target.checked })}
                          className="mt-1 h-4 w-4 accent-sage-700"
                        />
                        <div className="min-w-0 flex-1">
                          <input
                            defaultValue={m.title}
                            onBlur={(e) => e.target.value !== m.title && oppdaterFelt(m.id, { title: e.target.value })}
                            className={`w-full bg-transparent font-medium focus:outline-none ${m.done ? "line-through" : ""}`}
                          />
                          <input
                            defaultValue={m.description ?? ""}
                            placeholder="Beskrivelse …"
                            onBlur={(e) => e.target.value !== (m.description ?? "") && oppdaterFelt(m.id, { description: e.target.value || null })}
                            className="mt-0.5 w-full bg-transparent text-sm text-sage-600 focus:outline-none"
                          />
                        </div>
                        <button onClick={() => slett(m.id)} className="btn-danger">
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
