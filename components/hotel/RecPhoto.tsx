"use client";

import { useState } from "react";
import { categoryIcon } from "@/lib/categoryIcon";

export function RecPhoto({
  src,
  alt,
  category,
  className,
}: {
  src?: string;
  alt: string;
  category: string;
  className?: string;
}) {
  const [errored, setErrored] = useState(false);

  if (!src || errored) {
    return (
      <div className={`flex items-center justify-center bg-zinc-100 text-3xl ${className ?? ""}`} aria-hidden>
        {categoryIcon(category)}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- per-hotel asset path, not a static import
    <img src={src} alt={alt} className={className} onError={() => setErrored(true)} />
  );
}
