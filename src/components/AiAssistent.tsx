import { FormEvent, useEffect, useRef, useState } from "react";
import { supabase, SUPABASE_ANON_KEY, SUPABASE_URL } from "../lib/supabase";
import { varsleEndring } from "../lib/utils";

interface Melding {
  role: "user" | "assistant";
  content: string;
}

const FORSLAG = [
  "Hva bør vi fokusere på denne måneden?",
  "Legg til en oppgave: bestille prøvetime hos frisør i juni 2027",
  "Hvordan ligger vi an på budsjettet?",
  "Flytt middagen til kl. 17.30 i kjøreplanen",
];

export default function AiAssistent({ onLukk }: { onLukk: () => void }) {
  const [meldinger, setMeldinger] = useState<Melding[]>([]);
  const [tekst, setTekst] = useState("");
  const [jobber, setJobber] = useState(false);
  const [feil, setFeil] = useState<string | null>(null);
  const bunn = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bunn.current?.scrollIntoView({ behavior: "smooth" });
  }, [meldinger, jobber]);

  const send = async (innhold?: string) => {
    const melding = (innhold ?? tekst).trim();
    if (!melding || jobber) return;
    setTekst("");
    setFeil(null);
    const nye: Melding[] = [...meldinger, { role: "user", content: melding }];
    setMeldinger(nye);
    setJobber(true);

    try {
      const { data: sesjon } = await supabase.auth.getSession();
      const token = sesjon.session?.access_token;
      const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-assistent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ messages: nye.slice(-12) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? `Feil (${res.status})`);
      setMeldinger([...nye, { role: "assistant", content: data.reply ?? "(tomt svar)" }]);
      if (data.endret) varsleEndring();
    } catch (e) {
      setFeil(e instanceof Error ? e.message : "Noe gikk galt. Prøv igjen.");
      setMeldinger(nye);
    } finally {
      setJobber(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void send();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-label="AI-assistent">
      <div className="absolute inset-0 bg-sage-900/30" onClick={onLukk} />
      <div className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-cream-300 px-5 py-4">
          <div>
            <h2 className="font-display text-xl text-sage-800">✨ Bryllupsassistenten</h2>
            <p className="text-xs text-sage-500">Drevet av Claude – kan lese og oppdatere hele arbeidsboken</p>
          </div>
          <button onClick={onLukk} className="rounded-lg p-2 text-sage-500 hover:bg-cream-100 hover:text-sage-800" aria-label="Lukk">
            ✕
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {meldinger.length === 0 && (
            <div className="space-y-3">
              <p className="text-sm text-sage-700">
                Hei! Jeg kjenner hele bryllupsplanen deres – oppgaver, budsjett, gjesteliste, kjøreplan og alle modulene. Spør meg
                om status, eller be meg gjøre endringer i naturlig språk.
              </p>
              <div className="space-y-2">
                {FORSLAG.map((f) => (
                  <button
                    key={f}
                    onClick={() => void send(f)}
                    className="block w-full rounded-xl border border-cream-300 bg-cream-50 px-3 py-2 text-left text-sm text-sage-700 hover:border-sage-300 hover:bg-cream-100"
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          )}

          {meldinger.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === "user" ? "bg-sage-700 text-white" : "bg-cream-100 text-sage-900"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}

          {jobber && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-cream-100 px-4 py-2.5 text-sm text-sage-600">
                Tenker og jobber i arbeidsboken<span className="animate-pulse"> …</span>
              </div>
            </div>
          )}

          {feil && <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">{feil}</p>}
          <div ref={bunn} />
        </div>

        <form onSubmit={onSubmit} className="border-t border-cream-300 p-4">
          <div className="flex gap-2">
            <input
              value={tekst}
              onChange={(e) => setTekst(e.target.value)}
              placeholder="Spør eller be om en endring …"
              className="plan-input flex-1"
              disabled={jobber}
              autoFocus
            />
            <button type="submit" disabled={jobber || !tekst.trim()} className="btn-primary">
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
