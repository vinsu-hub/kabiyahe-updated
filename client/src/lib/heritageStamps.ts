import { conceptImages } from "./conceptImages";

/** Accent, punctuation and spacing tolerant names from the heritage catalogue. */
export function normalizeHeritageName(name: string) {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

const stamps = new Map<string, { readonly src: string; readonly alt: string; readonly width: number; readonly height: number }>([
  [normalizeHeritageName("Immaculate Conception Parish"), conceptImages.heritageParish],
  [normalizeHeritageName("Ruins of Agua Santa Resort"), conceptImages.heritageAguaSanta],
  [normalizeHeritageName("Statue of Padre Pedro Bautista"), conceptImages.heritagePadreBautista],
  [normalizeHeritageName("UPLB Foundation Site"), conceptImages.heritageUplbFoundation],
  [normalizeHeritageName("New Los Ba\u00f1os Municipal Hall"), conceptImages.heritageNewMunicipalHall],
  [normalizeHeritageName("Ruins of the First Los Ba\u00f1os Municipal Hall"), conceptImages.heritageFirstMunicipalHall],
  [normalizeHeritageName("Old Municipal Hall"), conceptImages.heritageOldMunicipalHall],
  [normalizeHeritageName("Old Houses along Villegas Street"), conceptImages.heritageVillegasHouses],
  [normalizeHeritageName("Old Los Ba\u00f1os Train Station (Bambang Station)"), conceptImages.heritageBambangStation],
  [normalizeHeritageName("Poblacion Public Market"), conceptImages.heritagePublicMarket],
  [normalizeHeritageName("Gen. Paciano Rizal Shrine"), conceptImages.heritagePacianoRizal],
  [normalizeHeritageName("Baker Hall"), conceptImages.heritageBakerHall],
  [normalizeHeritageName("Gen. Yamashita / Gen. Homma Shrine"), conceptImages.heritageWartimeShrine],
  [normalizeHeritageName("Los Ba\u00f1os Raid Commemoration Site"), conceptImages.heritageRaidMemorial],
  [normalizeHeritageName("Old Pantalan"), conceptImages.heritageOldPantalan],
  [normalizeHeritageName("Los Ba\u00f1os Museum"), conceptImages.heritageMuseum],
  [normalizeHeritageName("Caesar Perez Memorial Therapeutic Massage Center & Health Spa"), conceptImages.heritageHealthSpa],
]);

export function heritageStampFor(name: string) {
  return stamps.get(normalizeHeritageName(name)) ?? conceptImages.heritageGeneric;
}
