import { useCallback, useState } from "react";
import { supabase } from "../../lib/supabase";
import type { Guest, SeatingTable } from "../../lib/types";
import { useLast, varsleEndring } from "../../lib/utils";

export default function Bordplassering() {
  const [bord, setBord] = useState<SeatingTable[]>([]);
  const [gjester, setGjester] = useState<Guest[]>([]);
  const [valgtGjest, setValgtGjest] = useState<string | null>(null);
  const [nyttBord, setNyttBord] = useState("");

  const last = useCallback(async () => {
    const [b, g] = await Promise.all([
      supabase.from("seating_tables").select("*").order("sort_order"),
      supabase.from("guests").select("*").neq("rsvp_status", "kommer_ikke").order("name"),
    ]);
    setBord((b.data as SeatingTable[]) ?? []);
    setGjester((g.data as Guest[]) ?? []);
  }, []);
  const { laster, oppdater } = useLast(last);

  const plasser = async (gjestId: string, bordId: string | null) => {
    await supabase.from("guests").update({ table_id: bordId }).eq("id", gjestId);
    setValgtGjest(null);
    await oppdater();
    varsleEndring();
  };

  const leggTilBord = async () => {
    if (!nyttBord.trim()) return;
    await supabase.from("seating_tables").insert({ name: nyttBord.trim(), sort_order: bord.length + 1 });
    setNyttBord("");
    await oppdater();
  };

  const oppdaterBord = async (id: string, felt: Partial<SeatingTable>) => {
    await supabase.from("seating_tables").update(felt).eq("id", id);
    await oppdater();
  };

  const slettBord = async (id: string) => {
    if (!confirm("Slette bordet? Gjestene blir stående uten plass.")) return;
    await supabase.from("seating_tables").delete().eq("id", id);
    await oppdater();
  };

  if (laster) return <p className="text-sage-600">Laster bordplassering …</p>;

  const uplasserte = gjester.filter((g) => !g.table_id);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl text-sage-800">04 · Bordplassering</h1>
        <p className="text-sm text-sage-600">
          Klikk på en gjest, og deretter på bordet der hen skal sitte. Kan endres helt frem til bryllupet.
        </p>
      </div>

      <div className="flex gap-2">
        <input
          value={nyttBord}
          onChange={(e) => setNyttBord(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && leggTilBord()}
          placeholder="Nytt bord …"
          className="plan-input max-w-xs"
        />
        <button onClick={leggTilBord} className="btn-primary">
          + Legg til bord
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Uplasserte gjester */}
        <div className="rounded-2xl border border-dashed border-sage-200 bg-cream-100 p-4">
          <h2 className="font-display text-lg text-sage-800">Uten bord ({uplasserte.length})</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {uplasserte.length === 0 && <p className="text-sm text-sage-600">Alle gjester har fått plass! 🎉</p>}
            {uplasserte.map((g) => (
              <button
                key={g.id}
                onClick={() => setValgtGjest(valgtGjest === g.id ? null : g.id)}
                className={`rounded-full px-3 py-1.5 text-sm transition ${
                  valgtGjest === g.id ? "bg-gold-500 text-white ring-2 ring-gold-300" : "bg-white text-sage-800 hover:bg-sage-50 border border-cream-300"
                }`}
              >
                {g.name}
                {g.is_child && " 🧒"}
              </button>
            ))}
          </div>
          {valgtGjest && <p className="mt-3 text-xs text-sage-600">Klikk på et bord for å plassere gjesten →</p>}
        </div>

        {/* Bordene */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:col-span-2">
          {bord.map((b) => {
            const vedBordet = gjester.filter((g) => g.table_id === b.id);
            const fullt = vedBordet.length >= b.capacity;
            return (
              <div
                key={b.id}
                onClick={() => valgtGjest && !fullt && plasser(valgtGjest, b.id)}
                className={`rounded-2xl border bg-white p-4 transition ${
                  valgtGjest ? (fullt ? "cursor-not-allowed opacity-50" : "cursor-pointer border-gold-500 ring-2 ring-gold-300/50") : "border-cream-300"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <input
                    defaultValue={b.name}
                    onClick={(e) => e.stopPropagation()}
                    onBlur={(e) => e.target.value !== b.name && oppdaterBord(b.id, { name: e.target.value })}
                    className="font-display w-full bg-transparent text-lg text-sage-800 focus:outline-none"
                  />
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${fullt ? "bg-red-100 text-red-800" : "bg-sage-100 text-sage-700"}`}>
                    {vedBordet.length}/
                    <input
                      type="number"
                      defaultValue={b.capacity}
                      min={1}
                      onClick={(e) => e.stopPropagation()}
                      onBlur={(e) => Number(e.target.value) !== b.capacity && oppdaterBord(b.id, { capacity: Number(e.target.value) || 8 })}
                      className="w-8 bg-transparent text-center focus:outline-none"
                    />
                  </span>
                  <button onClick={(e) => { e.stopPropagation(); void slettBord(b.id); }} className="btn-danger shrink-0">
                    ✕
                  </button>
                </div>
                <ul className="mt-3 space-y-1">
                  {vedBordet.map((g) => (
                    <li key={g.id} className="flex items-center justify-between rounded-lg bg-cream-100 px-2.5 py-1.5 text-sm text-sage-800">
                      <span>
                        {g.name}
                        {g.is_child && " 🧒"}
                        {g.speech && " 🎤"}
                        {g.allergies && <span title={g.allergies}> ⚠️</span>}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); void plasser(g.id, null); }}
                        className="text-sage-400 hover:text-sage-700"
                        title="Fjern fra bordet"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                  {vedBordet.length === 0 && <li className="text-sm italic text-sage-400">Tomt bord</li>}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
      <p className="text-xs text-sage-500">🧒 = barn · 🎤 = holder tale · ⚠️ = allergier (hold musepekeren over for detaljer)</p>
    </div>
  );
}
