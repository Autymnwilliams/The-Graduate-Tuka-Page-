import type { Rec } from "@/lib/types";

export interface MapSectionProps {
  recs: Rec[];
  selectedRecId: string | null;
  onSelectRec: (id: string) => void;
}

/** Placeholder — replaced with Mapbox GL in the next build step. */
export function MapSection({ recs, selectedRecId, onSelectRec }: MapSectionProps) {
  return (
    <div className="h-64 w-full border-b border-zinc-200 bg-zinc-100 sm:h-80 md:h-96 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Map coming up — {recs.length} pin{recs.length === 1 ? "" : "s"}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {recs.map((rec) => (
            <button
              key={rec.id}
              type="button"
              onClick={() => onSelectRec(rec.id)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                selectedRecId === rec.id
                  ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-[var(--brand-secondary)]"
                  : "border-zinc-300 bg-white text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400"
              }`}
            >
              {rec.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
