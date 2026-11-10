"use client";

import { DingryLogo } from "@/components/atoms/dingry-logo";
import {
  CustomConfiguratorBanner,
  type OpenCustomOptions,
} from "@/components/molecules/custom-configurator-banner";
import type { ShopCatalogPersoBanner } from "@/lib/admin/types";

type AtelierCustomSectionProps = {
  onOpenCustom: (options?: OpenCustomOptions) => void;
  persoBanner: ShopCatalogPersoBanner;
};

export function AtelierCustomSection({
  onOpenCustom,
  persoBanner,
}: AtelierCustomSectionProps) {
  return (
    <section className="dingry-gold-rule-top scroll-mt-28 pb-12 pt-10 md:pb-16 md:pt-14">
      <div className="mb-5 flex flex-col gap-4 md:mb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <DingryLogo animate={false} tone="on-light" className="mb-4 h-9 w-auto md:h-11" />
          <p className="dingry-section-eyebrow">Atelier custom</p>
          <h2 className="dingry-sticky-editorial-title mt-2 text-2xl uppercase leading-tight md:text-3xl">
            T-shirt personnalisé
          </h2>
        </div>
      </div>
      <CustomConfiguratorBanner content={persoBanner} onOpenCustom={onOpenCustom} />
    </section>
  );
}
