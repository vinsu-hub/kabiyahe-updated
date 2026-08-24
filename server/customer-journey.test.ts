import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("customer journey contracts", () => {
  const appSource = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");

  it("keeps Explore lodging discovery connected to category and detail routes", () => {
    expect(appSource).toContain('"Hotels & Stays":"Hotels"');
    expect(appSource).toContain('name: "Seda Nuvali"');
    expect(appSource).toContain('name: "Sol Y Viento Hotels and Resorts"');
    expect(appSource).toContain('<Route path="/explore/:id"');
    expect(appSource).toContain('href=`/explore/${slugify(d.name)}`');
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
