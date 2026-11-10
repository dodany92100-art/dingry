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
    <div className="mb-3 flex min-w-0 flex-col gap-2 md:mb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <TabNav
        tab={tab}
        onChange={onChange}
        hideStockTabsOnNarrow={hideStockTabsOnNarrow}
        className="mb-0 min-w-0 flex-1"
      />
      {trailing ? (
        <div className="flex shrink-0 items-center justify-center gap-2.5 max-[449px]:w-full sm:justify-end">
          {trailing}
        </div>
      ) : null}
    </div>
  );
}
