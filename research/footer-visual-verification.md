# Footer visual verification

At 390px mobile, the footer appears after the landing-page sections with a compact two-column link layout, a full-width partner group, and extra bottom padding so the fixed five-item navigation does not cover the footer’s legal line. The brand mark and tagline remain readable without horizontal overflow.

At 1280px desktop, the footer uses a two-part editorial layout: brand context on the left and three navigation groups on the right, followed by a full-width copyright row. The forest-green surface and ochre headings remain consistent with the Kabiyahe design system. Footer routes point to existing Explore, Bundles, Guides, Plan, Trips, Saved, Partner Portal, and Join Kabiyahe pages.

The full regression suite passes with 53 tests, TypeScript passes, and the production build passes. Existing build advisories remain limited to the runtime `/manus-storage` reference and client bundle size.
