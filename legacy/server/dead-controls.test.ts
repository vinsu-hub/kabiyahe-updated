import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("dead-control audit contracts", () => {
  const app = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");
  const partner = readFileSync(resolve(process.cwd(), "client/src/pages/PartnerPortal.tsx"), "utf8");
  const liveTrip = readFileSync(resolve(process.cwd(), "client/src/pages/LiveTrip.tsx"), "utf8");

  it("keeps primary traveler routes registered", () => {
    expect(app).toContain('path="/explore"');
    expect(app).toContain('path="/bundles"');
    expect(app).toContain('path="/plan/new"');
    expect(app).toContain('path="/trips"');
    expect(app).toContain('path="/account"');
    expect(app).toContain('path="/trips/:id/live"');
  });

  it("does not leave partner sign-out as an integration-only notice", () => {
    expect(partner).toContain("const {user,loading,logout}=useAuth();");
    expect(partner).toContain("await logout()");
    expect(partner).not.toContain("Partner sign out is ready for auth integration.");
  });

  it("gives admin preview controls real destinations or preview surfaces", () => {
    expect(partner).toContain('href="/partners/join"');
    expect(partner).toContain("setReviewing(p)");
    expect(partner).toContain("setShowAudit(true)");
    expect(partner).toContain('aria-label={`Review ${p.name}`}');
    expect(partner).toContain('aria-label="Full audit log"');
  });

  it("uses real logout and OAuth submission paths for traveler auth controls", () => {
    expect(app).toContain("const {logout}=useAuth();");
    expect(app).toContain('await logout()');
    expect(app).toContain("<form onSubmit={e=>{e.preventDefault();startLogin()}}>");
    expect(app).not.toContain('function Auth({signup=false}:{signup?:boolean}) { const [submitted,setSubmitted]=useState(false);');
  });

  it("labels live-trip data that is not available instead of implying telemetry", () => {
    expect(liveTrip).toContain("Live telemetry");
    expect(liveTrip).toContain("Not available");
    expect(liveTrip).toContain("Start Live Trip to enable");
    expect(liveTrip).not.toContain("6 min off your route");
    expect(liveTrip).not.toContain("4 min off your route");
  });
});
