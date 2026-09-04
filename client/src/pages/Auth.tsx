import { useState } from "react";
import { Link, useLocation, useSearchParams } from "wouter";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/supabase/AuthProvider";

export function Auth({ signup = false }: { signup?: boolean }) {
  const { signInWithPassword, signUp, signInWithGoogle } = useAuth();
  const [, navigate] = useLocation();
  const [params] = useSearchParams();
  const next = params.get("next") || "/";

  const [mode, setMode] = useState<"in" | "up">(signup ? "up" : "in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setMsg(null); setOk(null);
    if (mode === "in") {
      const { error } = await signInWithPassword(email, password);
      setBusy(false);
      if (error) return setMsg(error);
      navigate(next);
    } else {
      const { error, needsConfirm } = await signUp(email, password, displayName || undefined);
      setBusy(false);
      if (error) return setMsg(error);
      if (needsConfirm) return setOk("Check your inbox to confirm your email, then sign in.");
      navigate(next);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-art">
        <img src="/scenes/elbi-hero.svg" alt="Mt. Makiling, Los Baños" />
        <div>
          <Link href="/" className="brand light"><img src="/brand/elbi-mark.png" alt="" style={{ width: 44, height: 44 }} /><span>ELBI<small>Come Curious</small></span></Link>
          <h1>Discover the many<br />sides of Los Baños.</h1>
        </div>
      </div>
      <section className="auth-card">
        <Link href="/" className="auth-mark"><img src="/brand/elbi-mark.png" alt="" /></Link>
        <p className="eyebrow">{mode === "up" ? "CREATE YOUR ACCOUNT" : "WELCOME BACK"}</p>
        <h1>{mode === "up" ? "Come curious." : "Good to see you again."}</h1>
        <p className="muted">
          {mode === "up"
            ? "RSVP to events, collect Passport stamps, and reserve bus tours."
            : "Pick up where you left off in Los Baños."}
        </p>

        <button className="btn secondary" style={{ width: "100%" }} onClick={() => signInWithGoogle()}>
          Continue with Google
        </button>
        <div className="auth-provider-note">or use your email</div>

        <form onSubmit={submit}>
          {mode === "up" && (
            <label className="modal-field">Display name
              <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="How should we call you?" />
            </label>
          )}
          <label className="modal-field">Email address
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
          </label>
          <label className="modal-field">Password
            <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
          </label>
          {msg && <p className="auth-error" role="alert">{msg}</p>}
          {ok && <p className="auth-ok" role="status">{ok}</p>}
          <button className="btn primary" type="submit" disabled={busy} style={{ width: "100%" }}>
            {busy ? "…" : mode === "up" ? "Create account" : "Sign in"} <ArrowRight size={16} />
          </button>
        </form>

        <p className="auth-switch">
          {mode === "up" ? "Already have an account?" : "New to ELBI?"}{" "}
          <button className="link-accent" onClick={() => { setMode(mode === "up" ? "in" : "up"); setMsg(null); setOk(null); }}>
            {mode === "up" ? "Sign in" : "Create an account"}
          </button>
        </p>
        <p className="auth-switch">
          <Link href={next} className="link-accent">Continue as guest</Link> — browse freely, sign in later for RSVP, Passport, and reservations.
        </p>
      </section>
    </div>
  );
}
