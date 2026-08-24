import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("Explore catalog content", () => {
  const appSource = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");
  const cssSource = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");

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

  it("exposes the Attractions quick filter and broadens discovery beyond Laguna", () => {
    expect(appSource).toContain('"Attractions"');
    expect(appSource).toContain('className="explore-quick-filters"');
    expect(appSource).toContain('aria-label="Browse destination categories"');
    expect(appSource).toContain('title="Explore the Philippines"');
    expect(appSource).toContain('Explore the Philippines');
    expect(appSource).toContain('across the Philippines');
    expect(cssSource).toContain('overflow-x:auto');
    expect(cssSource).toContain('touch-action:pan-x');
    expect(cssSource).toContain('white-space:nowrap');
  });

  it("includes researched Los Baños falls and resort leads with truthful status states", () => {
    for (const name of ["Dampalit Falls", "Al Fresco Springs", "Laresio Lakeside Resort & Spa", "Splash Mountain Resort"]) {
      expect(appSource).toContain(`name: "${name}"`);
      expect(appSource).toContain(`place: "Los Baños, Laguna"`);
    }
    expect(appSource).toContain('name: "Enchanted Kingdom", place: "Santa Rosa, Laguna", image: IMG.enchantedKingdom');
    expect(appSource).toContain('name: "Al Fresco Springs", place: "Brgy Tadlac, Los Baños, Laguna", image: IMG.alFresco');
    expect(appSource).toContain('name: "Laresio Lakeside Resort & Spa", place: "Los Baños, Laguna", image: IMG.laresio');
    expect(appSource).toContain('const homeFeaturedDestinationNames = ["Pagsanjan Falls", "Enchanted Kingdom", "Los Baños Hot Springs", "Laresio Lakeside Resort & Spa"]');
    expect(appSource).toContain("Confirm availability and rates directly with the venue.");
    expect(appSource).toContain("Trail conditions, access, and fees should be confirmed before visiting.");
  });
});
