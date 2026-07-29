/**
 * Konfigurasjon for de generiske modulene (fane 07–24 i arbeidsboken).
 * Hver modul lagres i tabellen module_items med feltet `module` som nøkkel.
 */
export interface ModulKonfig {
  key: string;
  nr: string;
  tittel: string;
  emoji: string;
  beskrivelse: string;
}

export const MODULER: ModulKonfig[] = [
  { key: "seremoni", nr: "07", tittel: "Seremoni", emoji: "⛪", beskrivelse: "Alt som skjer i Strømsgodset kirke: liturgi, musikk, salmer og roller." },
  { key: "hagen", nr: "08", tittel: "Hagen", emoji: "🌿", beskrivelse: "Plan for telt, strøm, lys, scene, bar, parkering og toaletter." },
  { key: "regnplan", nr: "09", tittel: "Regnplan", emoji: "🌧️", beskrivelse: "Plan B ved regn, vind, ekstrem varme og strømbrudd." },
  { key: "meny", nr: "10", tittel: "Meny", emoji: "🍽️", beskrivelse: "Menyen med kokken, allergier, kake og nattmat." },
  { key: "drikke", nr: "11", tittel: "Drikke", emoji: "🥂", beskrivelse: "Mengdeberegning og innkjøp av drikke." },
  { key: "innkjop", nr: "12", tittel: "Innkjøp", emoji: "🛒", beskrivelse: "Handlelister og alt som må kjøpes inn." },
  { key: "leverandorer", nr: "13", tittel: "Leverandører", emoji: "🤝", beskrivelse: "Kontrakter, kontaktinfo og avtaler." },
  { key: "musikk", nr: "14", tittel: "Musikk", emoji: "🎵", beskrivelse: "DJ, spillelister, brudevals og låtønsker." },
  { key: "foto", nr: "15", tittel: "Foto", emoji: "📷", beskrivelse: "Fotograf, bildeliste og lokasjoner." },
  { key: "dekor", nr: "16", tittel: "Dekor", emoji: "💐", beskrivelse: "Blomster, farger, bordkort og pynt." },
  { key: "klaer", nr: "17", tittel: "Klær", emoji: "👗", beskrivelse: "Kjole, dress, sko og tilbehør." },
  { key: "transport", nr: "18", tittel: "Transport", emoji: "🚗", beskrivelse: "Transport til/fra kirken og parkering." },
  { key: "bemanning", nr: "19", tittel: "Bemanning", emoji: "🙋", beskrivelse: "Toastmaster, barvakter, riggegjeng og verter." },
  { key: "risiko", nr: "20", tittel: "Risiko", emoji: "⚠️", beskrivelse: "Risikoer og backup-planer." },
  { key: "huslogistikk", nr: "21", tittel: "Huslogistikk", emoji: "🏠", beskrivelse: "Klargjøring av hus og kjøkken." },
  { key: "idebank", nr: "22", tittel: "Idébank", emoji: "💡", beskrivelse: "Alle gode idéer samles her." },
  { key: "beslutningslogg", nr: "23", tittel: "Beslutningslogg", emoji: "📋", beskrivelse: "Alle beslutninger dokumenteres slik at ingenting glemmes." },
  { key: "etterarbeid", nr: "24", tittel: "Etterarbeid", emoji: "✉️", beskrivelse: "Takkekort, retur av utstyr og evaluering." },
];

export function finnModul(key: string | undefined): ModulKonfig | undefined {
  return MODULER.find((m) => m.key === key);
}
