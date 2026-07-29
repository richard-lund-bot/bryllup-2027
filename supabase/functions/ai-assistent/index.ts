// AI-assistent for Bryllup 2027
// Supabase Edge Function som kobler planleggingsverktøyet til Claude.
// Krever secret: ANTHROPIC_API_KEY (settes i Supabase-dashbordet under Edge Functions → Secrets)

import Anthropic from "npm:@anthropic-ai/sdk";
import { createClient } from "npm:@supabase/supabase-js@2";

const PLANLEGGERE = ["richard-lund@hotmail.com", "jennie.lundgaard@gmail.com"];

const TABELLER = [
  "tasks",
  "budget_items",
  "guests",
  "seating_tables",
  "milestones",
  "schedule_items",
  "module_items",
  "wishlist_items",
  "rsvps",
  "settings",
];

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM = `Du er bryllupsassistenten til Richard og Jennie, som gifter seg lørdag 7. august 2027 kl. 14.00 i Strømsgodset kirke i Drammen, med fest i hagen hjemme (ca. 45 gjester, kokk lager maten på husets kjøkken).

Du har direkte tilgang til hele arbeidsboken deres (en Supabase-database) gjennom verktøyene dine, og kan både svare på spørsmål og gjøre endringer når de ber om det.

Tabeller og viktige felter:
- tasks (01 Masterplan): title, category, status (ikke_startet|pagar|ferdig), priority (lav|normal|hoy|kritisk), due_date (YYYY-MM-DD), assignee, notes, sort_order
- budget_items (02 Budsjett): name, category, vendor, estimate, actual, deposit, paid, payment_status (ikke_betalt|depositum_betalt|delbetalt|betalt), due_date, notes
- guests (03 Gjesteliste): name, email, phone, group_label, is_child, allergies, rsvp_status (venter|kommer|kommer_ikke), song_wish, speech, gift, thank_you_sent, invite_sent, table_id (uuid → seating_tables), notes
- seating_tables (04 Bordplassering): name, capacity, notes, sort_order
- milestones (05 Tidslinje): month (YYYY-MM), title, description, done, sort_order
- schedule_items (06 Kjøreplan for helgen): day (fredag|lordag|sondag), time (HH:MM), duration_min, title, responsible, location, notes, sort_order
- module_items (arbeidsbok 07–24): module (en av: seremoni, hagen, regnplan, meny, drikke, innkjop, leverandorer, musikk, foto, dekor, klaer, transport, bemanning, risiko, huslogistikk, idebank, beslutningslogg, etterarbeid), title, status, notes, sort_order
- wishlist_items (ønskeliste på invitasjonssiden): title, description, url, price, category, reserved_by, active, sort_order
- rsvps (svar fra gjester via invitasjonssiden): name, email, phone, attending, num_adults, num_children, allergies, song_wish, message, processed
- settings (innhold): key ('bryllup' | 'invitasjon' | 'budsjett'), value (jsonb). 'invitasjon' styrer teksten på den offentlige invitasjonssiden (overskrift, velkomsttekst, rsvp_frist, program[], praktisk[], kontakt[]).

Retningslinjer:
- Svar alltid på norsk, kort og vennlig.
- Hent gjerne data først for å gi presise svar (f.eks. summér budsjett selv).
- Når du endrer noe: gjør endringen med verktøyene, og oppsummer etterpå hva du gjorde.
- Viktige beslutninger de tar bør du foreslå å logge i module_items med module='beslutningslogg'.
- Slett aldri mange rader på en gang uten at de eksplisitt ber om det.
- Dagens dato får du i første melding.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    // 1) Autentisering – kun Richard og Jennie
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );
    const { data: userData, error: userErr } = await supabaseAuth.auth.getUser(token);
    const email = userData?.user?.email?.toLowerCase();
    if (userErr || !email || !PLANLEGGERE.includes(email)) {
      return json({ error: "Ikke tilgang." }, 403);
    }

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return json(
        {
          error:
            "ANTHROPIC_API_KEY er ikke satt. Gå til Supabase-dashbordet → Edge Functions → Secrets og legg inn en API-nøkkel fra console.anthropic.com.",
        },
        500,
      );
    }

    const { messages } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return json({ error: "Mangler meldinger." }, 400);
    }

    // 2) Dataklient (service role – RLS omgås, men kun planleggere når hit)
    const db = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const anthropic = new Anthropic({ apiKey });

    const tools = [
      {
        name: "hent_rader",
        description:
          "Hent rader fra en tabell i arbeidsboken. Bruk filter for likhet på kolonner. Returnerer maks 200 rader.",
        input_schema: {
          type: "object",
          properties: {
            tabell: { type: "string", enum: TABELLER },
            filter: { type: "object", description: "Kolonne→verdi som må matche (valgfritt)" },
            sorter: { type: "string", description: "Kolonne å sortere på (valgfritt)" },
          },
          required: ["tabell"],
        },
      },
      {
        name: "opprett_rader",
        description: "Sett inn én eller flere nye rader i en tabell.",
        input_schema: {
          type: "object",
          properties: {
            tabell: { type: "string", enum: TABELLER },
            rader: { type: "array", items: { type: "object" }, description: "Radene som skal settes inn" },
          },
          required: ["tabell", "rader"],
        },
      },
      {
        name: "oppdater_rader",
        description: "Oppdater rader som matcher filteret. Filteret kan ikke være tomt.",
        input_schema: {
          type: "object",
          properties: {
            tabell: { type: "string", enum: TABELLER },
            filter: { type: "object", description: "Kolonne→verdi som må matche" },
            verdier: { type: "object", description: "Felter som skal endres" },
          },
          required: ["tabell", "filter", "verdier"],
        },
      },
      {
        name: "slett_rader",
        description: "Slett rader som matcher filteret. Filteret kan ikke være tomt. Bruk med varsomhet.",
        input_schema: {
          type: "object",
          properties: {
            tabell: { type: "string", enum: TABELLER },
            filter: { type: "object", description: "Kolonne→verdi som må matche" },
          },
          required: ["tabell", "filter"],
        },
      },
    ];

    let endret = false;

    // deno-lint-ignore no-explicit-any
    const kjorVerktoy = async (navn: string, input: any): Promise<string> => {
      const tabell = String(input?.tabell ?? "");
      if (!TABELLER.includes(tabell)) return JSON.stringify({ feil: "Ukjent tabell" });

      if (navn === "hent_rader") {
        let q = db.from(tabell).select("*").limit(200);
        for (const [k, v] of Object.entries(input.filter ?? {})) q = q.eq(k, v as never);
        if (input.sorter) q = q.order(String(input.sorter));
        const { data, error } = await q;
        return JSON.stringify(error ? { feil: error.message } : { rader: data });
      }
      if (navn === "opprett_rader") {
        const { data, error } = await db.from(tabell).insert(input.rader).select();
        if (!error) endret = true;
        return JSON.stringify(error ? { feil: error.message } : { opprettet: data?.length ?? 0, rader: data });
      }
      if (navn === "oppdater_rader") {
        const filter = input.filter ?? {};
        if (Object.keys(filter).length === 0) return JSON.stringify({ feil: "Filter kan ikke være tomt" });
        let q = db.from(tabell).update(input.verdier ?? {});
        for (const [k, v] of Object.entries(filter)) q = q.eq(k, v as never);
        const { data, error } = await q.select();
        if (!error) endret = true;
        return JSON.stringify(error ? { feil: error.message } : { oppdatert: data?.length ?? 0 });
      }
      if (navn === "slett_rader") {
        const filter = input.filter ?? {};
        if (Object.keys(filter).length === 0) return JSON.stringify({ feil: "Filter kan ikke være tomt" });
        let q = db.from(tabell).delete();
        for (const [k, v] of Object.entries(filter)) q = q.eq(k, v as never);
        const { data, error } = await q.select();
        if (!error) endret = true;
        return JSON.stringify(error ? { feil: error.message } : { slettet: data?.length ?? 0 });
      }
      return JSON.stringify({ feil: "Ukjent verktøy" });
    };

    const idag = new Date().toLocaleDateString("nb-NO", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Europe/Oslo",
    });

    // deno-lint-ignore no-explicit-any
    const samtale: any[] = [
      { role: "user", content: `(Dagens dato: ${idag}.)` },
      { role: "assistant", content: "Notert." },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: String(m.content).slice(0, 8000),
      })),
    ];

    // Verktøyløkke – Claude henter/endrer data til den er ferdig
    let svarTekst = "";
    for (let runde = 0; runde < 12; runde++) {
      // deno-lint-ignore no-explicit-any
      const respons: any = await anthropic.beta.messages.create({
        model: "claude-opus-5",
        max_tokens: 8000,
        system: SYSTEM,
        messages: samtale,
        tools,
        // Fallback ved ev. sikkerhetsavslag – svarer med Opus 4.8 i stedet for å feile
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        // deno-lint-ignore no-explicit-any
      } as any);

      if (respons.stop_reason === "refusal") {
        svarTekst = "Jeg kunne dessverre ikke svare på dette. Prøv å formulere deg annerledes.";
        break;
      }

      const tekstBlokker = respons.content.filter((b: { type: string }) => b.type === "text");
      const verktoyBlokker = respons.content.filter((b: { type: string }) => b.type === "tool_use");

      if (respons.stop_reason !== "tool_use" || verktoyBlokker.length === 0) {
        svarTekst = tekstBlokker.map((b: { text: string }) => b.text).join("\n");
        break;
      }

      samtale.push({ role: "assistant", content: respons.content });
      const resultater = [];
      for (const blokk of verktoyBlokker) {
        const resultat = await kjorVerktoy(blokk.name, blokk.input);
        resultater.push({ type: "tool_result", tool_use_id: blokk.id, content: resultat });
      }
      samtale.push({ role: "user", content: resultater });
    }

    if (!svarTekst) {
      svarTekst = "Jeg brukte opp rundene mine uten å bli helt ferdig – prøv å dele forespørselen i mindre biter.";
    }

    return json({ reply: svarTekst, endret });
  } catch (e) {
    console.error(e);
    const melding = e instanceof Error ? e.message : "Ukjent feil";
    return json({ error: `Assistenten feilet: ${melding}` }, 500);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
