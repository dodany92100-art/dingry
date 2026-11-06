"use client";

import { LOOKBOOK_ENTRIES } from "@/lib/shop-data";

export function LookbookSection() {
  return (
    <section id="lookbook" className="dingry-below-hero-surface border-t border-white/[0.05] px-6 py-12 md:px-12 md:py-16">
      <p className="mb-8 text-[10px] font-semibold tracking-[0.35em] text-[#0066FF] uppercase">Lookbook</p>
      <div className="grid gap-4 md:grid-cols-3">
        {LOOKBOOK_ENTRIES.map(([src, title, caption]) => (
          <figure key={title} className="overflow-hidden">
            <img src={src} alt={title} loading="lazy" decoding="async" className="aspect-[3/4] w-full object-cover" />
            <figcaption className="mt-3">
              <p className="text-sm uppercase tracking-wide">{title}</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-white/45">{caption}</p>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
