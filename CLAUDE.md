# Bryllup 2027 – Richard & Jennie

Komplett bryllupsplanleggingssystem for bryllupet **7. august 2027** i Strømsgodset kirke (Drammen),
med fest i hagen hjemme (ca. 45 gjester, kokk på husets kjøkken).

## Arkitektur

| Del | Teknologi | Hvor |
|---|---|---|
| Frontend | Vite + React + TypeScript + Tailwind v4 | `src/` – deployes til GitHub Pages via `.github/workflows/deploy.yml` |
| Database + auth | Supabase-prosjekt **Bryllup 2027**, id `ugpxjjufoxzsyfiegkzq` (region eu-north-1) | Tabeller i `public`-skjemaet |
| AI-assistent | Supabase Edge Function `ai-assistent` som kaller Claude API (`claude-sonnet-5`) med CRUD-verktøy | `supabase/functions/ai-assistent/index.ts` |

- Offentlig invitasjonsside: rute `/` (`src/pages/Invitasjon.tsx`) – RSVP-skjema og ønskeliste med reservasjon.
- Planleggingsverktøy: rute `/plan` (`src/pages/plan/`) – krever innlogging; kun `richard-lund@hotmail.com` og
  `jennie.lundgaard@gmail.com` har skrivetilgang (håndhevet med RLS-funksjonen `is_planner()`).
- URL i produksjon: `https://richard-lund-bot.github.io/bryllup-2027/` (Vite `base` er `/bryllup-2027/`).

## Naturlig språk-redigering via Claude Code

Denne repoen kan åpnes i Claude Code (web/app) med Supabase MCP tilkoblet. Da kan Richard og Jennie be Claude
gjøre endringer i planen i naturlig språk («flytt middagen til 17.30», «legg til gjest …»). Bruk da:

- `mcp__Supabase__execute_sql` mot prosjekt `ugpxjjufoxzsyfiegkzq` for datalesing/-endring.
- `mcp__Supabase__apply_migration` kun for skjemaendringer (DDL).
- Respekter enum-verdiene under. Svar på norsk.

Det finnes også en innebygd AI-assistent i selve appen (knappen «✨ Assistent» i planleggeren) som går via
edge-funksjonen og krever at secreten `ANTHROPIC_API_KEY` er satt i Supabase (Edge Functions → Secrets).

## Databaseskjema (public)

- `tasks` (01 Masterplan): title, category, status (`ikke_startet|pagar|ferdig`), priority (`lav|normal|hoy|kritisk`), due_date, assignee, notes, sort_order
- `budget_items` (02 Budsjett): name, category, vendor, estimate, actual, deposit, paid, payment_status (`ikke_betalt|depositum_betalt|delbetalt|betalt`), due_date, notes
- `guests` (03 Gjesteliste): name, email, phone, group_label, is_child, allergies, rsvp_status (`venter|kommer|kommer_ikke`), song_wish, speech, gift, thank_you_sent, invite_sent, table_id → seating_tables, notes
- `seating_tables` (04 Bordplassering): name, capacity, notes, sort_order
- `milestones` (05 Tidslinje): month (`YYYY-MM`), title, description, done, sort_order
- `schedule_items` (06 Kjøreplan): day (`fredag|lordag|sondag`), time (`HH:MM`), duration_min, title, responsible, location, notes, sort_order
- `module_items` (07–24, generisk arbeidsbok): module (`seremoni|hagen|regnplan|meny|drikke|innkjop|leverandorer|musikk|foto|dekor|klaer|transport|bemanning|risiko|huslogistikk|idebank|beslutningslogg|etterarbeid`), title, status, content (jsonb), notes, sort_order
- `wishlist_items` (ønskeliste): title, description, url, price, category, reserved_by, reserved_at, active, sort_order
- `rsvps` (svar fra gjester): name, email, phone, attending, num_adults, num_children, allergies, song_wish, message, processed
- `settings`: key (`bryllup` | `invitasjon` | `budsjett`), value (jsonb). `invitasjon` styrer teksten/programmet på den offentlige siden.

RLS: planleggerne har full tilgang; anonyme kan lese `settings` og aktive `wishlist_items`, sende inn `rsvps`,
og reservere ønsker via RPC-en `reserver_onske(item_id, navn)`.

## Kommandoer

```bash
npm install      # avhengigheter
npm run dev      # lokal utvikling (http://localhost:5173/bryllup-2027/)
npm run build    # typesjekk + produksjonsbygg (kjør alltid før push)
```

VIKTIG: Nettsiden serveres fra `docs/` på `main` (GitHub Pages: main:/docs).
`npm run build` skriver til `docs/` – **commit alltid `docs/` sammen med kodeendringer**,
ellers oppdateres ikke siden. Workflowen i `.github/workflows/deploy.yml` er kun en
manuell reserveløsning (workflow_dispatch) og skal ikke gjeninnføres som push-trigger
(auto-commitene dens kolliderer med sesjonens pusher).

Edge-funksjonen redeployes med Supabase MCP-verktøyet `deploy_edge_function`
(prosjekt `ugpxjjufoxzsyfiegkzq`, navn `ai-assistent`) – hold `supabase/functions/ai-assistent/index.ts` i sync.

## Bilder

Familiebilder ligger i `public/bilder/` (nedskalert for nett), sortert med prefiksene
`par-*`, `familie-*`, `hverdag-*` og `nyfodt-*` – se `public/bilder/README.md`.
Galleriet på invitasjonssiden styres av `GALLERI`-listen i `src/pages/Invitasjon.tsx`.
Mappen er offentlig – aldri legg inn bilder brudeparet ikke eksplisitt vil dele.

## Konvensjoner

- All tekst mot brukerne er på norsk (bokmål).
- Design: kremhvit/salvie/gull-palett definert i `src/index.css` (`--color-cream/sage/gold-*`), overskrifter i
  Cormorant Garamond (`font-display`).
- Sidene i planleggeren laster data med `useLast()` fra `src/lib/utils.ts` og lytter på hendelsen
  `bryllup:refresh` – kall `varsleEndring()` etter skriving slik at andre visninger oppdateres.
