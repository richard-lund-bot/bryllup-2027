import { useCallback, useState } from "react";
import { supabase } from "../../lib/supabase";
import type { Guest, SeatingTable } from "../../lib/types";
import { RSVP_FARGE, RSVP_LABEL, useLast, varsleEndring } from "../../lib/utils";

export default function Gjesteliste() {
  const [gjester, setGjester] = useState<Guest[]>([]);
  const [bord, setBord] = useState<SeatingTable[]>([]);
  const [nyNavn, setNyNavn] = useState("");
  const [filter, setFilter] = useState("alle");

  const last = useCallback(async () => {
    const [g, b] = await Promise.all([
      supabase.from("guests").select("*").order("group_label").order("name"),
      supabase.from("seating_tables").select("*").order("sort_order"),
    ]);
    setGjester((g.data as Guest[]) ?? []);
    setBord((b.data as SeatingTable[]) ?? []);
  }, []);
  const { laster, oppdater } = useLast(last);

  const oppdaterFelt = async (id: string, felt: Partial<Guest>) => {
    await supabase.from("guests").update(felt).eq("id", id);
    await oppdater();
    varsleEndring();
  };

  const leggTil = async () => {
    if (!nyNavn.trim()) return;
    await supabase.from("guests").insert({ name: nyNavn.trim() });
    setNyNavn("");
    await oppdater();
  };

  const slett = async (id: string) => {
    if (!confirm("Slette gjesten?")) return;
    await supabase.from("guests").delete().eq("id", id);
    await oppdater();
  };

  if (laster) return <p className="text-sage-600">Laster gjesteliste …</p>;

  const kommer = gjester.filter((g) => g.rsvp_status === "kommer");
  const synlige = filter === "alle" ? gjester : gjester.filter((g) => g.rsvp_status === filter);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-sage-800">03 · Gjesteliste</h1>
          <p className="text-sm text-sage-600">
            {gjester.length} på listen · {kommer.length} bekreftet ({kommer.filter((g) => !g.is_child).length} voksne,{" "}
            {kommer.filter((g) => g.is_child).length} barn) · {gjester.filter((g) => g.rsvp_status === "venter").length} venter
          </p>
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="plan-input w-auto">
          <option value="alle">Alle</option>
          {Object.entries(RSVP_LABEL).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2">
        <input
          value={nyNavn}
          onChange={(e) => setNyNavn(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && leggTil()}
          placeholder="Legg til gjest …"
          className="plan-input max-w-md"
        />
        <button onClick={leggTil} className="btn-primary">
          + Legg til
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-cream-300 bg-white">
        <table className="plan-table w-full min-w-[1100px]">
          <thead>
            <tr>
              <th>Navn</th>
              <th>Gruppe</th>
              <th>RSVP</th>
              <th>Barn</th>
              <th>Allergier</th>
              <th>Bord</th>
              <th>Tale</th>
              <th>Låtønske</th>
              <th>Kontakt</th>
              <th>Gave</th>
              <th>Takkekort</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {synlige.map((g) => (
              <tr key={g.id}>
                <td className="min-w-[160px]">
                  <input
                    defaultValue={g.name}
                    onBlur={(e) => e.target.value !== g.name && oppdaterFelt(g.id, { name: e.target.value })}
                    className="w-full bg-transparent font-medium focus:outline-none"
                  />
                </td>
                <td>
                  <input
                    defaultValue={g.group_label ?? ""}
                    placeholder="–"
                    onBlur={(e) => e.target.value !== (g.group_label ?? "") && oppdaterFelt(g.id, { group_label: e.target.value || null })}
                    className="w-24 bg-transparent focus:outline-none"
                  />
                </td>
                <td>
                  <select
                    value={g.rsvp_status}
                    onChange={(e) => oppdaterFelt(g.id, { rsvp_status: e.target.value as Guest["rsvp_status"] })}
                    className={`rounded-full px-2 py-1 text-xs font-medium ${RSVP_FARGE[g.rsvp_status]}`}
                  >
                    {Object.entries(RSVP_LABEL).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="text-center">
                  <input type="checkbox" checked={g.is_child} onChange={(e) => oppdaterFelt(g.id, { is_child: e.target.checked })} className="h-4 w-4 accent-sage-700" />
                </td>
                <td>
                  <input
                    defaultValue={g.allergies ?? ""}
                    placeholder="–"
                    onBlur={(e) => e.target.value !== (g.allergies ?? "") && oppdaterFelt(g.id, { allergies: e.target.value || null })}
                    className="w-28 bg-transparent focus:outline-none"
                  />
                </td>
                <td>
                  <select
                    value={g.table_id ?? ""}
                    onChange={(e) => oppdaterFelt(g.id, { table_id: e.target.value || null })}
                    className="plan-input w-28 py-1"
                  >
                    <option value="">–</option>
                    {bord.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="text-center">
                  <input type="checkbox" checked={g.speech} onChange={(e) => oppdaterFelt(g.id, { speech: e.target.checked })} className="h-4 w-4 accent-sage-700" title="Skal holde tale" />
                </td>
                <td>
                  <input
                    defaultValue={g.song_wish ?? ""}
                    placeholder="–"
                    onBlur={(e) => e.target.value !== (g.song_wish ?? "") && oppdaterFelt(g.id, { song_wish: e.target.value || null })}
                    className="w-28 bg-transparent focus:outline-none"
                  />
                </td>
                <td>
                  <input
                    defaultValue={g.email ?? g.phone ?? ""}
                    placeholder="e-post/tlf"
                    onBlur={(e) => e.target.value !== (g.email ?? g.phone ?? "") && oppdaterFelt(g.id, { email: e.target.value || null })}
                    className="w-36 bg-transparent focus:outline-none"
                  />
                </td>
                <td>
                  <input
                    defaultValue={g.gift ?? ""}
                    placeholder="–"
                    onBlur={(e) => e.target.value !== (g.gift ?? "") && oppdaterFelt(g.id, { gift: e.target.value || null })}
                    className="w-28 bg-transparent focus:outline-none"
                  />
                </td>
                <td className="text-center">
                  <input type="checkbox" checked={g.thank_you_sent} onChange={(e) => oppdaterFelt(g.id, { thank_you_sent: e.target.checked })} className="h-4 w-4 accent-sage-700" title="Takkekort sendt" />
                </td>
                <td>
                  <button onClick={() => slett(g.id)} className="btn-danger">
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
