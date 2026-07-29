# 💍 Bryllup 2027 – Richard & Jennie

Komplett bryllupsnettside og prosjektstyringssystem for bryllupet **lørdag 7. august 2027**
i Strømsgodset kirke, med fest i hagen hjemme.

## To deler – én nettside

**🌸 Invitasjonssiden (offentlig)** – `https://richard-lund-bot.github.io/bryllup-2027/`

- Nedtelling, program for dagen og all praktisk info
- Svarskjema (RSVP) med allergier, barn og låtønsker
- Ønskeliste der gjestene kan reservere gaver (hindrer dobbeltgaver)

**📊 Planleggingsverktøyet (innlogget)** – samme adresse + `/plan`

Kun Richard og Jennie har tilgang. Arbeidsboken fra prosjektvisjonen er bygget inn:

| Fane | Innhold |
|---|---|
| 00 Dashboard | Dager igjen, fremdrift, budsjettstatus, RSVP-status, kritiske oppgaver, neste milepæl |
| 01 Masterplan | Alle hovedoppgaver med status, prioritet, frist og ansvarlig |
| 02 Budsjett | Estimat, faktisk kostnad, leverandør, depositum, betalt og restbeløp |
| 03 Gjesteliste | Kontaktinfo, allergier, barn, RSVP, taler, gaver, takkekort |
| 04 Bordplassering | Dynamisk plassering – klikk på gjest, klikk på bord |
| 05 Tidslinje | Milepæler måned for måned frem til bryllupet |
| 06 Bryllupshelgen | Kjøreplan for fredag/lørdag/søndag med tid, ansvarlig og sted |
| 07–24 Arbeidsbok | Seremoni, hagen, regnplan, meny, drikke, innkjøp, leverandører, musikk, foto, dekor, klær, transport, bemanning, risiko, huslogistikk, idébank, beslutningslogg og etterarbeid |
| 💌 Innkomne svar | RSVP-innboks – overfør svar til gjestelisten med ett klikk |
| 🎁 Ønskeliste | Administrer ønskene som vises til gjestene |

**✨ AI-assistenten** (knappen oppe til høyre i planleggeren) er koblet til Claude og kan lese og
endre hele arbeidsboken i naturlig språk: «Flytt middagen til 17.30», «Legg til gjestene …»,
«Hvordan ligger vi an på budsjettet?»

## Teknisk

- **Frontend:** Vite + React + TypeScript + Tailwind, hostes gratis på GitHub Pages
  (deployes automatisk av `.github/workflows/deploy.yml` ved push)
- **Database og innlogging:** Supabase-prosjektet «Bryllup 2027» (gratisnivå) med
  radnivåsikkerhet – kun brudeparets to kontoer kan endre data
- **AI:** Supabase Edge Function `ai-assistent` som kaller Claude API (`claude-opus-5`)

### Aktivere nettsiden (engangssteg)

Alt bygges og publiseres automatisk til `gh-pages`-grenen, men GitHub krever at Pages
aktiveres manuelt én gang:

1. Gå til [Settings → Pages](https://github.com/richard-lund-bot/bryllup-2027/settings/pages)
2. Under **Build and deployment** → **Source**: velg *Deploy from a branch*
3. Velg gren **gh-pages** og mappe **/ (root)** → **Save**

Etter et par minutter er siden live på `https://richard-lund-bot.github.io/bryllup-2027/`.

### Kjøre lokalt

```bash
npm install
npm run dev   # åpne http://localhost:5173/bryllup-2027/
```

### Aktivere AI-assistenten

Assistenten trenger en API-nøkkel fra [console.anthropic.com](https://console.anthropic.com):

1. Opprett en API-nøkkel der
2. Gå til [Supabase-dashbordet](https://supabase.com/dashboard/project/ugpxjjufoxzsyfiegkzq/functions/secrets)
   → Edge Functions → Secrets
3. Legg inn `ANTHROPIC_API_KEY` = nøkkelen

I tillegg kan repoet åpnes i Claude Code (claude.ai/code) – da kan planen revideres i naturlig
språk direkte via Claude-kontoen, uten API-nøkkel. Se `CLAUDE.md`.

### Endre innhold på invitasjonssiden

Tekst, program og praktisk info redigeres under **⚙️ Innstillinger** i planleggeren
(eller ved å be AI-assistenten gjøre det).
