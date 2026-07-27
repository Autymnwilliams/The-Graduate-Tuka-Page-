/**
 * Alternate words guests might type that don't literally appear in a rec's
 * category/name/tags — e.g. typing "cafe" should still surface "coffee" recs.
 */
const CATEGORY_SYNONYMS: Record<string, string[]> = {
  dining: ["food", "restaurant", "restaurants", "eat", "eats", "lunch", "dinner", "brunch"],
  coffee: ["cafe", "café", "coffee shop", "espresso", "latte", "roastery"],
  nightlife: ["bar", "bars", "drinks", "pub", "club", "cocktail", "cocktails"],
  "hidden-gems": ["gem", "gems", "hidden gem", "local favorite"],
  "family-friendly": ["kids", "family", "children", "kid-friendly"],
  shopping: ["shop", "shops", "store", "stores", "retail"],
  outdoors: ["park", "parks", "beach", "nature", "walk", "walking", "outdoor", "arboretum", "trail", "lakefront"],
  culture: ["museum", "art", "music", "live music", "gallery", "arts"],
};

export function matchesCategorySynonym(category: string, query: string): boolean {
  const synonyms = CATEGORY_SYNONYMS[category];
  if (!synonyms) return false;
  return synonyms.some((synonym) => synonym.includes(query) || query.includes(synonym));
}
