import { useCallback, useState } from "react";
import { supabase } from "../../lib/supabase";
import type { Rsvp } from "../../lib/types";
import { useLast, varsleEndring } from "../../lib/utils";

export default function Svar() {
  const [svar, setSvar] = useState<Rsvp[]>([]);

  const last = useCallback(async () => {
    const { data } = await supabase.from("rsvps").select("*").order("created_at", { ascending: false });
    setSvar((data as Rsvp[]) ?? []);
  }, []);
  const { laster, oppdater } = useLast(last);

  const merk = async (id: string, processed: boolean) => {
    await supabase.from("rsvps").update({ processed }).eq("id", id);
    await oppdater();
    varsleEndring();
  };

  const tilGjesteliste = async (s: Rsvp) => {
    // Oppretter én gjest per navn (navnene kan være "Kari og Ola")
    await supabase.from("guests").insert({
      name: s.name,
      email: s.email,
      phone: s.phone,
      rsvp_status: s.attending ? "kommer" : "kommer_ikke",
      allergies: s.allergies,
      song_wish: s.song_wish,
      notes: s.message ? `Hilsen: ${s.message}` : null,
    });
    await merk(s.id, true);
    alert("Lagt til i gjestelisten. Del gjerne opp følget i enkeltpersoner der.");
  };

  if (laster) return <p className="text-sage-600">Laster svar …</p>;

  const kommerTotalt = svar.filter((s) => s.attending).reduce((sum, s) => sum + s.num_adults + s.num_children, 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl text-sage-800">💌 Innkomne svar</h1>
        <p className="text-sm text-sage-600">
          {svar.length} svar mottatt · {kommerTotalt} personer har sagt ja
        </p>
      </div>

      <div className="space-y-3">
        {svar.length === 0 && <p className="text-sage-600">Ingen svar ennå. Del invitasjonssiden med gjestene!</p>}
        {svar.map((s) => (
          <div key={s.id} className={`rounded-2xl border bg-white p-5 ${s.processed ? "border-cream-200 opacity-70" : "border-gold-300"}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-sage-900">
                  {s.attending ? "🎉" : "😢"} {s.name}
                  {!s.processed && <span className="ml-2 rounded-full bg-gold-500 px-2 py-0.5 text-xs font-semibold text-white">NY</span>}
                </p>
                <p className="mt-0.5 text-sm text-sage-600">
                  {s.attending ? `Kommer · ${s.num_adults} voksne${s.num_children ? `, ${s.num_children} barn` : ""}` : "Kommer ikke"}
                  {" · "}
                  {new Date(s.created_at).toLocaleDateString("nb-NO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
                <div className="mt-2 space-y-1 text-sm text-sage-700">
                  {s.email && <p>📧 {s.email}</p>}
                  {s.phone && <p>📱 {s.phone}</p>}
                  {s.allergies && <p>⚠️ Allergier: {s.allergies}</p>}
                  {s.song_wish && <p>🎵 Låtønske: {s.song_wish}</p>}
                  {s.message && <p className="italic">«{s.message}»</p>}
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-2">
                {s.attending && (
                  <button onClick={() => tilGjesteliste(s)} className="btn-secondary text-xs">
                    → Legg til i gjestelisten
                  </button>
                )}
                <button onClick={() => merk(s.id, !s.processed)} className="text-xs text-sage-600 hover:text-sage-800">
                  {s.processed ? "Merk som ny" : "Merk som behandlet ✓"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
