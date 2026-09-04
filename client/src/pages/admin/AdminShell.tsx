import { Link, useLocation } from "wouter";
import { CalendarDays, Bus, QrCode, LayoutDashboard, ArrowLeft, Loader2, Utensils, BedDouble, Car } from "lucide-react";
import { useAuth } from "@/lib/supabase/AuthProvider";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/events", label: "Events", icon: CalendarDays },
  { href: "/admin/tours", label: "Bus Tours", icon: Bus },
  { href: "/admin/passport", label: "Passport", icon: QrCode },
  { href: "/admin/delicacies", label: "Delicacies", icon: Utensils },
  { href: "/admin/accommodations", label: "Stay & Eat", icon: BedDouble },
  { href: "/admin/parking", label: "Parking", icon: Car },
];

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { loading, isAuthenticated, isAdmin } = useAuth();
  const [, navigate] = useLocation();
  if (loading) return <div className="admin-gate"><Loader2 className="elbiyahe-spin" /> Checking access…</div>;
  if (!isAuthenticated) { navigate("/login?next=/admin"); return null; }
  if (!isAdmin) {
    return (
      <div className="admin-gate">
        <h1>Admin only</h1>
        <p>Your account doesn't have the admin role.</p>
        <Link href="/" className="btn primary">Back to El-Biyahe!</Link>
      </div>
    );
  }
  return <>{children}</>;
}

export function AdminShell({ title, children, actions }: { title: string; children: React.ReactNode; actions?: React.ReactNode }) {
  const [location] = useLocation();
  const { profile } = useAuth();
  return (
    <div className="admin-root">
      <aside className="admin-sidebar">
        <Link href="/" className="admin-brand"><img src="/brand/elbiyahe-mark.png" alt="" /> <span>El-Biyahe! Admin</span></Link>
        <nav>
          {NAV.map(n => {
            const I = n.icon;
            const active = n.href === "/admin" ? location === "/admin" : location.startsWith(n.href);
            return <Link key={n.href} href={n.href} className={active ? "active" : ""}><I size={17} /> {n.label}</Link>;
          })}
        </nav>
        <Link href="/" className="admin-exit"><ArrowLeft size={15} /> Back to site</Link>
        <div className="admin-who">{profile?.display_name ?? "admin"}</div>
      </aside>
      <main className="admin-main">
        <header className="admin-head">
          <h1>{title}</h1>
          <div>{actions}</div>
        </header>
        {children}
      </main>
    </div>
  );
}
