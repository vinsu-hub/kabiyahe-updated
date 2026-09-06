import { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "wouter";
import { ArrowRight, Check, Compass, Eye, EyeOff, Lock, Mail, Trophy, Utensils } from "lucide-react";
import { useAuth } from "@/lib/supabase/AuthProvider";
import { StampBadge, TIER_NAMES, WaxSealMark } from "./ElbiyaheFeatures";
import type { StampCategory } from "@/lib/supabase/types";

const PILLARS: { icon: typeof Compass; label: string; body: string; tone: string }[] = [
  { icon: Compass, label: "Explore", body: "Events · Places · Nature", tone: "var(--ochre)" },
  { icon: Utensils, label: "Discover", body: "Food · Culture · Hidden gems", tone: "var(--maroon)" },
  { icon: Trophy, label: "Experience", body: "Passport · Rewards · Community", tone: "var(--forest)" },
];

/** Code-drawn scene (mountain ridge, church, lake, jeepney, foliage) — no commissioned art,
    matching this app's established procedural-SVG pattern (WaxSealMark, SkylineMotif). */
function AuthHeroScene() {
  return (
    <svg viewBox="0 0 800 1000" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" aria-hidden="true">
      <defs>
        <linearGradient id="auth-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0B3D2E" /><stop offset="1" stopColor="#2E7D32" />
        </linearGradient>
      </defs>
      <rect width="800" height="1000" fill="url(#auth-sky)" />
      <circle cx="620" cy="120" r="60" fill="#FFC629" opacity="0.85" />

      {/* scene cluster kept in the upper band, clear of the text overlay's dark gradient zone below */}
      <g>
        {/* distant lake + reflection */}
        <rect y="210" width="800" height="110" fill="#08301F" opacity="0.45" />
        <line x1="60" y1="250" x2="230" y2="250" stroke="#2E7D32" strokeWidth="3" opacity="0.4" />
        <line x1="480" y1="275" x2="680" y2="275" stroke="#2E7D32" strokeWidth="3" opacity="0.4" />

        {/* church: simple abstract silhouette */}
        <g transform="translate(600 250) scale(0.85)" fill="#062c1f">
          <rect x="-26" y="0" width="52" height="60" />
          <polygon points="-32,0 32,0 0,-36" />
          <rect x="-3" y="-58" width="6" height="18" />
          <rect x="-9" y="-52" width="18" height="6" />
        </g>

        {/* road + jeepney */}
        <path d="M-40 340 Q400 300 840 340" stroke="#062c1f" strokeWidth="60" fill="none" opacity="0.6" />
        <path d="M-40 340 Q400 300 840 340" stroke="#FFC629" strokeWidth="3" strokeDasharray="14 12" fill="none" opacity="0.5" />
        <g transform="translate(230 322) scale(0.8)" fill="#FFC629">
          <rect x="-70" y="-34" width="150" height="40" rx="8" />
          <rect x="-50" y="-58" width="70" height="26" rx="6" />
          <rect x="-42" y="-52" width="54" height="16" rx="3" fill="#0B3D2E" />
          <circle cx="-38" cy="10" r="14" fill="#062c1f" />
          <circle cx="46" cy="10" r="14" fill="#062c1f" />
        </g>
      </g>

      {/* mountain ridges — background texture beneath the scene cluster and the text zone below */}
      <path d="M0 480 L160 340 L300 430 L460 320 L620 440 L800 360 L800 1000 L0 1000 Z" fill="#0B3D2E" opacity="0.6" />
      <path d="M0 560 L200 420 L380 540 L560 400 L800 520 L800 1000 L0 1000 Z" fill="#08301F" opacity="0.85" />

      {/* foliage framing the bottom corners, behind the text overlay */}
      <g fill="#0B3D2E" opacity="0.9">
        <path d="M0 1000 C40 940 20 890 90 860 C60 920 70 970 40 1000 Z" />
        <path d="M800 1000 C760 940 780 890 720 860 C750 920 740 970 770 1000 Z" />
      </g>
    </svg>
  );
}

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
        <AuthHeroScene />
        <div className="auth-art-content">
          <Link href="/" className="brand light"><img src="/brand/elbiyahe-mark.png" alt="" style={{ width: 44, height: 44 }} /><span>El-Biyahe!<small>Come Curious</small></span></Link>
          <p className="auth-tagline">EXPLORE · DISCOVER · EXPERIENCE</p>
          <h1>{mode === "up" ? "Ready to go places?" : "Welcome back, traveler."}</h1>
          <p className="auth-art-sub">
            {mode === "up"
              ? "Create your El-Biyahe! account and start discovering LB."
              : "Pick up where you left off in Los Baños."}
          </p>

          <div className="auth-pillars">
            {PILLARS.map(p => (
              <div className="auth-pillar" key={p.label} style={{ ["--pillar-tone" as any]: p.tone }}>
                <span className="auth-pillar-icon"><p.icon size={18} /></span>
                <div><b>{p.label}</b><small>{p.body}</small></div>
              </div>
            ))}
          </div>

          <div className="auth-seal"><WaxSealMark size={64} /></div>
          <span className="auth-tag-highlight">Come Curious!</span>
        </div>
      </div>

      <section className="auth-card">
        <Link href="/" className="auth-mark"><img src="/brand/elbiyahe-mark.png" alt="" /></Link>
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

        <Link href={next} className="auth-guest-cta">Just exploring? Continue as guest <ArrowRight size={14} /></Link>
        <p className="auth-guest-note">Browse freely — sign in later for RSVPs, Passport stamps, and reservations.</p>

        {mode === "up" && (
          <div className="auth-passport-teaser">
            <span className="eyebrow">WHAT HAPPENS NEXT</span>
            {[
              { label: "Create your account", state: "collected" as const },
              { label: "Discover Los Baños", state: "locked" as const },
              { label: "Collect experiences", state: "locked" as const },
              { label: "Earn rewards", state: "locked" as const },
            ].map((s, i) => (
              <div className="auth-passport-step" key={s.label}>
                <StampBadge seed={`teaser-${i}`} category={"Nature" as StampCategory} state={s.state} size={30} />
                <span>{i + 1}. {s.label}</span>
                {s.state === "collected" && <Check size={14} className="auth-passport-step-check" />}
              </div>
            ))}
            <small className="muted">Start as an {TIER_NAMES[1]} — level up as you go.</small>
          </div>
        )}
      </section>
    </div>
  );
}
