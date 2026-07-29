import { useCallback, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import type { ModuleItem } from "../../lib/types";
import { finnModul } from "../../lib/moduler";
import { STATUS_FARGE, STATUS_LABEL, useLast, varsleEndring } from "../../lib/utils";

export default function Modul() {
  const { modulKey } = useParams();
  const modul = finnModul(modulKey);
  const [rader, setRader] = useState<ModuleItem[]>([]);
  const [nyTittel, setNyTittel] = useState("");

  const last = useCallback(async () => {
    if (!modulKey) return;
    const { data } = await supabase.from("module_items").select("*").eq("module", modulKey).order("sort_order").order("created_at");
    setRader((data as ModuleItem[]) ?? []);
  }, [modulKey]);
  const { laster, oppdater } = useLast(last);

  if (!modul) return <p className="text-sage-600">Ukjent modul.</p>;
  if (laster) return <p className="text-sage-600">Laster {modul.tittel.toLowerCase()} …</p>;

  const oppdaterFelt = async (id: string, felt: Partial<ModuleItem>) => {
    await supabase.from("module_items").update(felt).eq("id", id);
    await oppdater();
    varsleEndring();
  };

  const leggTil = async () => {
    if (!nyTittel.trim()) return;
    await supabase.from("module_items").insert({ module: modul.key, title: nyTittel.trim(), sort_order: rader.length + 1 });
    setNyTittel("");
    await oppdater();
  };

  const slett = async (id: string) => {
    if (!confirm("Slette punktet?")) return;
    await supabase.from("module_items").delete().eq("id", id);
    await oppdater();
  };

  const ferdige = rader.filter((r) => r.status === "ferdig").length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl text-sage-800">
          {modul.nr} · {modul.tittel} {modul.emoji}
        </h1>
        <p className="text-sm text-sage-600">{modul.beskrivelse}</p>
        {rader.length > 0 && (
          <p className="mt-1 text-xs text-sage-500">
            {ferdige} av {rader.length} punkter ferdig
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <input
          value={nyTittel}
          onChange={(e) => setNyTittel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && leggTil()}
          placeholder={`Nytt punkt i ${modul.tittel.toLowerCase()} …`}
          className="plan-input max-w-md"
        />
        <button onClick={leggTil} className="btn-primary">
          + Legg til
        </button>
      </div>

      <div className="space-y-2">
        {rader.length === 0 && <p className="text-sm text-sage-500">Ingen punkter ennå – legg til det første!</p>}
        {rader.map((r) => (
          <div key={r.id} className={`rounded-xl border bg-white p-4 ${r.status === "ferdig" ? "border-cream-200 opacity-70" : "border-cream-300"}`}>
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={r.status === "ferdig"}
                onChange={(e) => oppdaterFelt(r.id, { status: e.target.checked ? "ferdig" : "pagar" })}
                className="mt-1 h-4 w-4 accent-sage-700"
              />
              <div className="min-w-0 flex-1">
                <input
                  defaultValue={r.title}
                  onBlur={(e) => e.target.value !== r.title && oppdaterFelt(r.id, { title: e.target.value })}
                  className={`w-full bg-transparent font-medium focus:outline-none ${r.status === "ferdig" ? "line-through" : ""}`}
                />
                <textarea
                  defaultValue={r.notes ?? ""}
                  placeholder="Notater, beslutninger, detaljer …"
                  rows={r.notes ? Math.min(4, r.notes.split("\n").length) : 1}
                  onBlur={(e) => e.target.value !== (r.notes ?? "") && oppdaterFelt(r.id, { notes: e.target.value || null })}
                  className="mt-1 w-full resize-y bg-transparent text-sm text-sage-600 focus:outline-none"
                />
              </div>
              <select
                value={r.status}
                onChange={(e) => oppdaterFelt(r.id, { status: e.target.value as ModuleItem["status"] })}
                className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${STATUS_FARGE[r.status]}`}
              >
                {Object.entries(STATUS_LABEL).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
              <button onClick={() => slett(r.id)} className="btn-danger shrink-0">
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
