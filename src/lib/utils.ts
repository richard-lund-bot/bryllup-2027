import { useCallback, useEffect, useState } from "react";

export const BRYLLUPSDATO = new Date("2027-08-07T14:00:00+02:00");

export function dagerIgjen(): number {
  const na = new Date();
  return Math.max(0, Math.ceil((BRYLLUPSDATO.getTime() - na.getTime()) / 86_400_000));
}

export function formatNOK(n: number | null | undefined): string {
  if (n == null) return "–";
  return new Intl.NumberFormat("nb-NO", {
    style: "currency",
    currency: "NOK",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatDato(iso: string | null | undefined): string {
  if (!iso) return "–";
  return new Date(iso + (iso.length === 10 ? "T12:00:00" : "")).toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatMnd(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("nb-NO", { month: "long", year: "numeric" });
}

export const STATUS_LABEL: Record<string, string> = {
  ikke_startet: "Ikke startet",
  pagar: "Pågår",
  ferdig: "Ferdig",
};

export const STATUS_FARGE: Record<string, string> = {
  ikke_startet: "bg-cream-200 text-sage-700",
  pagar: "bg-amber-100 text-amber-800",
  ferdig: "bg-sage-100 text-sage-700",
};

export const PRIORITET_LABEL: Record<string, string> = {
  lav: "Lav",
  normal: "Normal",
  hoy: "Høy",
  kritisk: "Kritisk",
};

export const PRIORITET_FARGE: Record<string, string> = {
  lav: "bg-cream-200 text-sage-600",
  normal: "bg-sage-50 text-sage-700",
  hoy: "bg-amber-100 text-amber-800",
  kritisk: "bg-red-100 text-red-800",
};

export const BETALING_LABEL: Record<string, string> = {
  ikke_betalt: "Ikke betalt",
  depositum_betalt: "Depositum betalt",
  delbetalt: "Delbetalt",
  betalt: "Betalt",
};

export const RSVP_LABEL: Record<string, string> = {
  venter: "Venter svar",
  kommer: "Kommer",
  kommer_ikke: "Kommer ikke",
};

export const RSVP_FARGE: Record<string, string> = {
  venter: "bg-cream-200 text-sage-700",
  kommer: "bg-sage-100 text-sage-800",
  kommer_ikke: "bg-red-100 text-red-800",
};

/**
 * Laster data og lytter på "bryllup:refresh"-hendelsen slik at sidene
 * oppdaterer seg når AI-assistenten (eller en annen fane) har endret noe.
 */
export function useLast(lastFn: () => Promise<void>) {
  const [laster, setLaster] = useState(true);
  const kjor = useCallback(async () => {
    await lastFn();
    setLaster(false);
  }, [lastFn]);

  useEffect(() => {
    void kjor();
    const handler = () => void kjor();
    window.addEventListener("bryllup:refresh", handler);
    return () => window.removeEventListener("bryllup:refresh", handler);
  }, [kjor]);

  return { laster, oppdater: kjor };
}

export function varsleEndring() {
  window.dispatchEvent(new Event("bryllup:refresh"));
}
