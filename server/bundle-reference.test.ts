import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Popular Trip Bundles reference contract", () => {
  const app = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");
  const assets = readFileSync(resolve(process.cwd(), "client/src/lib/assets.ts"), "utf8");
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

  it("keeps hosted and local image resolution paths available", () => {
    expect(assets).toContain("VITE_KABIYAHE_LOCAL_ASSETS");
    expect(assets).toContain('"/assets"');
    expect(assets).toContain('"/manus-storage"');
    expect(app).toContain("kabiyahe-calinaya-lake_96b9ff18.jpg");
    expect(app).toContain("kabiyahe-hero-laguna_e334210c.jpg");
    expect(app).toContain("kabiyahe-bundles-sunset_99ff267e.jpg");
    expect(css).toContain(".home-section .bundle-card:hover");
    expect(css).toContain("transition:transform .2s var(--ease-out)");
    expect(css).toContain("prefers-reduced-motion");
  });
});
