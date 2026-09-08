import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useSearchParams } from "wouter";
import { ArrowRight, Eye, EyeOff, Lock, Mail, Send } from "lucide-react";
import { useAuth } from "@/lib/supabase/AuthProvider";

/** Google "G" — lucide has no brand logo, so this is the official 4-colour mark inline. */
function GoogleG() {
  return (
    <svg className="auth-google-g" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h11.8c-.5 2.7-2 5-4.4 6.6v5.5h7.1c4.1-3.8 6.6-9.4 6.6-16.6z" />
      <path fill="#34A853" d="M24 46c5.9 0 10.9-2 14.5-5.4l-7.1-5.5c-2 1.3-4.5 2.1-7.4 2.1-5.7 0-10.5-3.8-12.2-9H4.4v5.7C8 40.9 15.4 46 24 46z" />
      <path fill="#FBBC05" d="M11.8 27.2c-.4-1.3-.7-2.7-.7-4.2s.2-2.9.7-4.2v-5.7H4.4A22 22 0 0 0 2 23c0 3.6.9 7 2.4 10l7.4-5.8z" />
      <path fill="#EA4335" d="M24 9.9c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C34.9 3.3 29.9 1 24 1 15.4 1 8 6.1 4.4 13.3l7.4 5.7C13.5 13.7 18.3 9.9 24 9.9z" />
    </svg>
  );
}

export function Auth({ signup = false }: { signup?: boolean }) {
  const { signInWithPassword, signUp, signInWithGoogle, resetPasswordForEmail, isAuthenticated } = useAuth();
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
  const emailRef = useRef<HTMLInputElement>(null);

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

  const onForgot = async () => {
    setMsg(null); setOk(null);
    if (!email.trim()) {
      setMsg("Enter your email first, then tap Forgot password.");
      emailRef.current?.focus();
      return;
    }
    setBusy(true);
    const { error } = await resetPasswordForEmail(email.trim());
    setBusy(false);
    if (error) return setMsg(error);
    setOk("Password reset link sent — check your inbox.");
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
        <img
          className="auth-art-photo-mobile"
          src="/auth/mobile-hero.jpg"
          alt="Mt. Makiling above Laguna de Bay, with an El-Biyahe! tour bus on the lakeshore road"
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
          {googleBusy ? "Connecting…" : <><GoogleG /> Continue with Google</>}
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
            <input ref={emailRef} type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
          </label>
          <label className="modal-field auth-field-icon">Password
            <span className="auth-field-icon-mark"><Lock size={15} /></span>
            <input
              type={showPassword ? "text" : "password"}
              required minLength={6} value={password}
              autoComplete={mode === "up" ? "new-password" : "current-password"}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            <button type="button" className="auth-password-toggle" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(v => !v)}>
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </label>

          {mode === "in" && (
            <button type="button" className="auth-forgot" onClick={onForgot} disabled={busy}>Forgot password?</button>
          )}

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
        <Link href="/passport" className="auth-passport-promo">
          <img src="/auth/passport-mark.png" alt="" />
          <span><b>Your El-Biyahe! Passport</b><small>Explore · Collect · Earn</small></span>
          <ArrowRight size={18} />
        </Link>
      </section>
    </div>
  );
}
