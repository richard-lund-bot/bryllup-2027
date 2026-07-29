import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type { WishlistItem } from "../lib/types";
import { BRYLLUPSDATO, formatNOK } from "../lib/utils";

interface ProgramPunkt {
  tid: string;
  tekst: string;
}
interface PraktiskPunkt {
  tittel: string;
  tekst: string;
}
interface Kontakt {
  navn: string;
  epost: string;
}

interface InvitasjonData {
  overskrift: string;
  velkomsttekst: string;
  rsvp_frist: string;
  program: ProgramPunkt[];
  praktisk: PraktiskPunkt[];
  kontakt: Kontakt[];
}

const FALLBACK: InvitasjonData = {
  overskrift: "Vi gifter oss!",
  velkomsttekst:
    "Vi har gleden av å invitere deg til bryllupet vårt lørdag 7. august 2027 i Strømsgodset kirke, med fest i hagen hjemme etterpå.",
  rsvp_frist: "2027-05-01",
  program: [],
  praktisk: [],
  kontakt: [],
};

const bilde = (navn: string) => import.meta.env.BASE_URL + "bilder/" + navn;

const GALLERI: { fil: string; alt: string }[] = [
  { fil: "familie-sommer.jpg", alt: "Familien en sommerdag" },
  { fil: "par-sjoen.jpg", alt: "Richard og Jennie ved sjøen" },
  { fil: "familie-jul.jpg", alt: "Familien foran juletreet" },
  { fil: "hverdag-snomann.jpg", alt: "Snømannbygging om vinteren" },
  { fil: "familie-kirken.jpg", alt: "Familien i kirken" },
  { fil: "hverdag-skogstur.jpg", alt: "Tur i skogen" },
  { fil: "par-ultralyd.jpg", alt: "Richard og Jennie med ultralydbilder" },
  { fil: "hverdag-lesestund.jpg", alt: "Lesestund hjemme" },
  { fil: "par-iskrem.jpg", alt: "Richard og Jennie med iskrem om sommeren" },
];

function useNedtelling() {
  const [na, setNa] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNa(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return useMemo(() => {
    const diff = Math.max(0, BRYLLUPSDATO.getTime() - na.getTime());
    return {
      dager: Math.floor(diff / 86_400_000),
      timer: Math.floor(diff / 3_600_000) % 24,
      minutter: Math.floor(diff / 60_000) % 60,
      sekunder: Math.floor(diff / 1000) % 60,
    };
  }, [na]);
}

export default function Invitasjon() {
  const [data, setData] = useState<InvitasjonData>(FALLBACK);
  const [onsker, setOnsker] = useState<WishlistItem[]>([]);
  const nedtelling = useNedtelling();

  useEffect(() => {
    void (async () => {
      const { data: rows } = await supabase.from("settings").select("key, value").eq("key", "invitasjon");
      if (rows?.[0]?.value) setData({ ...FALLBACK, ...(rows[0].value as Partial<InvitasjonData>) });
      const { data: w } = await supabase
        .from("wishlist_items")
        .select("*")
        .eq("active", true)
        .order("sort_order")
        .order("created_at");
      if (w) setOnsker(w as WishlistItem[]);
    })();
  }, []);

  const lastOnskerPaNytt = async () => {
    const { data: w } = await supabase
      .from("wishlist_items")
      .select("*")
      .eq("active", true)
      .order("sort_order")
      .order("created_at");
    if (w) setOnsker(w as WishlistItem[]);
  };

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Hero */}
      <header className="relative overflow-hidden bg-sage-800 text-cream-50">
        <img
          src={bilde("par-flagg.jpg")}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover object-center opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-sage-900/75 via-sage-800/65 to-sage-900/85" aria-hidden />
        <div className="relative mx-auto max-w-3xl px-6 py-24 text-center sm:py-32">
          <p className="font-display text-lg italic tracking-widest text-gold-300">Sammen med våre familier</p>
          <h1 className="font-display mt-6 text-6xl font-medium sm:text-8xl">
            Richard <span className="text-gold-300">&amp;</span> Jennie
          </h1>
          <div className="mx-auto mt-8 h-px w-24 bg-gold-300/60" />
          <p className="font-display mt-8 text-2xl sm:text-3xl">Lørdag 7. august 2027 · kl. 14.00</p>
          <p className="mt-2 text-lg text-cream-200">Strømsgodset kirke, Drammen</p>

          <div className="mx-auto mt-12 grid max-w-md grid-cols-4 gap-3">
            {[
              [nedtelling.dager, "dager"],
              [nedtelling.timer, "timer"],
              [nedtelling.minutter, "min"],
              [nedtelling.sekunder, "sek"],
            ].map(([verdi, navn]) => (
              <div key={navn} className="rounded-xl border border-cream-50/15 bg-cream-50/5 px-2 py-4 backdrop-blur-sm">
                <div className="font-display text-3xl font-semibold tabular-nums sm:text-4xl">{verdi}</div>
                <div className="mt-1 text-xs uppercase tracking-widest text-cream-200">{navn}</div>
              </div>
            ))}
          </div>

          <a href="#rsvp" className="mt-12 inline-block rounded-full bg-gold-500 px-8 py-3 font-medium text-white shadow-lg transition hover:bg-gold-600">
            Svar på invitasjonen
          </a>
        </div>
      </header>

      {/* Velkommen */}
      <section className="mx-auto max-w-4xl px-6 py-20">
        <div className="grid items-center gap-10 sm:grid-cols-2">
          <img
            src={bilde("par-barnevogn.jpg")}
            alt="Richard og Jennie"
            className="mx-auto w-full max-w-sm rotate-[-1.5deg] rounded-2xl border-8 border-white shadow-xl"
          />
          <div className="text-center sm:text-left">
            <h2 className="font-display text-4xl text-sage-800">{data.overskrift}</h2>
            <p className="mt-6 text-lg leading-relaxed text-sage-700">{data.velkomsttekst}</p>
          </div>
        </div>
      </section>

      {/* Vielse + fest */}
      <section className="bg-cream-100 py-16">
        <div className="mx-auto grid max-w-4xl gap-8 px-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-cream-300 bg-white p-8 text-center shadow-sm">
            <div className="text-4xl">⛪</div>
            <h3 className="font-display mt-4 text-2xl text-sage-800">Vielsen</h3>
            <p className="mt-3 text-sage-700">
              Strømsgodset kirke, Drammen
              <br />
              Lørdag 7. august 2027, kl. 14.00
            </p>
            <p className="mt-3 text-sm text-sage-600">Vennligst vær på plass senest kl. 13.45.</p>
          </div>
          <div className="rounded-2xl border border-cream-300 bg-white p-8 text-center shadow-sm">
            <div className="text-4xl">🌿</div>
            <h3 className="font-display mt-4 text-2xl text-sage-800">Festen</h3>
            <p className="mt-3 text-sage-700">
              Hagen hjemme hos oss
              <br />
              Velkomstdrink fra kl. 16.00
            </p>
            <p className="mt-3 text-sm text-sage-600">Middag, taler, kake og dans utover kvelden.</p>
          </div>
        </div>
      </section>

      {/* Program */}
      {data.program.length > 0 && (
        <section className="mx-auto max-w-2xl px-6 py-20">
          <h2 className="font-display text-center text-4xl text-sage-800">Dagens program</h2>
          <ol className="mt-10 space-y-0">
            {data.program.map((p, i) => (
              <li key={i} className="relative flex gap-6 pb-8 last:pb-0">
                <div className="flex flex-col items-center">
                  <div className="h-3 w-3 rounded-full border-2 border-gold-500 bg-cream-50" />
                  {i < data.program.length - 1 && <div className="w-px flex-1 bg-cream-300" />}
                </div>
                <div className="-mt-1.5">
                  <span className="font-display text-xl font-semibold text-gold-600">{p.tid}</span>
                  <p className="text-sage-700">{p.tekst}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Galleri */}
      <section className="bg-cream-100 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="font-display text-center text-4xl text-sage-800">Litt av oss</h2>
          <p className="mt-4 text-center text-sage-700">Noen glimt fra livet vårt sammen.</p>
          <div className="mt-10 columns-2 gap-4 sm:columns-3">
            {GALLERI.map((b) => (
              <img
                key={b.fil}
                src={bilde(b.fil)}
                alt={b.alt}
                loading="lazy"
                className="mb-4 w-full rounded-xl shadow-sm transition-transform duration-300 hover:scale-[1.02]"
              />
            ))}
          </div>
        </div>
      </section>

      {/* Praktisk info */}
      {data.praktisk.length > 0 && (
        <section className="bg-sage-800 py-20 text-cream-50">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="font-display text-center text-4xl">Praktisk informasjon</h2>
            <div className="mt-12 grid gap-x-12 gap-y-8 sm:grid-cols-2">
              {data.praktisk.map((p, i) => (
                <div key={i}>
                  <h3 className="font-display text-xl text-gold-300">{p.tittel}</h3>
                  <p className="mt-2 leading-relaxed text-cream-200">{p.tekst}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* RSVP */}
      <section id="rsvp" className="mx-auto max-w-xl px-6 py-20">
        <h2 className="font-display text-center text-4xl text-sage-800">Kommer du?</h2>
        <p className="mt-4 text-center text-sage-700">
          Vennligst svar innen{" "}
          <strong>
            {new Date(data.rsvp_frist + "T12:00:00").toLocaleDateString("nb-NO", { day: "numeric", month: "long", year: "numeric" })}
          </strong>
          .
        </p>
        <RsvpSkjema />
      </section>

      {/* Ønskeliste */}
      <section className="bg-cream-100 py-20">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="font-display text-center text-4xl text-sage-800">Ønskeliste</h2>
          <p className="mt-4 text-center text-sage-700">
            Det viktigste for oss er at du kommer! Men om du ønsker å gi en gave, har vi laget en liste. Reserver gjerne et ønske,
            så unngår vi dobbeltgaver.
          </p>
          <div className="mt-10 space-y-4">
            {onsker.length === 0 && <p className="text-center text-sage-600">Ønskelisten kommer snart.</p>}
            {onsker.map((o) => (
              <Onske key={o.id} onske={o} onReservert={lastOnskerPaNytt} />
            ))}
          </div>
        </div>
      </section>

      {/* Kontakt / footer */}
      <footer className="bg-sage-900 py-16 text-center text-cream-200">
        <h2 className="font-display text-3xl text-cream-50">Spørsmål?</h2>
        <div className="mt-6 space-y-1">
          {data.kontakt.map((k) => (
            <p key={k.epost}>
              {k.navn}:{" "}
              <a className="text-gold-300 underline-offset-2 hover:underline" href={`mailto:${k.epost}`}>
                {k.epost}
              </a>
            </p>
          ))}
        </div>
        <p className="font-display mt-10 text-2xl text-gold-300">Richard &amp; Jennie</p>
        <p className="mt-1 text-sm">7. august 2027</p>
        <p className="mt-8 text-xs text-sage-400">
          <Link to="/plan" className="hover:text-cream-200">
            For brudeparet
          </Link>
        </p>
      </footer>
    </div>
  );
}

function RsvpSkjema() {
  const [sendt, setSendt] = useState(false);
  const [feil, setFeil] = useState<string | null>(null);
  const [sender, setSender] = useState(false);
  const [kommer, setKommer] = useState<"ja" | "nei">("ja");

  const send = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSender(true);
    setFeil(null);
    const f = new FormData(e.currentTarget);
    const { error } = await supabase.from("rsvps").insert({
      name: String(f.get("navn") ?? "").trim(),
      email: String(f.get("epost") ?? "").trim() || null,
      phone: String(f.get("telefon") ?? "").trim() || null,
      attending: kommer === "ja",
      num_adults: Number(f.get("voksne") ?? 1),
      num_children: Number(f.get("barn") ?? 0),
      allergies: String(f.get("allergier") ?? "").trim() || null,
      song_wish: String(f.get("laat") ?? "").trim() || null,
      message: String(f.get("hilsen") ?? "").trim() || null,
    });
    setSender(false);
    if (error) {
      setFeil("Noe gikk galt – prøv igjen, eller send oss en e-post.");
    } else {
      setSendt(true);
    }
  };

  if (sendt) {
    return (
      <div className="mt-10 rounded-2xl border border-sage-200 bg-sage-50 p-8 text-center">
        <div className="text-4xl">💌</div>
        <h3 className="font-display mt-4 text-2xl text-sage-800">Tusen takk for svaret!</h3>
        <p className="mt-2 text-sage-700">Vi gleder oss!</p>
      </div>
    );
  }

  return (
    <form onSubmit={send} className="mt-10 space-y-5 rounded-2xl border border-cream-300 bg-white p-8 shadow-sm">
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setKommer("ja")}
          className={`rounded-xl border px-4 py-3 font-medium transition ${
            kommer === "ja" ? "border-sage-600 bg-sage-600 text-white" : "border-cream-300 bg-cream-50 text-sage-700 hover:border-sage-400"
          }`}
        >
          Jeg/vi kommer 🎉
        </button>
        <button
          type="button"
          onClick={() => setKommer("nei")}
          className={`rounded-xl border px-4 py-3 font-medium transition ${
            kommer === "nei" ? "border-sage-600 bg-sage-600 text-white" : "border-cream-300 bg-cream-50 text-sage-700 hover:border-sage-400"
          }`}
        >
          Kan dessverre ikke
        </button>
      </div>

      <label className="block">
        <span className="text-sm font-medium text-sage-800">Navn (alle i følget) *</span>
        <input name="navn" required className="plan-input mt-1" placeholder="F.eks. Kari og Ola Nordmann" />
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-sage-800">E-post</span>
          <input name="epost" type="email" className="plan-input mt-1" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-sage-800">Telefon</span>
          <input name="telefon" className="plan-input mt-1" />
        </label>
      </div>

      {kommer === "ja" && (
        <>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-sage-800">Antall voksne</span>
              <input name="voksne" type="number" min={1} max={10} defaultValue={1} className="plan-input mt-1" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-sage-800">Antall barn</span>
              <input name="barn" type="number" min={0} max={10} defaultValue={0} className="plan-input mt-1" />
            </label>
          </div>
          <label className="block">
            <span className="text-sm font-medium text-sage-800">Allergier eller matbehov</span>
            <input name="allergier" className="plan-input mt-1" placeholder="F.eks. glutenfri, vegetar …" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-sage-800">Låtønske til dansegulvet 🎵</span>
            <input name="laat" className="plan-input mt-1" placeholder="Hvilken låt får deg ut på gulvet?" />
          </label>
        </>
      )}

      <label className="block">
        <span className="text-sm font-medium text-sage-800">Hilsen til brudeparet</span>
        <textarea name="hilsen" rows={3} className="plan-input mt-1" />
      </label>

      {feil && <p className="text-sm text-red-700">{feil}</p>}

      <button type="submit" disabled={sender} className="w-full rounded-xl bg-gold-500 px-6 py-3 font-medium text-white transition hover:bg-gold-600 disabled:opacity-50">
        {sender ? "Sender …" : "Send svar"}
      </button>
    </form>
  );
}

function Onske({ onske, onReservert }: { onske: WishlistItem; onReservert: () => Promise<void> }) {
  const [viserSkjema, setViserSkjema] = useState(false);
  const [navn, setNavn] = useState("");
  const [jobber, setJobber] = useState(false);
  const [feil, setFeil] = useState<string | null>(null);

  const reserver = async () => {
    if (navn.trim().length < 2) {
      setFeil("Skriv navnet ditt først.");
      return;
    }
    setJobber(true);
    const { data, error } = await supabase.rpc("reserver_onske", { item_id: onske.id, navn: navn.trim() });
    setJobber(false);
    if (error || data !== true) {
      setFeil("Kunne ikke reservere – ønsket kan allerede være tatt.");
      await onReservert();
    } else {
      setViserSkjema(false);
      await onReservert();
    }
  };

  const reservert = !!onske.reserved_by;

  return (
    <div className={`rounded-2xl border bg-white p-6 shadow-sm ${reservert ? "border-cream-200 opacity-70" : "border-cream-300"}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-xl text-sage-800">{onske.title}</h3>
          {onske.description && <p className="mt-1 text-sm text-sage-700">{onske.description}</p>}
          <div className="mt-2 flex flex-wrap gap-3 text-sm text-sage-600">
            {onske.price != null && <span>{formatNOK(onske.price)}</span>}
            {onske.url && (
              <a href={onske.url} target="_blank" rel="noreferrer" className="text-gold-600 underline-offset-2 hover:underline">
                Se produktet ↗
              </a>
            )}
          </div>
        </div>
        <div className="shrink-0">
          {reservert ? (
            <span className="rounded-full bg-cream-200 px-4 py-2 text-sm font-medium text-sage-700">Reservert ✓</span>
          ) : viserSkjema ? (
            <div className="flex flex-col items-end gap-2">
              <input
                value={navn}
                onChange={(e) => setNavn(e.target.value)}
                placeholder="Navnet ditt"
                className="plan-input w-44"
                autoFocus
              />
              <div className="flex gap-2">
                <button onClick={() => setViserSkjema(false)} className="text-sm text-sage-600 hover:text-sage-800">
                  Avbryt
                </button>
                <button onClick={reserver} disabled={jobber} className="rounded-lg bg-sage-700 px-3 py-1.5 text-sm text-white hover:bg-sage-800 disabled:opacity-50">
                  {jobber ? "…" : "Bekreft"}
                </button>
              </div>
              {feil && <p className="text-xs text-red-700">{feil}</p>}
            </div>
          ) : (
            <button onClick={() => setViserSkjema(true)} className="rounded-full border border-sage-600 px-4 py-2 text-sm font-medium text-sage-700 transition hover:bg-sage-600 hover:text-white">
              Reserver
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
