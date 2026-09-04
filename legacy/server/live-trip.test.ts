import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("Live Trip Mode contracts", () => {
  const source = readFileSync(resolve(process.cwd(), "client/src/pages/LiveTrip.tsx"), "utf8");

  it("starts in an explicit location-unavailable state", () => {
    expect(source).toContain('useState<LiveStatus>("unavailable")');
    expect(source).toContain("Location is not shared");
    expect(source).toContain("navigator.geolocation.getCurrentPosition");
  });

  it("uses the shared real map and only renders the user marker when active", () => {
    expect(source).toContain("<MapView");
    expect(source).toContain("new google.maps.DirectionsService()");
    expect(source).toContain("showUser");
    expect(source).toContain("<LiveMap points={points} showUser={liveActive}/>");
  });

  it("keeps quick-stop suggestions verified and avoids fabricated live distances", () => {
    expect(source).toContain("Verified food stop");
    expect(source).toContain("Verified scenic stop");
    expect(source).not.toContain("6 min off your route");
    expect(source).not.toContain("4 min off your route");
    expect(source).toContain("Only verified Kabiyahe destinations can be added to your trip.");
  });
});
