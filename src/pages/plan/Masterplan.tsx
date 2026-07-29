import { useCallback, useState } from "react";
import { supabase } from "../../lib/supabase";
import type { Task } from "../../lib/types";
import { PRIORITET_FARGE, PRIORITET_LABEL, STATUS_FARGE, STATUS_LABEL, useLast, varsleEndring } from "../../lib/utils";

export default function Masterplan() {
  const [rader, setRader] = useState<Task[]>([]);
  const [filter, setFilter] = useState<string>("alle");
  const [nyTittel, setNyTittel] = useState("");

  const last = useCallback(async () => {
    const { data } = await supabase.from("tasks").select("*").order("sort_order").order("created_at");
    setRader((data as Task[]) ?? []);
  }, []);
  const { laster, oppdater } = useLast(last);

  const oppdaterFelt = async (id: string, felt: Partial<Task>) => {
    await supabase.from("tasks").update(felt).eq("id", id);
    await oppdater();
    varsleEndring();
  };

  const leggTil = async () => {
    if (!nyTittel.trim()) return;
    await supabase.from("tasks").insert({ title: nyTittel.trim(), sort_order: rader.length + 1 });
    setNyTittel("");
    await oppdater();
  };

  const slett = async (id: string) => {
    if (!confirm("Slette oppgaven?")) return;
    await supabase.from("tasks").delete().eq("id", id);
    await oppdater();
  };

  if (laster) return <p className="text-sage-600">Laster masterplan …</p>;

  const kategorier = [...new Set(rader.map((r) => r.category ?? "Generelt"))].sort();
  const synlige = filter === "alle" ? rader : rader.filter((r) => (r.category ?? "Generelt") === filter);
  const ferdige = rader.filter((r) => r.status === "ferdig").length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-sage-800">01 · Masterplan</h1>
          <p className="text-sm text-sage-600">
            {ferdige} av {rader.length} hovedoppgaver fullført
          </p>
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="plan-input w-auto">
          <option value="alle">Alle kategorier</option>
          {kategorier.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2">
        <input
          value={nyTittel}
          onChange={(e) => setNyTittel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && leggTil()}
          placeholder="Ny oppgave …"
          className="plan-input max-w-md"
        />
        <button onClick={leggTil} className="btn-primary">
          + Legg til
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-cream-300 bg-white">
        <table className="plan-table w-full min-w-[900px]">
          <thead>
            <tr>
              <th className="w-10">✓</th>
              <th>Oppgave</th>
              <th>Kategori</th>
              <th>Status</th>
              <th>Prioritet</th>
              <th>Frist</th>
              <th>Ansvarlig</th>
              <th>Notater</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {synlige.map((r) => (
              <tr key={r.id} className={r.status === "ferdig" ? "opacity-60" : ""}>
                <td>
                  <input
                    type="checkbox"
                    checked={r.status === "ferdig"}
                    onChange={(e) => oppdaterFelt(r.id, { status: e.target.checked ? "ferdig" : "pagar" })}
                    className="h-4 w-4 accent-sage-700"
                  />
                </td>
                <td className="min-w-[220px]">
                  <input
                    defaultValue={r.title}
                    onBlur={(e) => e.target.value !== r.title && oppdaterFelt(r.id, { title: e.target.value })}
                    className="w-full bg-transparent focus:outline-none"
                  />
                </td>
                <td>
                  <input
                    defaultValue={r.category ?? ""}
                    onBlur={(e) => e.target.value !== (r.category ?? "") && oppdaterFelt(r.id, { category: e.target.value || null })}
                    className="w-28 bg-transparent focus:outline-none"
                  />
                </td>
                <td>
                  <select
                    value={r.status}
                    onChange={(e) => oppdaterFelt(r.id, { status: e.target.value as Task["status"] })}
                    className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_FARGE[r.status]}`}
                  >
                    {Object.entries(STATUS_LABEL).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <select
                    value={r.priority}
                    onChange={(e) => oppdaterFelt(r.id, { priority: e.target.value as Task["priority"] })}
                    className={`rounded-full px-2 py-1 text-xs font-medium ${PRIORITET_FARGE[r.priority]}`}
                  >
                    {Object.entries(PRIORITET_LABEL).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="date"
                    defaultValue={r.due_date ?? ""}
                    onBlur={(e) => e.target.value !== (r.due_date ?? "") && oppdaterFelt(r.id, { due_date: e.target.value || null })}
                    className="bg-transparent text-sm focus:outline-none"
                  />
                </td>
                <td>
                  <input
                    defaultValue={r.assignee ?? ""}
                    placeholder="–"
                    onBlur={(e) => e.target.value !== (r.assignee ?? "") && oppdaterFelt(r.id, { assignee: e.target.value || null })}
                    className="w-24 bg-transparent focus:outline-none"
                  />
                </td>
                <td>
                  <input
                    defaultValue={r.notes ?? ""}
                    placeholder="–"
                    onBlur={(e) => e.target.value !== (r.notes ?? "") && oppdaterFelt(r.id, { notes: e.target.value || null })}
                    className="w-40 bg-transparent focus:outline-none"
                  />
                </td>
                <td>
                  <button onClick={() => slett(r.id)} className="btn-danger" title="Slett">
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
