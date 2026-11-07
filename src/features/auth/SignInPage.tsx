import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./authContext";

export default function SignInPage() {
  const { configurationError, loading, signIn, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await signIn(email.trim(), password);
    } catch {
      setError("Sign-in failed. Check your credentials and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!loading && user) {
    return <Navigate replace to="/" />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-4 py-8">
      <section className="card w-full max-w-md">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-navy">J Collection</p>
        <h1 className="mt-3 text-2xl font-semibold text-ink">Owner sign in</h1>
        <p className="mt-2 text-sm text-slate-500">Access customer details and measurement history securely.</p>

        {configurationError ? (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Firebase is not configured for this environment. Add the client variables from `.env.example`.
          </div>
        ) : null}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="label">Email</span>
            <input
              autoComplete="username"
              className="input"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>
          <label className="block">
            <span className="label">Password</span>
            <input
              autoComplete="current-password"
              className="input"
              minLength={6}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>
          {error ? <p className="text-sm text-red-700" role="alert">{error}</p> : null}
          <button className="button-primary w-full disabled:cursor-not-allowed disabled:opacity-60" disabled={submitting || Boolean(configurationError)} type="submit">
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <details className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
          <summary className="cursor-pointer font-semibold text-navy">Need help?</summary>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>Check your internet connection.</li>
            <li>Refresh the page, or close and reopen the browser.</li>
            <li>Turn airplane mode on and off, then try again.</li>
            <li>If the problem continues, restart the device and contact the owner/admin.</li>
          </ul>
        </details>
        <p className="mt-6 text-center text-xs text-slate-500">Developed by <a className="text-navy underline" href="https://dakshtitarmare.vercel.app" rel="noreferrer" target="_blank">Daksh Titarmare</a></p>
      </section>
    </main>
  );
}
