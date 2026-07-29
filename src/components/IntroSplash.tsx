import { CSSProperties, useEffect, useMemo, useState } from "react";

const SESSION_NOKKEL = "bryllup:intro-vist";

/** Introen vises kun første gang siden åpnes i en økt. */
export function skalViseIntro(): boolean {
  try {
    return sessionStorage.getItem(SESSION_NOKKEL) !== "1";
  } catch {
    return false;
  }
}

const KONFETTI_FARGER = ["#b08d57", "#d7bd94", "#5c6e50", "#8a9a7d", "#2d3a66", "#ffffff", "#e8b4c8"];

const PYNT = [
  { emoji: "💍", klasse: "left-[10%] top-[12%] text-3xl", delay: "0s" },
  { emoji: "✨", klasse: "right-[12%] top-[18%] text-2xl", delay: "0.7s" },
  { emoji: "🌸", klasse: "left-[16%] bottom-[22%] text-2xl", delay: "1.3s" },
  { emoji: "🕊️", klasse: "right-[14%] bottom-[28%] text-3xl", delay: "0.4s" },
  { emoji: "✨", klasse: "left-[38%] top-[7%] text-xl", delay: "1.8s" },
];

export default function IntroSplash({ onFerdig }: { onFerdig: () => void }) {
  const [aapner, setAapner] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const konfetti = useMemo(() => {
    if (!aapner) return [];
    return Array.from({ length: 44 }, (_, i) => {
      const vinkel = Math.random() * Math.PI * 2;
      const fart = 130 + Math.random() * 280;
      return {
        id: i,
        stil: {
          background: KONFETTI_FARGER[i % KONFETTI_FARGER.length],
          animationDelay: `${Math.random() * 0.12}s`,
          "--dx": `${Math.cos(vinkel) * fart}px`,
          "--dy": `${Math.sin(vinkel) * fart - 130}px`,
          "--rot": `${Math.round((Math.random() - 0.5) * 720)}deg`,
        } as CSSProperties,
      };
    });
  }, [aapner]);

  const aapne = () => {
    if (aapner) return;
    setAapner(true);
    try {
      sessionStorage.setItem(SESSION_NOKKEL, "1");
    } catch {
      // sessionStorage utilgjengelig – vis introen igjen neste gang
    }
    setTimeout(onFerdig, 1150);
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex cursor-pointer items-center justify-center overflow-hidden bg-cream-100 ${
        aapner ? "intro-bakgrunn-ut" : ""
      }`}
      onClick={aapne}
      role="button"
      aria-label="Åpne invitasjonen"
    >
      {/* Svevende pynt rundt kortet */}
      {!aapner &&
        PYNT.map((p, i) => (
          <span key={i} aria-hidden className={`intro-svev absolute ${p.klasse}`} style={{ animationDelay: p.delay }}>
            {p.emoji}
          </span>
        ))}

      {/* Selve invitasjonskortet */}
      <div className={`relative mx-6 ${aapner ? "intro-ut" : "intro-inn"}`}>
        <img
          src={import.meta.env.BASE_URL + "bilder/intro-konvolutt.jpg"}
          alt="Invitasjon: Richard & Jennie, 7. august 2027, Strømsgodset kirke"
          className="max-h-[78vh] w-auto max-w-full rounded-2xl shadow-2xl"
          draggable={false}
        />
        {/* Konfetti spruter fra seglet når man åpner */}
        {konfetti.map((k) => (
          <span key={k.id} aria-hidden className="intro-konfetti" style={k.stil} />
        ))}
      </div>

      {/* Hint nederst */}
      {!aapner && (
        <div className="intro-hint pointer-events-none absolute inset-x-0 bottom-8 text-center">
          <span className="rounded-full bg-sage-800/90 px-6 py-3 font-medium text-cream-50 shadow-lg backdrop-blur">
            Trykk for å åpne invitasjonen 💌
          </span>
        </div>
      )}
    </div>
  );
}
