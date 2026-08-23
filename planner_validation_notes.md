# Planner validation notes

The desktop `/plan/new` capture shows Step 1 with only Travel Dates, Group Size, and Budget in the main form. Preferences are no longer visible, the stepper labels match the screen, and the trip summary remains in the secondary rail.

The 390px mobile capture shows the planner form before the summary card, with the three-step indicator, stacked detail controls, and thumb-reachable bottom action row. The summary follows the form instead of interrupting the primary input flow.

The remaining validation focus is source-level confirmation of Step 2 and Step 3 because the current screenshot harness captures initial routes without interaction. The implementation includes Step 2 preferences-only content, Step 3 full-width review content, per-section edit controls, rotating loading messages, and the existing generated-result route.

The interactive Playwright smoke test successfully advanced desktop Step 1 to Step 2 and Step 3 with no console errors. Desktop Step 2 visibly contains only interest tags and optional notes, while the summary rail remains secondary. Desktop Step 3 uses a full-width review card with the trip image, ready state, edit buttons for dates/travelers/budget/interests/notes, the verified-destination disclaimer, and the Generate My Itinerary action.

The interactive Playwright smoke test also advanced the 390px mobile viewport through Step 2 and Step 3 with no console errors. Step 2 shows the interest grid, optional notes, and navigation actions without horizontal overflow; the summary follows the form. Step 3 stacks the full-width trip summary, per-section edit controls, trust disclaimer, and Generate My Itinerary action above the persistent bottom navigation. The generation trigger was intentionally not submitted because the route requires an authenticated session and live model availability.

The final hardening pass added owner-scoped persistent remove, reorder, and verified-catalog add-stop mutations, rollback of optimistic remove/reorder UI state on save errors, auto-save status feedback, drag and keyboard move controls, and 18 passing tests. The current database contains one generated trip but zero generatedTripStops rows, so true cross-trip persisted-stop conflicts and duplicate-stop insertion cannot be exercised without creating durable test data; those two cases remain explicitly blocked rather than fabricated.
