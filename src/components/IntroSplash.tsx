import { useEffect, useState } from "react";

const SESSION_NOKKEL = "bryllup:intro-vist";

/** Introen vises kun første gang siden åpnes i en økt. */
export function skalViseIntro(): boolean {
  try {
    return sessionStorage.getItem(SESSION_NOKKEL) !== "1";
  } catch {
    return false;
  }
}

/**
 * Elegant konvoluttåpning: invitasjonskortet ligger kant til kant,
 * og ved trykk løftes det rolig opp og bort som et papirark –
 * siden under kommer til syne.
 */
export default function IntroSplash({ onFerdig }: { onFerdig: () => void }) {
  const [aapner, setAapner] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const aapne = () => {
    if (aapner) return;
    setAapner(true);
    try {
      sessionStorage.setItem(SESSION_NOKKEL, "1");
    } catch {
      // sessionStorage utilgjengelig – vis introen igjen neste gang
    }
    setTimeout(onFerdig, 1600);
  };

  return (
    <div
      className={`intro-scene fixed inset-0 z-[100] cursor-pointer bg-cream-100 ${aapner ? "intro-bakteppe-ut" : ""}`}
      onClick={aapne}
      role="button"
      aria-label="Åpne invitasjonen"
    >
      <div className={`h-full w-full ${aapner ? "intro-flapp-aapner" : "intro-myk-inn"}`}>
        <img
          src={import.meta.env.BASE_URL + "bilder/intro-konvolutt.jpg"}
          alt="Invitasjon: Richard & Jennie, 7. august 2027, Strømsgodset kirke"
          className="h-full w-full object-contain portrait:object-cover"
          draggable={false}
        />
        {/* Myk papirskygge langs bunnen mens arket løftes */}
        <div className={`pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-sage-900/25 to-transparent ${aapner ? "opacity-100" : "opacity-0"} transition-opacity duration-500`} />
      </div>

      {!aapner && (
        <div className="intro-hint-elegant pointer-events-none absolute inset-x-0 bottom-8 text-center">
          <span className="font-display rounded-full bg-white/75 px-6 py-2.5 text-lg italic tracking-wide text-sage-800 shadow-sm backdrop-blur-sm">
            Trykk for å åpne invitasjonen
          </span>
        </div>
      )}
    </div>
  );
}
