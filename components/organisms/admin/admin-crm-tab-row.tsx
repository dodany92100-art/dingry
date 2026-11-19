import type { ReactNode } from "react";
import { TabNav, type TabId } from "@/components/organisms/admin/tab-nav";

type AdminCrmTabRowProps = {
  tab: TabId;
  onChange: (tab: TabId) => void;
  /** Actions Stock (aperçu, grille) — affichées à droite sur md+. */
  trailing?: ReactNode;
  /** Masque la pilule des onglets Stock/Brouillons (remplacés par le sélecteur compact). */
  hideStockTabsOnNarrow?: boolean;
};

export function AdminCrmTabRow({
  tab,
  onChange,
  trailing,
  hideStockTabsOnNarrow = false,
}: AdminCrmTabRowProps) {
  return (
    <div className="mb-2 flex min-w-0 w-full flex-col items-center gap-2 md:mb-3">
      <div className="relative w-full min-w-0 max-w-full md:w-auto">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-5 bg-gradient-to-r from-black to-transparent md:hidden"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-5 bg-gradient-to-l from-black to-transparent md:hidden"
          aria-hidden
        />
        <TabNav
          tab={tab}
          onChange={onChange}
          hideStockTabsOnNarrow={hideStockTabsOnNarrow}
        />
      </div>
      {trailing ? (
        <div className="flex w-full max-w-full shrink-0 items-center justify-center gap-2.5 md:w-auto md:justify-end">
          {trailing}
        </div>
      ) : null}
    </div>
  );
}
