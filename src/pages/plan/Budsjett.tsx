import { useCallback, useState } from "react";
import { supabase } from "../../lib/supabase";
import type { BudgetItem } from "../../lib/types";
import { BETALING_LABEL, formatNOK, useLast, varsleEndring } from "../../lib/utils";

export default function Budsjett() {
  const [rader, setRader] = useState<BudgetItem[]>([]);
  const [totalramme, setTotalramme] = useState(0);
  const [nyNavn, setNyNavn] = useState("");

  const last = useCallback(async () => {
    const [b, s] = await Promise.all([
      supabase.from("budget_items").select("*").order("created_at"),
      supabase.from("settings").select("value").eq("key", "budsjett"),
    ]);
    setRader((b.data as BudgetItem[]) ?? []);
    setTotalramme(Number((s.data?.[0]?.value as { totalramme?: number } | undefined)?.totalramme ?? 0));
  }, []);
  const { laster, oppdater } = useLast(last);

  const oppdaterFelt = async (id: string, felt: Partial<BudgetItem>) => {
    await supabase.from("budget_items").update(felt).eq("id", id);
    await oppdater();
    varsleEndring();
  };

  const lagreRamme = async (verdi: number) => {
    await supabase.from("settings").upsert({ key: "budsjett", value: { totalramme: verdi } });
    await oppdater();
  };

  const leggTil = async () => {
    if (!nyNavn.trim()) return;
    await supabase.from("budget_items").insert({ name: nyNavn.trim() });
    setNyNavn("");
    await oppdater();
  };

  const slett = async (id: string) => {
    if (!confirm("Slette budsjettposten?")) return;
    await supabase.from("budget_items").delete().eq("id", id);
    await oppdater();
  };

  if (laster) return <p className="text-sage-600">Laster budsjett …</p>;

  const estimert = rader.reduce((s, r) => s + Number(r.estimate || 0), 0);
  const faktisk = rader.reduce((s, r) => s + Number(r.actual ?? r.estimate ?? 0), 0);
  const betalt = rader.reduce((s, r) => s + Number(r.paid || 0), 0);
  const rest = faktisk - betalt;

  const tall = (v: string) => (v.trim() === "" ? null : Number(v.replace(/\s/g, "").replace(",", ".")));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl text-sage-800">02 · Budsjett</h1>
        <p className="text-sm text-sage-600">Estimat, faktiske kostnader og betalingsstatus</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-cream-300 bg-white p-4">
          <p className="text-sm text-sage-600">Totalramme</p>
          <input
            type="number"
            defaultValue={totalramme || ""}
            placeholder="Sett ramme"
            onBlur={(e) => Number(e.target.value) !== totalramme && lagreRamme(Number(e.target.value || 0))}
            className="font-display mt-1 w-full bg-transparent text-2xl font-semibold text-sage-900 focus:outline-none"
          />
        </div>
        <Sum tittel="Estimert totalt" verdi={estimert} advarsel={totalramme > 0 && estimert > totalramme} />
        <Sum tittel="Forventet/faktisk" verdi={faktisk} />
        <Sum tittel="Betalt · rest" verdi={betalt} under={`rest ${formatNOK(rest)}`} />
      </div>

      <div className="flex gap-2">
        <input
          value={nyNavn}
          onChange={(e) => setNyNavn(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && leggTil()}
          placeholder="Ny budsjettpost …"
          className="plan-input max-w-md"
        />
        <button onClick={leggTil} className="btn-primary">
          + Legg til
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-cream-300 bg-white">
        <table className="plan-table w-full min-w-[1000px]">
          <thead>
            <tr>
              <th>Post</th>
              <th>Kategori</th>
              <th>Leverandør</th>
              <th className="text-right">Estimat</th>
              <th className="text-right">Faktisk</th>
              <th className="text-right">Depositum</th>
              <th className="text-right">Betalt</th>
              <th>Status</th>
              <th>Forfall</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rader.map((r) => (
              <tr key={r.id}>
                <td className="min-w-[180px]">
                  <input
                    defaultValue={r.name}
                    onBlur={(e) => e.target.value !== r.name && oppdaterFelt(r.id, { name: e.target.value })}
                    className="w-full bg-transparent focus:outline-none"
                  />
                </td>
                <td>
                  <input
                    defaultValue={r.category ?? ""}
                    onBlur={(e) => e.target.value !== (r.category ?? "") && oppdaterFelt(r.id, { category: e.target.value || null })}
                    className="w-24 bg-transparent focus:outline-none"
                  />
                </td>
                <td>
                  <input
                    defaultValue={r.vendor ?? ""}
                    placeholder="–"
                    onBlur={(e) => e.target.value !== (r.vendor ?? "") && oppdaterFelt(r.id, { vendor: e.target.value || null })}
                    className="w-28 bg-transparent focus:outline-none"
                  />
                </td>
                <td className="text-right">
                  <input
                    defaultValue={r.estimate || ""}
                    onBlur={(e) => tall(e.target.value) !== r.estimate && oppdaterFelt(r.id, { estimate: tall(e.target.value) ?? 0 })}
                    className="w-24 bg-transparent text-right tabular-nums focus:outline-none"
                  />
                </td>
                <td className="text-right">
                  <input
                    defaultValue={r.actual ?? ""}
                    placeholder="–"
                    onBlur={(e) => tall(e.target.value) !== r.actual && oppdaterFelt(r.id, { actual: tall(e.target.value) })}
                    className="w-24 bg-transparent text-right tabular-nums focus:outline-none"
                  />
                </td>
                <td className="text-right">
                  <input
                    defaultValue={r.deposit || ""}
                    placeholder="0"
                    onBlur={(e) => tall(e.target.value) !== r.deposit && oppdaterFelt(r.id, { deposit: tall(e.target.value) ?? 0 })}
                    className="w-24 bg-transparent text-right tabular-nums focus:outline-none"
                  />
                </td>
                <td className="text-right">
                  <input
                    defaultValue={r.paid || ""}
                    placeholder="0"
                    onBlur={(e) => tall(e.target.value) !== r.paid && oppdaterFelt(r.id, { paid: tall(e.target.value) ?? 0 })}
                    className="w-24 bg-transparent text-right tabular-nums focus:outline-none"
                  />
                </td>
                <td>
                  <select
                    value={r.payment_status}
                    onChange={(e) => oppdaterFelt(r.id, { payment_status: e.target.value as BudgetItem["payment_status"] })}
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      r.payment_status === "betalt" ? "bg-sage-100 text-sage-800" : r.payment_status === "ikke_betalt" ? "bg-cream-200 text-sage-700" : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {Object.entries(BETALING_LABEL).map(([v, l]) => (
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
                  <button onClick={() => slett(r.id)} className="btn-danger">
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-cream-100 font-semibold">
              <td colSpan={3}>Sum</td>
              <td className="text-right tabular-nums">{formatNOK(estimert)}</td>
              <td className="text-right tabular-nums">{formatNOK(faktisk)}</td>
              <td />
              <td className="text-right tabular-nums">{formatNOK(betalt)}</td>
              <td colSpan={3} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function Sum({ tittel, verdi, under, advarsel }: { tittel: string; verdi: number; under?: string; advarsel?: boolean }) {
  return (
    <div className={`rounded-2xl border bg-white p-4 ${advarsel ? "border-red-300" : "border-cream-300"}`}>
      <p className="text-sm text-sage-600">{tittel}</p>
      <p className={`font-display mt-1 text-2xl font-semibold ${advarsel ? "text-red-700" : "text-sage-900"}`}>
        {formatNOK(verdi)}
        {advarsel && " ⚠️"}
      </p>
      {under && <p className="text-xs text-sage-500">{under}</p>}
    </div>
  );
}
