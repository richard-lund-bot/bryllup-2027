import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";

export default function Login() {
  const [feil, setFeil] = useState<string | null>(null);
  const [jobber, setJobber] = useState(false);

  const loggInn = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setJobber(true);
    setFeil(null);
    const f = new FormData(e.currentTarget);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(f.get("epost")).trim().toLowerCase(),
      password: String(f.get("passord")),
    });
    setJobber(false);
    if (error) setFeil("Feil e-post eller passord.");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-sage-800 px-6">
      <div className="w-full max-w-sm rounded-2xl bg-cream-50 p-8 shadow-2xl">
        <h1 className="font-display text-center text-3xl text-sage-800">Bryllup 2027</h1>
        <p className="mt-2 text-center text-sm text-sage-600">Planleggingsverktøy for Richard &amp; Jennie</p>
        <form onSubmit={loggInn} className="mt-8 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-sage-800">E-post</span>
            <input name="epost" type="email" required autoComplete="email" className="plan-input mt-1" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-sage-800">Passord</span>
            <input name="passord" type="password" required autoComplete="current-password" className="plan-input mt-1" />
          </label>
          {feil && <p className="text-sm text-red-700">{feil}</p>}
          <button type="submit" disabled={jobber} className="btn-primary w-full justify-center">
            {jobber ? "Logger inn …" : "Logg inn"}
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-sage-500">
          <Link to="/" className="hover:text-sage-700">
            ← Til invitasjonssiden
          </Link>
        </p>
      </div>
    </div>
  );
}
