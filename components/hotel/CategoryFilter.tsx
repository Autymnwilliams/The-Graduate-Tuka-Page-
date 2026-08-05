"use client";

import { categoryIcon, categoryLabel } from "@/lib/categoryIcon";

export function CategoryFilter({
  categories,
  selected,
  onSelect,
}: {
  categories: string[];
  selected: string | null;
  onSelect: (category: string | null) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
          selected === null
            ? "border-[var(--tuka-ink)] bg-[var(--tuka-ink)] text-white"
            : "border-zinc-200 bg-white/95 text-zinc-700"
        }`}
      >
        All
      </button>
      {categories.map((category) => (
        <button
          key={category}
          type="button"
          onClick={() => onSelect(category === selected ? null : category)}
          className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
            selected === category
              ? "border-[var(--tuka-ink)] bg-[var(--tuka-ink)] text-white"
              : "border-zinc-200 bg-white/95 text-zinc-700"
          }`}
        >
          {categoryIcon(category)} {categoryLabel(category)}
        </button>
      ))}
    </div>
  );
}
