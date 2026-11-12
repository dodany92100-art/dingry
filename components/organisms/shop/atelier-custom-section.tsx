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
    <section className="dingry-gold-rule-top scroll-mt-28 py-8 my-6 md:py-10 md:my-8">
      <div className="mb-4 md:mb-5">
        <DingryLogo animate={false} tone="on-light" className="mb-3 h-8 w-auto md:h-9" />
        <p className="dingry-section-eyebrow">Atelier custom</p>
        <h2 className="dingry-typo-street dingry-typo-street--md mt-1.5 leading-tight">
          T-shirt personnalisé
        </h2>
      </div>
      <CustomConfiguratorBanner content={persoBanner} onOpenCustom={onOpenCustom} />
    </section>
  );
}
