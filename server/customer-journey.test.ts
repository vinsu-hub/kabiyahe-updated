import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("customer journey contracts", () => {
  const appSource = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");
  const styleSource = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");

  it("keeps Explore lodging discovery connected to category and detail routes", () => {
    expect(appSource).toContain('"Hotels & Stays":"Hotels"');
    expect(appSource).toContain('name: "Seda Nuvali"');
    expect(appSource).toContain('name: "Sol Y Viento Hotels and Resorts"');
    expect(appSource).toContain('<Route path="/explore/:id"');
    expect(appSource).toContain('href=`/explore/${slugify(d.name)}`');
  });

  it("keeps audited stop actions and mobile-safe spacing in place", () => {
    expect(appSource).toContain("Navigate");
    expect(appSource).toContain("Booking");
    expect(appSource).toContain("Find a guide");
    expect(styleSource).toContain(".stop-actions{display:flex;flex-wrap:wrap");
    expect(styleSource).toContain(".trip-page{padding-bottom:calc(150px + env(safe-area-inset-bottom))}");
    expect(styleSource).toContain(".trip-stop>a img{width:100%;height:130px");
  });

  it("keeps the responsive footer navigation and mobile clearance present", () => {
    expect(appSource).toContain('className="site-footer"');
    expect(appSource).toContain('aria-label="Footer navigation"');
    expect(appSource).toContain('href="/explore"');
    expect(appSource).toContain('href="/partners/join"');
    expect(styleSource).toContain('.site-footer');
    expect(styleSource).toContain('padding:40px 0 92px');
  });

  it("keeps Los Baños stay discovery and local spot handoffs truthful", () => {
    expect(appSource).toContain('airbnbLosBanosUrl = "https://www.airbnb.com/s/Los-Banos--Laguna--Philippines/homes"');
    expect(appSource).toContain("View Airbnb stays");
    expect(appSource).toContain("Kabiyahe does not reproduce or estimate Airbnb availability, pricing, or ratings.");
    expect(appSource).toContain("Local Spots Highlights");
    expect(appSource).toContain("Elbi Community Sunday Market");
    expect(appSource).toContain("Elbi Community Night Market");
    expect(appSource).toContain('target="_blank" rel="noreferrer"');
    expect(styleSource).toContain(".stay-discovery");
    expect(styleSource).toContain(".local-spots-grid");
  });

  it("keeps the main customer journey escape routes and wallet handoffs present", () => {
    expect(appSource).toContain('href="/explore"');
    expect(appSource).toContain('href="/plan/new"');
    expect(appSource).toContain('href="/trips"');
    expect(appSource).toContain('href={`/trips/${id}/wallet`}');
    expect(appSource).toContain("Kabiyahe never processes payment.");
    expect(appSource).toContain('Back to Explore');
    expect(appSource).toContain('Back to My Trips');
  });
});
