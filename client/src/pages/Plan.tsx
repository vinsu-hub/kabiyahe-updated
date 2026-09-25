import { Link } from "wouter";
import { ArrowLeft, Bus } from "lucide-react";
import { BottomNav, Footer, Header, PageHero } from "@/components/shell";
import "@/styles/pages/plan.css";

/** Entry point for the forthcoming day planner. */
export function PlanPage() {
  return <><Header /><main className="container plan-stub"><PageHero eyebrow="PLAN YOUR DAY" title="Make a day of it." subtitle="Come Curious" body="A Los Baños day plan is on its way. Explore current bus tours while we prepare the planner." actions={<Link className="btn secondary" href="/tours"><Bus size={17} /> Explore Bus Tours</Link>} /><div className="plan-stub-note"><h2>Your day starts here</h2><p>Browse tours and places now. The itinerary builder will be available soon.</p><Link href="/" className="link-accent"><ArrowLeft size={16} /> Back home</Link></div></main><Footer /><BottomNav /></>;
}
