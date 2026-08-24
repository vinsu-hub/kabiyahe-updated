# Laguna Explore Research Notes

Prepared for the Explore catalog expansion.

## Verified sources

1. Klook Laguna destination guide: https://www.klook.com/en-SG/destination/c31398-laguna/
   - Describes Laguna as a province south of Manila known for hot springs, waterfalls, and artistic heritage.
   - Mentions Paete for woodcarving, Mount Makiling for hiking/panoramic views, Calamba as Jose Rizal’s birthplace, and local delicacies such as buko pie and espasol.
   - Lists Enchanted Kingdom (Santa Rosa), Mountain Lake Resort and Caliraya (Lumban), Splash Island (Biñan), and Splash Mountain Resort (Los Baños) as Laguna activities.
   - Ratings and booking counts from this commercial source are not copied into Kabiyahe; no fabricated ratings or reviews are added.

2. Philippine Information Agency, “History sought behind Laguna’s tourist destinations”: https://pia.gov.ph/news/luzon/calabarzon/history-sought-behind-lagunas-tourist-destinations/
   - Government news source describing Laguna’s heritage-based tourism initiative and the importance of preserving and explaining each town’s historical stories.
   - Supports presenting heritage and cultural destinations with contextual descriptions rather than social-proof claims.

3. Laguna Lake Development Authority, “Seven (7) Crater Lakes”: https://llda.gov.ph/seven-7-crater-lakes/
   - Identifies San Pablo City’s Seven Crater Lakes: Bunot, Calibato, Mohicap, Palakpakin, Pandin, Sampaloc, and Yambo.
   - Explains their crater-lake formation and identifies Sampaloc as the largest and a prime tourist spot.
   - Identifies Pandin and Yambo as the Twin Lakes and describes their clear, deep-lake character.

## Candidate Explore additions

- Rizal Shrine / Bahay ni Rizal — Calamba; Culture / Heritage. Use only the supported claim that Calamba is Jose Rizal’s birthplace and identify the shrine as a heritage stop; avoid opening hours unless separately verified.
- Seven Crater Lakes — San Pablo City; Nature / Lakes. Use a collection-style destination record with the seven verified lake names and a note that Sampaloc is the largest; avoid ratings, reviews, or unsupported activity promises.
- Mount Makiling — Los Baños / Calamba area; Nature / Outdoors. Use a concise hiking and landscape description based on the Klook guide; avoid precise trail or access claims without a local official source.
- Paete woodcarving heritage — Paete; Culture / Arts. Represent as a town/heritage experience rather than a specific business; Klook supports Paete’s association with intricate woodcarvings.
- Enchanted Kingdom — Santa Rosa; Family / Attractions. Include as a clearly labeled attraction, without importing commercial ratings or booking counts.
- Caliraya Lake — Lumban; Nature / Lakes. Existing catalog already includes it; enrich only with verified lake/day-access framing.

## Content policy decisions

Danielitos Home Kitchen and Malayas Cafe are requested placeholder restaurant listings. They must be labeled “Placeholder listing” or “Preview listing,” must not include invented ratings, reviews, addresses, phone numbers, menus, hours, or booking claims, and should use a truthful unavailable-contact state until verified details are provided.

New destination cards should distinguish curated/verified place facts from unverified or placeholder information. No customer reviews, ratings, testimonials, clone counts, or fabricated contact details will be created.

## Implementation verification

The `/explore/seven-crater-lakes` deep link now resolves to Seven Crater Lakes rather than the default Pagsanjan Falls record. The detail view shows a Research-backed label, the San Pablo City location, three gallery thumbnails, and no rating or review count. The route parameter fix also applies to restaurant and other attraction slugs.
