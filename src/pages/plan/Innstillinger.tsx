import { FormEvent, useCallback, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useLast } from "../../lib/utils";

export default function Innstillinger() {
  const [invitasjon, setInvitasjon] = useState("");
  const [lagret, setLagret] = useState<string | null>(null);
  const [passordMelding, setPassordMelding] = useState<string | null>(null);

  const last = useCallback(async () => {
    const { data } = await supabase.from("settings").select("value").eq("key", "invitasjon");
    if (data?.[0]) setInvitasjon(JSON.stringify(data[0].value, null, 2));
  }, []);
  const { laster } = useLast(last);

  const lagreInvitasjon = async () => {
    try {
      const parsed = JSON.parse(invitasjon);
      const { error } = await supabase.from("settings").upsert({ key: "invitasjon", value: parsed });
      setLagret(error ? "Kunne ikke lagre." : "Lagret! Invitasjonssiden er oppdatert.");
    } catch {
      setLagret("Ugyldig JSON – sjekk syntaksen.");
    }
    setTimeout(() => setLagret(null), 4000);
  };

  const byttPassord = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const nytt = String(f.get("nytt"));
    if (nytt.length < 8) {
      setPassordMelding("Passordet må være minst 8 tegn.");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: nytt });
    setPassordMelding(error ? "Kunne ikke endre passordet." : "Passordet er endret! ✓");
    if (!error) e.currentTarget.reset();
  };

  if (laster) return <p className="text-sage-600">Laster innstillinger …</p>;

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-3xl text-sage-800">⚙️ Innstillinger</h1>
        <p className="text-sm text-sage-600">Innhold på invitasjonssiden og kontoinnstillinger</p>
      </div>

      <section className="rounded-2xl border border-cream-300 bg-white p-5">
        <h2 className="font-display text-xl text-sage-800">Tekst og program på invitasjonssiden</h2>
        <p className="mt-1 text-sm text-sage-600">
          Rediger innholdet under (JSON-format). Tips: be AI-assistenten om å gjøre endringer for deg – f.eks. «endre
          velkomstteksten på invitasjonssiden til …».
        </p>
        <textarea
          value={invitasjon}
          onChange={(e) => setInvitasjon(e.target.value)}
          rows={20}
          spellCheck={false}
          className="plan-input mt-3 font-mono text-xs"
        />
        <div className="mt-3 flex items-center gap-3">
          <button onClick={lagreInvitasjon} className="btn-primary">
            Lagre
          </button>
          {lagret && <span className="text-sm text-sage-700">{lagret}</span>}
        </div>
      </section>

      <section className="rounded-2xl border border-cream-300 bg-white p-5">
        <h2 className="font-display text-xl text-sage-800">Bytt passord</h2>
        <form onSubmit={byttPassord} className="mt-3 flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="text-sm font-medium text-sage-800">Nytt passord</span>
            <input name="nytt" type="password" required minLength={8} autoComplete="new-password" className="plan-input mt-1 w-64" />
          </label>
          <button type="submit" className="btn-secondary">
            Endre passord
          </button>
          {passordMelding && <span className="text-sm text-sage-700">{passordMelding}</span>}
        </form>
      </section>
    </div>
  );
}
