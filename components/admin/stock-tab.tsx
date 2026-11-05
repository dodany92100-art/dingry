"use client";

import { LOW_STOCK_THRESHOLD } from "@/lib/admin/order-view";
import type { AdminProduct } from "@/lib/admin/types";

type StockTabProps = {
  products: AdminProduct[];
  busyProductId: string | null;
  error: string;
  onChangeStock: (product: AdminProduct, delta: number) => void;
  onEdit: (product: AdminProduct) => void;
  onNew: () => void;
};

export function StockTab({ products, busyProductId, error, onChangeStock, onEdit, onNew }: StockTabProps) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-white/40">Stock</p>
          <p className="mt-1 max-w-md text-[10px] leading-relaxed tracking-[0.08em] text-white/30">
            Une quantité par fiche produit, partagée entre toutes les tailles.
          </p>
        </div>
        <button
          type="button"
          onClick={onNew}
          className="h-9 border border-white/15 px-3 text-[11px] uppercase tracking-[0.18em] text-white/70 hover:text-white"
        >
          Nouveau
        </button>
      </div>
      {error ? <p className="mb-3 text-sm text-red-400">{error}</p> : null}
      <div className="dingry-admin-stock border border-white/10">
        {products.length === 0 ? (
          <p className="px-4 py-10 text-sm text-white/40">Aucun produit.</p>
        ) : (
          products.map((product) => (
            <div
              key={product.id}
              className="flex items-center gap-3 border-b border-white/[0.06] px-3 py-3 last:border-b-0 md:gap-4 md:px-4"
            >
              <img
                src={product.imageUrl}
                alt=""
                className="h-16 w-12 shrink-0 object-cover"
                loading="lazy"
                decoding="async"
              />

              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-normal uppercase tracking-[0.28em] text-white">
                  {product.name}
                </p>
                {product.variant ? (
                  <p className="mt-1 truncate text-[10px] font-normal uppercase tracking-[0.22em] text-white">
                    {product.variant}
                  </p>
                ) : null}
                {product.sizes.length > 0 || product.price > 0 ? (
                  <p className="mt-1.5 text-[10px] font-normal uppercase tracking-[0.2em] text-white">
                    {[product.sizes.length > 0 ? product.sizes.join(" · ") : null, `${product.price} €`]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                ) : null}
              </div>

              <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
                <button
                  type="button"
                  disabled={busyProductId === product.id || product.stock === 0}
                  onClick={() => onChangeStock(product, -1)}
                  className="h-8 w-8 border border-white/15 text-white/70 hover:text-white disabled:opacity-30"
                  aria-label={`Retirer un ${product.name}`}
                >
                  −
                </button>
                <span
                  className={`min-w-[2rem] text-center text-sm tabular-nums text-white ${
                    product.stock <= LOW_STOCK_THRESHOLD ? "text-[#7EB3FF]" : ""
                  }`}
                >
                  {product.stock}
                </span>
                <button
                  type="button"
                  disabled={busyProductId === product.id}
                  onClick={() => onChangeStock(product, 1)}
                  className="h-8 w-8 border border-white/15 text-white/70 hover:text-white disabled:opacity-30"
                  aria-label={`Ajouter un ${product.name}`}
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={() => onEdit(product)}
                className="shrink-0 text-[11px] uppercase tracking-[0.18em] text-white/55 hover:text-white"
              >
                Modifier
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
