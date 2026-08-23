# Kabiyahe Visual Blueprint

## Ground-truth reference
The supplied Kabiyahe screenshots are the visual source of truth. The recreation should preserve their light warm-cream canvas, forest-green hierarchy, editorial serif display type, illustrated Filipino travel identity, rounded cards, scenic photography, and desktop-to-mobile adaptation. The referenced views are: home, explore map/list, destination detail, bundle detail, plan-your-adventure form, my trips dashboard, and the trip itinerary detail view.

## Chosen direction

### Theme Name: Laguna Field Journal
### Very Brief Intro
A warm, editorial travel-planning interface that combines the calm of a field journal with the practicality of a modern trip companion. It should feel local, trustworthy, handcrafted, and useful on an actual travel day.
### Probability: 0.07

### Design Movement
Contemporary editorial design with Filipino travel-poster cues, botanical illustration, and soft skeuomorphic paper surfaces.

### Core Principles
1. **Discoverable, not dense:** hierarchy comes from generous spacing, image-led cards, and clear section labels.
2. **Warmly local:** the palette and illustrations evoke Laguna’s water, rainforest, mountains, and vernacular travel symbols.
3. **Practical by default:** every interaction communicates its purpose, state, and whether it leaves Kabiyahe.
4. **Quietly premium:** restrained shadows, thin warm borders, textured cream surfaces, and deliberate typography replace generic app chrome.

### Color Philosophy
Warm cream is the environmental base, creating the feeling of paper, sunlight, and a calm planning table. Forest green is the dependable anchor for navigation and primary actions. Sage and teal express nature and water, while golden ochre marks discovery, active states, and moments of delight. Brown is reserved for cultural and earthy accents. Functional states remain muted so they do not compete with the destination imagery.

### Layout Paradigm
Use asymmetric editorial compositions rather than a centered marketing grid. Desktop views pair a broad working canvas with a narrow utility rail; exploration pairs a list column with a map field; detail views use immersive image headers and structured information bands. On mobile, the utility rail becomes stacked cards, horizontal rails become scrollable, and primary navigation becomes a fixed bottom tab bar.

### Signature Elements
- A cream paper canvas with soft map-line and botanical motifs at section edges.
- Forest-green pill labels, compact icon buttons, and ochre accent rules with small sparkle/star details.
- Scenic image cards with consistent 12–16px radii, subtle warm borders, and editorial metadata rows.

### Interaction Philosophy
Interactions should feel like arranging a travel notebook: direct, forgiving, and visibly stateful. Buttons use concise verbs. Saved, selected, active, booked, and external-link states are always explicit. On mobile, actions remain thumb-reachable and important trip-day controls stay visible without forcing a desktop layout into a narrow screen.

### Animation
Use short 160–240ms ease-out transitions for buttons, tabs, chips, drawers, and cards. Use small translate-and-fade entrances for content sections, staggered lightly. Map/list changes crossfade rather than reflow abruptly. Respect reduced-motion preferences. Never animate layout dimensions when opacity and transform can communicate the same state.

### Typography System
Display headings use **DM Serif Display** or a comparable editorial serif with compact line-height. Interface text uses **Manrope** or a comparable humanist sans; avoid Inter. Headings are forest green and sentence case. Supporting copy is near-black charcoal with relaxed line-height. Labels and metadata are small, medium-weight, and never lighter than the warm-gray contrast threshold.

### Brand Essence
A modern Filipino travel companion for Laguna explorers who want to discover, plan together, and keep every booking reference in one place. Personality: **warm, curious, dependable**.

### Brand Voice
Headlines are confident and inviting without sounding like generic tourism copy. CTAs are active and specific. Microcopy is reassuring, transparent, and locally grounded.

Example lines:
- “Discover places. Create memories. Tara na!”
- “Your whole Laguna adventure, in one calm place.”

### Wordmark & Logo
Use the provided Kabiyahe mark direction: a bold circular travel emblem combining a stylized K, mountain/leaf forms, and a small ochre location pin, paired with a custom serif wordmark. The mark should appear visibly in the desktop header and as a compact emblem in mobile navigation.

### Signature Brand Color
**Kabiyahe Forest — #1E3D2B.** It is ownable because it carries the product’s sense of grounded local discovery and is used consistently across navigation, active tabs, primary CTAs, and itinerary timeline anchors.

## View-by-view implementation blueprint

| View | Desktop structure | Responsive behavior | Key controls |
|---|---|---|---|
| Home | Floating rounded header over a scenic hero, featured destination cards, map preview, bundle rail, three-step explainer | Header compresses; hero stacks; rails become horizontal scroll; bottom nav appears | Plan My Trip, Explore Laguna, View all, View Trip |
| Explore | Left filter rail, destination list column, large map field with category legend and pins | Filters become a drawer; map/list/grid becomes segmented control; cards stack | Search, Filters, Map/List/Grid, Save |
| Destination detail | Immersive waterfall hero, tag row, rating, gallery strip, about/details, right-side location/booking/trip actions | Hero becomes shorter; side rail stacks under details; actions become sticky bottom sheet or full-width buttons | Back, Save, Share, View on Map, Book/Reserve, Add to Trip |
| Bundles | Editorial bundle grid with filters and cover imagery | Two-column grid collapses to one column; filters scroll horizontally | Browse filters, View Trip, Clone |
| Bundle detail | Large cover hero, bundle overview rail, day-by-day timeline cards | Overview stacks; timeline becomes vertically scrollable day sections | Clone This Itinerary, Clone and Customize |
| Plan a Trip | Left illustrated form, stepper, trip summary rail | Summary moves below form; field groups stack; bottom CTA remains accessible | Back, interest toggles, date controls, Next: Review & Generate |
| My Trips | Tabs, trip cards with cover images and progress, summary/actions rail | Trip cards become stacked; quick actions become a compact accordion | New Trip, View Itinerary, Bookings, Invite, Continue Planning |
| Trip itinerary | Header with share/edit, tab bar, day timeline, stop rows, overview/action/helpful rail | Timeline rows become stacked cards; right rail moves below; tabs remain horizontally scrollable | Add Stop, Navigate, Booking, Optimize Route, Add New Day |

## Data and interaction scope for this first build
The first delivery should prioritize a polished, responsive front-end prototype with realistic Laguna content, working client-side routing, active tabs, filters, view toggles, save/clone/add-to-trip affordances, and the itinerary screen as the primary detailed flow. External bookings should be clearly labeled as leaving the app. Real authentication, persistence, and AI generation are not assumed unless separately enabled.
