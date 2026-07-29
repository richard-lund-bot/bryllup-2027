# Databasemigrasjoner

Databasen kjører i Supabase-prosjektet **Bryllup 2027** (`ugpxjjufoxzsyfiegkzq`).

Migrasjonene er allerede kjørt og ligger lagret i prosjektets migrasjonshistorikk:

| Navn | Innhold |
|---|---|
| `bryllup_schema` | Alle tabeller, RLS-policyer, `is_planner()`, `reserver_onske()` RPC |
| `bryllup_seed_data` | Startdata: masterplan, budsjett, tidslinje, kjøreplan, moduler, bord, ønskeliste, innstillinger |

Hele skjemaet (tabeller og kolonner) er dokumentert i `CLAUDE.md` i rot-mappen.

Migrasjonshistorikken kan hentes ut med Supabase MCP-verktøyet `list_migrations`,
eller ses i Supabase-dashbordet under **Database → Migrations**.
