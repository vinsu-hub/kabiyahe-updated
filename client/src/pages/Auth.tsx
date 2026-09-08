import { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "wouter";
import { ArrowRight, Eye, EyeOff, Lock, Mail, Send } from "lucide-react";
import { useAuth } from "@/lib/supabase/AuthProvider";

export function Auth({ signup = false }: { signup?: boolean }) {
  const { signInWithPassword, signUp, signInWithGoogle, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [params] = useSearchParams();
  const next = params.get("next") || "/";

  const [mode, setMode] = useState<"in" | "up">(signup ? "up" : "in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  // Covers the Google OAuth round-trip: the app reloads with a fresh session, remounting this
  // page — the password flow already navigates manually right after submit() resolves.
  useEffect(() => {
    if (isAuthenticated) navigate(next);
  }, [isAuthenticated]);

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

  const onGoogle = async () => {
    setGoogleBusy(true); setMsg(null);
    const { error } = await signInWithGoogle();
    setGoogleBusy(false);
    if (error) setMsg(error);
  };

  return (
    <div className="auth-page">
      <div className="auth-art">
        <h1 className="sr-only">{mode === "up" ? "Create your El-Biyahe! account" : "Sign in to El-Biyahe!"}</h1>
        <img
          className="auth-art-photo"
          src="/auth/signup-hero.png"
          alt="Los Baños: forested mountains, a lake, a church and a jeepney on a winding road"
        />
      </div>

      <section className="auth-card">
        <Link href="/" className="auth-mark"><img src="/brand/elbiyahe-mark.png" alt="" /></Link>
        <span className="auth-plane"><Send size={18} /></span>
        <p className="eyebrow">{mode === "up" ? "CREATE YOUR ACCOUNT" : "WELCOME BACK"}</p>
        <h1>{mode === "up" ? "Welcome, traveler!" : "Good to see you again."}</h1>
        <p className="muted">
          {mode === "up"
            ? "Your next El-Biyahe! adventure starts here."
            : "Sign in to pick up your journey."}
        </p>

        <button className="btn secondary" style={{ width: "100%" }} onClick={onGoogle} disabled={googleBusy}>
          {googleBusy ? "Connecting…" : "Continue with Google"}
        </button>
        <div className="auth-provider-note"><span>or {mode === "up" ? "sign up" : "sign in"} with email</span></div>

        <form onSubmit={submit}>
          {mode === "up" && (
            <label className="modal-field">Display name
              <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="How should we call you?" />
            </label>
          )}
          <label className="modal-field auth-field-icon">Email address
            <span className="auth-field-icon-mark"><Mail size={15} /></span>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
          </label>
          <label className="modal-field auth-field-icon">Password
            <span className="auth-field-icon-mark"><Lock size={15} /></span>
            <input
              type={showPassword ? "text" : "password"}
              required minLength={6} value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            <button type="button" className="auth-password-toggle" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(v => !v)}>
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </label>

          {mode === "up" && (
            <label className="auth-consent">
              <input type="checkbox" required checked={consent} onChange={e => setConsent(e.target.checked)} />
              <span>I agree to the <a href="#" onClick={ev => ev.preventDefault()}>Terms</a> &amp; <a href="#" onClick={ev => ev.preventDefault()}>Privacy Policy</a></span>
            </label>
          )}

          {msg && <p className="auth-error" role="alert">{msg}</p>}
          {ok && <p className="auth-ok" role="status">{ok}</p>}
          <button className="btn primary" type="submit" disabled={busy} style={{ width: "100%" }}>
            {busy ? "…" : mode === "up" ? "Start my journey" : "Continue my journey"} <ArrowRight size={16} />
          </button>
        </form>

        <p className="auth-switch">
          {mode === "up" ? "Already have an account?" : "New to El-Biyahe!?"}{" "}
          <button className="link-accent" onClick={() => { setMode(mode === "up" ? "in" : "up"); setMsg(null); setOk(null); }}>
            {mode === "up" ? "Sign in" : "Create an account"}
          </button>
        </p>

        <Link href={next} className="auth-guest-cta is-plain">Just exploring? Continue as guest <ArrowRight size={14} /></Link>
        <p className="auth-guest-note">Browse freely — sign in later for RSVPs, Passport stamps, and reservations.</p>

        <div className="auth-passport-teaser is-image">
          <img
            className="auth-passport-img"
            src="/auth/passport-steps.png"
            alt="Your El-Biyahe! Passport — your journey in Los Baños in 4 steps: 1) create your account, 2) discover Los Baños, 3) collect experiences, 4) earn rewards"
          />
        </div>
      </section>
    </div>
  );
}
