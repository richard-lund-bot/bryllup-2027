import { useCallback, useState } from "react";
import { supabase } from "../../lib/supabase";
import type { WishlistItem } from "../../lib/types";
import { useLast, varsleEndring } from "../../lib/utils";

export default function OnskelisteAdmin() {
  const [rader, setRader] = useState<WishlistItem[]>([]);
  const [nyTittel, setNyTittel] = useState("");

  const last = useCallback(async () => {
    const { data } = await supabase.from("wishlist_items").select("*").order("sort_order").order("created_at");
    setRader((data as WishlistItem[]) ?? []);
  }, []);
  const { laster, oppdater } = useLast(last);

  const oppdaterFelt = async (id: string, felt: Partial<WishlistItem>) => {
    await supabase.from("wishlist_items").update(felt).eq("id", id);
    await oppdater();
    varsleEndring();
  };

  const leggTil = async () => {
    if (!nyTittel.trim()) return;
    await supabase.from("wishlist_items").insert({ title: nyTittel.trim(), sort_order: rader.length + 1 });
    setNyTittel("");
    await oppdater();
  };

  const slett = async (id: string) => {
    if (!confirm("Slette ønsket?")) return;
    await supabase.from("wishlist_items").delete().eq("id", id);
    await oppdater();
  };

  if (laster) return <p className="text-sage-600">Laster ønskeliste …</p>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl text-sage-800">🎁 Ønskeliste</h1>
        <p className="text-sm text-sage-600">
          Ønskene vises på invitasjonssiden, der gjestene kan reservere dem. {rader.filter((r) => r.reserved_by).length} av{" "}
          {rader.length} er reservert.
        </p>
      </div>

      <div className="flex gap-2">
        <input
          value={nyTittel}
          onChange={(e) => setNyTittel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && leggTil()}
          placeholder="Nytt ønske …"
          className="plan-input max-w-md"
        />
        <button onClick={leggTil} className="btn-primary">
          + Legg til
        </button>
      </div>

      <div className="space-y-3">
        {rader.map((r) => (
          <div key={r.id} className={`rounded-2xl border bg-white p-4 ${r.active ? "border-cream-300" : "border-cream-200 opacity-60"}`}>
            <div className="flex flex-wrap items-start gap-3">
              <div className="min-w-0 flex-1 space-y-1">
                <input
                  defaultValue={r.title}
                  onBlur={(e) => e.target.value !== r.title && oppdaterFelt(r.id, { title: e.target.value })}
                  className="w-full bg-transparent font-medium text-sage-900 focus:outline-none"
                />
                <input
                  defaultValue={r.description ?? ""}
                  placeholder="Beskrivelse …"
                  onBlur={(e) => e.target.value !== (r.description ?? "") && oppdaterFelt(r.id, { description: e.target.value || null })}
                  className="w-full bg-transparent text-sm text-sage-600 focus:outline-none"
                />
                <div className="flex flex-wrap gap-3">
                  <input
                    defaultValue={r.url ?? ""}
                    placeholder="Lenke (https://…)"
                    onBlur={(e) => e.target.value !== (r.url ?? "") && oppdaterFelt(r.id, { url: e.target.value || null })}
                    className="w-64 bg-transparent text-sm text-gold-600 focus:outline-none"
                  />
                  <input
                    type="number"
                    defaultValue={r.price ?? ""}
                    placeholder="Pris (kr)"
                    onBlur={(e) => Number(e.target.value) !== r.price && oppdaterFelt(r.id, { price: e.target.value ? Number(e.target.value) : null })}
                    className="w-28 bg-transparent text-sm tabular-nums focus:outline-none"
                  />
                  <input
                    defaultValue={r.category ?? ""}
                    placeholder="Kategori"
                    onBlur={(e) => e.target.value !== (r.category ?? "") && oppdaterFelt(r.id, { category: e.target.value || null })}
                    className="w-28 bg-transparent text-sm focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                {r.reserved_by ? (
                  <div className="text-right">
                    <span className="rounded-full bg-sage-100 px-3 py-1 text-xs font-medium text-sage-800">Reservert av {r.reserved_by}</span>
                    <button
                      onClick={() => oppdaterFelt(r.id, { reserved_by: null, reserved_at: null })}
                      className="mt-1 block w-full text-right text-xs text-sage-500 hover:text-sage-700"
                    >
                      Frigi reservasjon
                    </button>
                  </div>
                ) : (
                  <span className="rounded-full bg-cream-200 px-3 py-1 text-xs text-sage-600">Ledig</span>
                )}
                <label className="flex items-center gap-1.5 text-xs text-sage-600">
                  <input type="checkbox" checked={r.active} onChange={(e) => oppdaterFelt(r.id, { active: e.target.checked })} className="h-3.5 w-3.5 accent-sage-700" />
                  Synlig for gjester
                </label>
                <button onClick={() => slett(r.id)} className="btn-danger">
                  Slett
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
