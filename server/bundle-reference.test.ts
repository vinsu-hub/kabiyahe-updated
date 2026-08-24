import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Popular Trip Bundles reference contract", () => {
  const app = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");
  const css = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");

  it("keeps the five curated routes image-backed and navigable", () => {
    expect(app).toContain('name: "Laguna Weekend Escape"');
    expect(app).toContain('name: "Family Adventure"');
    expect(app).toContain('name: "Food + Culture Tour"');
    expect(app).toContain('name: "Nature & Relaxation"');
    expect(app).toContain('name: "Hidden Laguna Gems"');
    expect(app).toContain('<img src={b.image} alt={b.name}/>');
    expect(app).toContain('<Button href={href} variant="outline">View Trip');
  });

  it("uses the reference overlay badge instead of a text-only card treatment", () => {
    expect(app).toContain('className="bundle-curated-badge"');
    expect(app).toContain("Curated route");
    expect(css).toContain(".home-section .bundle-card .bundle-curated-badge");
    expect(css).toContain("background:#eba83f");
  });

  it("keeps images and motion in source-controlled code while using webdev asset URLs", () => {
    expect(app).toContain("/manus-storage/kabiyahe-calinaya-lake_");
    expect(app).toContain("/manus-storage/kabiyahe-hero-laguna_");
    expect(app).toContain("/manus-storage/kabiyahe-bundles-sunset_");
    expect(css).toContain(".home-section .bundle-card:hover");
    expect(css).toContain("transition:transform .2s var(--ease-out)");
    expect(css).toContain("prefers-reduced-motion");
  });
});
