export function ShopLoadingFallback() {
  return (
    <div
      className="flex min-h-dvh items-center justify-center bg-black text-[10px] tracking-[0.35em] text-white/45 uppercase"
      aria-live="polite"
    >
      Chargement…
    </div>
  );
}
