"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { shopBasePathFromPathname, shopHref } from "@/lib/shop-base-path";
import {
  heritageArticlesForLocale,
  heritageReaderTabsFromBundle,
} from "@/lib/i18n/heritage-articles-locale";
import { useTranslation } from "@/hooks/use-translation";
import { HeritageArticleCard } from "@/components/organisms/shop/heritage-editorial-parts";
import styles from "./heritage-editorial.module.css";

export function HeritageEditorial() {
  const pathname = usePathname() ?? "/";
  const shopHomeHref = shopHref(shopBasePathFromPathname(pathname), "/");
  const { dict, t } = useTranslation();
  const heritage = dict.heritage;
  const tabs = useMemo(() => heritageReaderTabsFromBundle(heritage), [heritage]);
  const articles = useMemo(() => heritageArticlesForLocale(heritage), [heritage]);
  const visualPlaceholder = t("heritageReader.visualPlaceholder");

  const labelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const tab of tabs) {
      map.set(tab.id, tab.label);
    }
    return map;
  }, [tabs]);

  return (
    <div className={`${styles.page} dingry-heritage-editorial`}>
      <header className={styles.hero}>
        <p className={styles.heroEyebrow}>{t("heritageTeaser.eyebrow")}</p>
        <h1 className={styles.heroTitle}>{heritage.baseline}</h1>
        <p className={styles.heroLead}>{heritage.homepageHook}</p>
      </header>

      <div className={styles.stream}>
        {articles.map((article) => (
          <HeritageArticleCard
            key={article.id}
            article={article}
            visualPlaceholder={visualPlaceholder}
            chapterLabel={labelById.get(article.id) ?? article.title}
          />
        ))}

        <section className={styles.chronology} aria-labelledby="heritage-chronology-title">
          <h2 id="heritage-chronology-title" className={styles.chronologyTitle}>
            {t("heritageReader.chronologyTitle")}
          </h2>
          <div className={styles.chronologyTrack}>
            <div className={styles.chronologyLine} aria-hidden />
            <ol className={styles.chronologyList}>
              {heritage.chronology.map((milestone) => (
                <li key={milestone.year} className={styles.chronologyItem}>
                  <span className={styles.chronologyMarker} aria-hidden />
                  <p className={styles.chronologyYear}>{milestone.year}</p>
                  <p className={styles.chronologyLabel}>{milestone.label}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <div className={styles.backToShop}>
          <Link
            href={shopHomeHref}
            className="dingry-heritage-teaser-cta inline-flex w-fit shrink-0 px-6 py-2.5 text-[10px] font-semibold uppercase tracking-[0.28em] no-underline transition-[border-color,box-shadow,background,transform] duration-200 hover:scale-[1.01] active:scale-[0.99] sm:px-7 sm:text-[11px] sm:tracking-[0.3em]"
          >
            {t("heritageReader.backToShop")}
          </Link>
        </div>
      </div>
    </div>
  );
}
