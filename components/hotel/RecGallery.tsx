"use client";

import { useRef, useState } from "react";
import { categoryIcon } from "@/lib/categoryIcon";

export function RecGallery({
  photoUrls,
  alt,
  category,
  className,
}: {
  photoUrls: string[];
  alt: string;
  category: string;
  className?: string;
}) {
  const [erroredIndexes, setErroredIndexes] = useState<Set<number>>(new Set());
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const allErrored = photoUrls.length > 0 && erroredIndexes.size === photoUrls.length;

  if (photoUrls.length === 0 || allErrored) {
    return (
      <div className={`flex items-center justify-center bg-zinc-100 text-3xl ${className ?? ""}`} aria-hidden>
        {categoryIcon(category)}
      </div>
    );
  }

  function handleScroll() {
    const el = scrollerRef.current;
    if (!el) return;
    setActiveIndex(Math.round(el.scrollLeft / el.clientWidth));
  }

  return (
    <div className={`relative overflow-hidden ${className ?? ""}`}>
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="no-scrollbar flex h-full snap-x snap-mandatory overflow-x-auto"
        style={{ scrollbarWidth: "none" }}
      >
        {photoUrls.map((src, i) =>
          erroredIndexes.has(i) ? (
            <div
              key={src}
              className="flex h-full w-full shrink-0 snap-center items-center justify-center bg-zinc-100 text-3xl"
              aria-hidden
            >
              {categoryIcon(category)}
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- per-hotel asset path, not a static import
            <img
              key={src}
              src={src}
              alt={`${alt} photo ${i + 1}`}
              className="h-full w-full shrink-0 snap-center object-cover"
              onError={() => setErroredIndexes((prev) => new Set(prev).add(i))}
            />
          ),
        )}
      </div>

      {photoUrls.length > 1 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
          {photoUrls.map((src, i) => (
            <span
              key={src}
              className={`h-1.5 w-1.5 rounded-full ${i === activeIndex ? "bg-white" : "bg-white/50"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
