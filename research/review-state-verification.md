# Review-state verification

At 390px mobile, Explore continues to show verified ratings only where catalog data exists. The destination cards remain readable, and no fabricated review text appears on rated records. The bundle itinerary’s Bundle snapshot now includes a compact bordered “Reviews coming soon” notice with explanatory copy that traveler feedback will appear after verified trips. It remains visible without colliding with the clone action or fixed navigation.

The review-state implementation is truthful: unrated Explore destinations use “Reviews coming soon,” bundle cards use the same availability label, and bundle detail provides the fuller explanation. The updated suite passes with 53 tests, TypeScript passes, and the production build passes.
