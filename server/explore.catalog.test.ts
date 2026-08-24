import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("Explore catalog content", () => {
  const appSource = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");

  it("includes the requested restaurant placeholders with explicit placeholder labeling", () => {
    expect(appSource).toContain('name: "Danielitos Home Kitchen"');
    expect(appSource).toContain('name: "Malayas Cafe"');
    expect(appSource).toContain('tags: ["Food", "Local Flavors", "Placeholder Listing"]');
    expect(appSource).toContain('tags: ["Food", "Cafe", "Placeholder Listing"]');
    expect(appSource).toContain('d.placeholder&&<Tag tone="ochre">Placeholder listing</Tag>');
  });

  it("includes researched Laguna attractions with gallery views and avoids fabricated ratings", () => {
    for (const name of ["Rizal Shrine", "Seven Crater Lakes", "Mount Makiling", "Paete Woodcarving Heritage", "Enchanted Kingdom"]) {
      expect(appSource).toContain(`name: "${name}"`);
    }
    expect(appSource).toContain("verified: true");
    expect(appSource).toContain("gallery:");
    expect(appSource).toContain('d.rating?<span className="rating">');
    expect(appSource).toContain('d.placeholder?"Details pending":"Curated place"');
  });
});
