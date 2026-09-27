import { conceptImages } from "@/lib/conceptImages";

type EventLike = { slug?: string | null; title?: string | null; category?: string | null; hero_image?: string | null };

// First match wins; ordered from most to least specific subject.
const RULES: [RegExp, string][] = [
  [/heritage[- ]walk|walking tour/, conceptImages.toursHeritageChurch.src],
  [/raid|commemoration|baker hall|memorial/, conceptImages.exploreBakerHall.src],
  [/holiday|christmas|enchanted|parol/, conceptImages.eventsStreetFestivalHero.src],
  [/basket|tournament/, conceptImages.eventsBasketballFinals.src],
  [/trail|makiling|hike|run/, conceptImages.eventsMakilingTrailRun.src],
  [/choir|concert/, conceptImages.eventsUplbChoir.src],
  [/music|likha|band/, conceptImages.eventsLiveMusicStage.src],
  [/food|market|bazaar/, conceptImages.eventsFoodFestival.src],
  [/flower|garden/, conceptImages.exploreJapaneseGarden.src],
  [/science|syensaya|research/, conceptImages.toursScienceCampus.src],
  [/uplb|loyalty|feb fair|campus/, conceptImages.exploreUplbLandmark.src],
  [/sunset|park/, conceptImages.exploreFreedomPark.src],
  [/festival|bañamos|banamos|fiesta/, conceptImages.eventsCulturalDance.src],
];

/** Real uploaded photo when there is one; otherwise the concept photo that best matches the event. */
export function eventImage(e: EventLike): string {
  const own = e.hero_image ?? "";
  if (own && !own.startsWith("/scenes/")) return own;
  const s = `${e.slug ?? ""} ${e.title ?? ""} ${e.category ?? ""}`.toLowerCase();
  for (const [re, src] of RULES) if (re.test(s)) return src;
  return e.category === "Sports" ? conceptImages.eventsBasketballFinals.src : conceptImages.eventsStreetFestivalHero.src;
}
