import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("route overview contracts", () => {
  const source = readFileSync(resolve(process.cwd(), "client/src/components/RouteOverview.tsx"), "utf8");
  const mapSource = readFileSync(resolve(process.cwd(), "client/src/components/Map.tsx"), "utf8");

  it("contains five real Laguna itinerary points with coordinates", () => {
    expect(source).toContain("Pagsanjan Falls");
    expect(source).toContain("Majayjay Church");
    expect(source).toContain("Los Baños Hot Springs");
    expect(source).toContain("Sol Y Viento Hotels and Resorts");
    expect((source.match(/position: \{ lat: [0-9]/g) || []).length).toBe(5);
  });

  it("loads Google Maps through one shared idempotent loader", () => {
    expect(mapSource).toContain("__kabiyaheMapsLoader");
    expect(mapSource).toContain("if (window.google?.maps) return Promise.resolve();");
    expect(mapSource).toContain("if (window.__kabiyaheMapsLoader) return window.__kabiyaheMapsLoader;");
    expect(mapSource).toContain("if (map.current) return;");
  });

  it("uses the Google Maps SDK for directions and map state", () => {
    expect(source).toContain("<MapView");
    expect(source).toContain("new google.maps.DirectionsService()");
    expect(source).toContain("new google.maps.DirectionsRenderer");
    expect(source).toContain('setMapType("satellite")');
    expect(source).toContain("/explore/${point.slug}");
  });
});
