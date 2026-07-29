import { useCallback, useState } from "react";
import { supabase } from "../../lib/supabase";
import type { ScheduleItem } from "../../lib/types";
import { useLast, varsleEndring } from "../../lib/utils";

const DAGER: { key: ScheduleItem["day"]; navn: string; dato: string }[] = [
  { key: "fredag", navn: "Fredag – rigging", dato: "6. august 2027" },
  { key: "lordag", navn: "Lørdag – bryllupsdagen", dato: "7. august 2027" },
  { key: "sondag", navn: "Søndag – opprydding", dato: "8. august 2027" },
];

export default function Kjoreplan() {
  const [rader, setRader] = useState<ScheduleItem[]>([]);
  const [dag, setDag] = useState<ScheduleItem["day"]>("lordag");
  const [nyTid, setNyTid] = useState("12:00");
  const [nyTittel, setNyTittel] = useState("");

  const last = useCallback(async () => {
    const { data } = await supabase.from("schedule_items").select("*").order("time").order("sort_order");
    setRader((data as ScheduleItem[]) ?? []);
  }, []);
  const { laster, oppdater } = useLast(last);

  const oppdaterFelt = async (id: string, felt: Partial<ScheduleItem>) => {
    await supabase.from("schedule_items").update(felt).eq("id", id);
    await oppdater();
    varsleEndring();
  };

  const leggTil = async () => {
    if (!nyTittel.trim()) return;
    await supabase.from("schedule_items").insert({ day: dag, time: nyTid, title: nyTittel.trim() });
    setNyTittel("");
    await oppdater();
  };

  const slett = async (id: string) => {
    if (!confirm("Slette punktet?")) return;
    await supabase.from("schedule_items").delete().eq("id", id);
    await oppdater();
  };

  if (laster) return <p className="text-sage-600">Laster kjøreplan …</p>;

  const valgtDag = DAGER.find((d) => d.key === dag)!;
  const punkter = rader.filter((r) => r.day === dag);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl text-sage-800">06 · Bryllupshelgen</h1>
        <p className="text-sm text-sage-600">Detaljert kjøreplan – hvem gjør hva, når og hvor</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {DAGER.map((d) => (
          <button
            key={d.key}
            onClick={() => setDag(d.key)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              dag === d.key ? "bg-sage-700 text-white" : "border border-cream-300 bg-white text-sage-700 hover:bg-sage-50"
            }`}
          >
            {d.navn}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <input type="time" value={nyTid} onChange={(e) => setNyTid(e.target.value)} className="plan-input w-auto" />
        <input
          value={nyTittel}
          onChange={(e) => setNyTittel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && leggTil()}
          placeholder={`Nytt punkt for ${valgtDag.navn.toLowerCase()} …`}
          className="plan-input max-w-md"
        />
        <button onClick={leggTil} className="btn-primary">
          + Legg til
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-cream-300 bg-white">
        <p className="border-b border-cream-200 px-4 py-3 text-sm font-medium text-sage-600">{valgtDag.dato}</p>
        <table className="plan-table w-full min-w-[800px]">
          <thead>
            <tr>
              <th>Kl.</th>
              <th>Varighet</th>
              <th>Hva skjer</th>
              <th>Ansvarlig</th>
              <th>Sted</th>
              <th>Notater</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {punkter.map((r) => (
              <tr key={r.id}>
                <td>
                  <input
                    type="time"
                    defaultValue={r.time}
                    onBlur={(e) => e.target.value !== r.time && oppdaterFelt(r.id, { time: e.target.value })}
                    className="font-display bg-transparent text-base font-semibold text-gold-600 focus:outline-none"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    defaultValue={r.duration_min ?? ""}
                    placeholder="min"
                    onBlur={(e) => Number(e.target.value) !== r.duration_min && oppdaterFelt(r.id, { duration_min: Number(e.target.value) || null })}
                    className="w-16 bg-transparent tabular-nums focus:outline-none"
                  />
                  <span className="text-xs text-sage-500"> min</span>
                </td>
                <td className="min-w-[220px]">
                  <input
                    defaultValue={r.title}
                    onBlur={(e) => e.target.value !== r.title && oppdaterFelt(r.id, { title: e.target.value })}
                    className="w-full bg-transparent font-medium focus:outline-none"
                  />
                </td>
                <td>
                  <input
                    defaultValue={r.responsible ?? ""}
                    placeholder="–"
                    onBlur={(e) => e.target.value !== (r.responsible ?? "") && oppdaterFelt(r.id, { responsible: e.target.value || null })}
                    className="w-32 bg-transparent focus:outline-none"
                  />
                </td>
                <td>
                  <input
                    defaultValue={r.location ?? ""}
                    placeholder="–"
                    onBlur={(e) => e.target.value !== (r.location ?? "") && oppdaterFelt(r.id, { location: e.target.value || null })}
                    className="w-32 bg-transparent focus:outline-none"
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
                  <button onClick={() => slett(r.id)} className="btn-danger">
                    ✕
                  </button>
                </td>
              </tr>
            ))}
            {punkter.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-sage-500">
                  Ingen punkter for denne dagen ennå.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
