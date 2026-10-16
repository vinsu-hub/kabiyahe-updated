import { conceptImages } from "@/lib/conceptImages";

type ListingImage = { slug?: string | null; category?: string | null; hero_image?: string | null };

const DELICACY_IMAGES: Record<string, string> = {
  "letys-buko-pie": conceptImages.foodBukoPie.src,
  "mer-nels-cake": conceptImages.foodLayeredCake.src,
  "dtri-dairy-products": conceptImages.foodDairyProducts.src,
  "los-banos-public-market-stalls": conceptImages.foodMarketSpread.src,
  "irri-riceworld-coffee-shop": conceptImages.foodRiceworldCoffee.src,
  "bens-halo-halo-ice-cream": conceptImages.foodHaloHalo.src,
  "cafe-lucca": conceptImages.foodCafePastry.src,
  "coffee-project-lb": conceptImages.foodIcedCoffee.src,
  "michas-bakeshop": conceptImages.foodBakeshopBread.src,
  "wildbreads": conceptImages.foodSourdough.src,
  "satya-graha-cafe": conceptImages.foodVegetarianBowl.src,
  "faustinas": conceptImages.foodLunchSpread.src,
  "bonitos-bar-restaurant": conceptImages.foodPulutan.src,
  "nham-cha-thai-milk-tea": conceptImages.foodMilkTea.src,
};

function uploadedImage(listing: ListingImage): string | undefined {
  const image = listing.hero_image?.trim();
  return image && !image.startsWith("/scenes/") ? image : undefined;
}

/** Uploaded photo, then the specialty for this listing, then a category photo. */
export function delicacyImage(d: ListingImage): string {
  const own = uploadedImage(d);
  if (own) return own;
  if (d.slug && DELICACY_IMAGES[d.slug]) return DELICACY_IMAGES[d.slug];
  const category = d.category?.toLowerCase() ?? "";
  if (/baked|bread|pastry/.test(category)) return conceptImages.foodBakeshopBread.src;
  if (/cafe|café|coffee/.test(category)) return conceptImages.stayEatCozyCafe.src;
  if (/dessert|dairy/.test(category)) return conceptImages.foodHaloHalo.src;
  if (/drink|tea/.test(category)) return conceptImages.foodMilkTea.src;
  if (/market/.test(category)) return conceptImages.foodMarketSpread.src;
  if (/street/.test(category)) return conceptImages.foodIsaw.src;
  return conceptImages.stayEatRestaurantInterior.src;
}

/** Uploaded photo or a category-appropriate stay/dining interior. */
export function accommodationImage(a: ListingImage): string {
  const own = uploadedImage(a);
  if (own) return own;
  const category = a.category?.toLowerCase() ?? "";
  if (/restaurant|dining/.test(category)) return conceptImages.stayEatRestaurantInterior.src;
  if (/cafe|café|coffee/.test(category)) return conceptImages.stayEatCozyCafe.src;
  if (/homestay|airbnb|home|apartment/.test(category)) return conceptImages.stayEatAirbnbLivingRoom.src;
  return conceptImages.stayEatGuestRoom.src;
}
