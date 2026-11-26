"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import type { BrandPageConfig } from "@/lib/shop-brand-page-config";
import { shopBrandCatalogQuery } from "@/lib/shop-brand-page-slug";
import { shopBasePathFromPathname, shopHref, type ShopBasePath } from "@/lib/shop-base-path";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/hooks/use-translation";
import styles from "./brand-page-editorial.module.css";

type BrandPageEditorialProps = {
  config: BrandPageConfig;
};

function brandPageCopy(
  dict: Record<string, unknown>,
  slug: string,
): { title: string; lead: string; madaTitle?: string; madaLead?: string } {
  const pages = dict.brandPages as Record<string, Record<string, string>> | undefined;
  const entry = pages?.[slug];
  const fallbackTitle = slug;
  return {
    title: entry?.title ?? fallbackTitle,
    lead: entry?.lead ?? "",
    madaTitle: entry?.madaTitle,
    madaLead: entry?.madaLead,
  };
}

export function BrandPageEditorial({ config }: BrandPageEditorialProps) {
  const pathname = usePathname() ?? "/";
  const shopBasePath = shopBasePathFromPathname(pathname);
  const { dict, t } = useTranslation();
  const copy = brandPageCopy(dict as Record<string, unknown>, config.i18nKey);

  const shopHome = shopHref(shopBasePath, "/");
  const filteredShop = `${shopHome}${shopBrandCatalogQuery(config.brand)}`;

  return (
    <article
      className={styles.page}
      style={{ "--brand-accent": config.accentHex } as CSSProperties}
    >
      <header className={styles.hero}>
        <div className={styles.heroVisual}>
          {/* eslint-disable-next-line @next/next/no-img-element -- URLs R2 hétérogènes */}
          <img src={config.heroSrc} alt="" className={styles.heroImg} fetchPriority="high" />
          <div className={styles.heroVeil} aria-hidden />
          <div className={styles.heroBody}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={config.logoSrc} alt="" className={styles.logo} />
            <p className={styles.eyebrow}>{t("brandPages.eyebrow")}</p>
            <h1 className={styles.title}>{copy.title}</h1>
            <p className={styles.lead}>{copy.lead}</p>
            <BackToShopLinks shopBasePath={shopBasePath} filteredShop={filteredShop} />
          </div>
        </div>
      </header>
      {config.madaSection && copy.madaTitle ? (
        <section className="px-4 py-6 md:px-8" aria-labelledby="brand-mada-heading">
          <h2 id="brand-mada-heading" className={styles.sectionTitle}>
            {copy.madaTitle}
          </h2>
          {copy.madaLead ? <p className={`${styles.lead} mb-2 max-w-2xl`}>{copy.madaLead}</p> : null}
        </section>
      ) : null}
    </article>
  );
}

function BackToShopLinks({
  shopBasePath,
  filteredShop,
}: {
  shopBasePath: ShopBasePath;
  filteredShop: string;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Link href={shopHref(shopBasePath, "/")} className={styles.backLink}>
        {t("brandPages.backToShop")}
      </Link>
      <Link href={filteredShop} className={styles.backLink}>
        {t("brandPages.backToFilteredShop")}
      </Link>
    </div>
  );
}
