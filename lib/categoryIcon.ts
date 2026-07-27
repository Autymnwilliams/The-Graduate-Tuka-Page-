const CATEGORY_ICONS: Record<string, string> = {
  dining: "🍽️",
  coffee: "☕",
  nightlife: "🍸",
  "hidden-gems": "💎",
  "family-friendly": "👪",
  shopping: "🛍️",
  outdoors: "🌳",
  culture: "🎭",
};

export function categoryIcon(category: string): string {
  return CATEGORY_ICONS[category] ?? "📍";
}

export function categoryLabel(category: string): string {
  return category
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
