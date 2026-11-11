"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { DingryLogo } from "@/components/atoms/dingry-logo";
import {
  DINGRY_HERITAGE_BASELINE_ACCENT,
  DINGRY_HERITAGE_READER_TABS,
  heritageArticleForTab,
  type HeritageEditorialArticle,
  type HeritageReaderBlock,
  type HeritageReaderTabId,
} from "@/lib/dingry-heritage-articles";
import { DINGRY_HERITAGE_CHRONOLOGY } from "@/lib/dingry-heritage-content";
import { MODAL_OVERLAY_TRANSITION, MODAL_PANEL_SPRING } from "./motion";
import styles from "./heritage-reader.module.css";

type HeritageReaderProps = {
  open: boolean;
  onClose: () => void;
  /** Onglet initial à l’ouverture (manifeste, philosophie, fondateur). */
  initialArticleId?: string;
};

function ReaderBlock({ block, blockKey }: { block: HeritageReaderBlock; blockKey: string }) {
  if (block.kind === "paragraphs") {
    return (
      <div className={styles.prose}>
        {block.paragraphs.map((paragraph) => (
          <p key={`${blockKey}-${paragraph.slice(0, 32)}`}>{paragraph}</p>
        ))}
      </div>
    );
  }

  if (block.kind === "heading") {
    return <h4 className={styles.blockHeading}>{block.title}</h4>;
  }

  const ratioClass = block.ratio === "16/9" ? styles.ratio169 : styles.ratio45;

  return (
    <figure className={styles.visual}>
      {block.src ? (
        <img src={block.src} alt={block.alt} className={styles.visualMedia} loading="lazy" />
      ) : (
        <div className={`${styles.visualPlaceholder} ${ratioClass}`} role="img" aria-label={block.alt}>
          <span className={styles.visualPlaceholderLabel}>Visuel</span>
          <span className={`${styles.visualPlaceholderLabel} max-w-[12rem] normal-case tracking-[0.08em]`}>
            {block.caption}
          </span>
        </div>
      )}
      <figcaption className={styles.caption}>{block.caption}</figcaption>
    </figure>
  );
}

function ArticleCard({ article }: { article: HeritageEditorialArticle }) {
  return (
    <article className={styles.articleCard} id={`heritage-article-${article.id}`}>
      {article.cover ? (
        <figure className={styles.articleCover}>
          <img
            src={article.cover.src}
            alt={article.cover.alt}
            className={
              article.cover.layout === "portrait"
                ? `${styles.articleCoverMedia} ${styles.articleCoverMediaPortrait}`
                : styles.articleCoverMedia
            }
            loading="lazy"
          />
        </figure>
      ) : null}
      <div className={styles.articleBody}>
        <div className={styles.articleMeta}>
          <span className={styles.category}>{article.category}</span>
          {article.date ? <span className={styles.articleDate}>{article.date}</span> : null}
        </div>
        <h3 className={styles.articleTitle}>{article.title}</h3>
        <p className={styles.articleSubtitle}>{article.subtitle}</p>
        {article.blocks.map((block, index) => (
          <ReaderBlock key={`${article.id}-${index}`} block={block} blockKey={`${article.id}-${index}`} />
        ))}
      </div>
    </article>
  );
}

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function HeritageReader({ open, onClose, initialArticleId }: HeritageReaderProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const touchStartY = useRef<number | null>(null);
  const initialTab: HeritageReaderTabId =
    initialArticleId === "fondateur" || initialArticleId === "philosophie" || initialArticleId === "manifeste"
      ? initialArticleId
      : "manifeste";
  const [activeTab, setActiveTab] = useState<HeritageReaderTabId>(initialTab);
  const activeArticle = heritageArticleForTab(activeTab);

  useEffect(() => {
    if (!open) return;
    const previousBody = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtnRef.current?.focus();
    return () => {
      document.body.style.overflow = previousBody;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const root = panelRef.current;
      if (!root) return;
      const nodes = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (node) => node.offsetParent !== null,
      );
      if (nodes.length === 0) return;
      const first = nodes[0]!;
      const last = nodes[nodes.length - 1]!;
      const active = document.activeElement;
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !initialArticleId) return;
    if (
      initialArticleId === "manifeste" ||
      initialArticleId === "philosophie" ||
      initialArticleId === "fondateur"
    ) {
      setActiveTab(initialArticleId);
    }
  }, [open, initialArticleId]);

  const selectTab = useCallback((tabId: HeritageReaderTabId) => {
    setActiveTab(tabId);
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  function handleTouchStart(clientY: number) {
    touchStartY.current = clientY;
  }

  function handleTouchEnd(clientY: number) {
    const start = touchStartY.current;
    touchStartY.current = null;
    if (start === null) return;
    const scroller = scrollRef.current;
    if (!scroller || scroller.scrollTop > 8) return;
    if (clientY - start > 72) onClose();
  }

  return (
    <AnimatePresence>
      {open ? (
        <div
          key="dingry-heritage-reader"
          className={`${styles.root} ${styles.rootOpen}`}
          data-dingry-heritage-reader=""
          role="presentation"
        >
          <motion.button
            type="button"
            className={styles.overlay}
            aria-label="Fermer le lecteur Héritage"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={MODAL_OVERLAY_TRANSITION}
            onClick={onClose}
          />
          <motion.div
            className={styles.shell}
            initial={{ opacity: 0, y: 32, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={MODAL_PANEL_SPRING}
            onClick={(event) => event.stopPropagation()}
          >
            <div
              ref={panelRef}
              className={`${styles.panel} dingry-shop dingry-heritage-reader-panel`}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              onTouchStart={(e) => handleTouchStart(e.changedTouches[0]?.clientY ?? 0)}
              onTouchEnd={(e) => handleTouchEnd(e.changedTouches[0]?.clientY ?? 0)}
            >
            <div className={styles.dragHandle} aria-hidden>
              <span className={styles.dragHandleBar} />
            </div>
            <header className={styles.header}>
              <DingryLogo animate={false} tone="on-dark" className="h-8 w-auto md:h-9" />
              <button
                ref={closeBtnRef}
                type="button"
                onClick={onClose}
                className={styles.closeBtn}
                aria-label="Fermer"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </header>

            <div ref={scrollRef} className={styles.scroll}>
              <div className={styles.inner}>
                <div className={styles.baseline}>
                  <p id={titleId} className={styles.baselineText}>
                    {DINGRY_HERITAGE_BASELINE_ACCENT}
                  </p>
                </div>

                <div className={styles.tabs} role="tablist" aria-label="Chapitres Héritage">
                  {DINGRY_HERITAGE_READER_TABS.map((tab) => {
                    const selected = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        id={`heritage-tab-${tab.id}`}
                        aria-selected={selected}
                        aria-controls="heritage-tabpanel"
                        tabIndex={selected ? 0 : -1}
                        className={`${styles.tab} ${selected ? styles.tabOn : ""}`}
                        onClick={() => selectTab(tab.id)}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                <div
                  id="heritage-tabpanel"
                  role="tabpanel"
                  aria-labelledby={`heritage-tab-${activeTab}`}
                  className={styles.tabPanel}
                >
                  <ArticleCard key={activeArticle.id} article={activeArticle} />
                </div>

                <section className={styles.chronology} aria-labelledby="heritage-chronology-title">
                  <h2 id="heritage-chronology-title" className={styles.chronologyTitle}>
                    Chronologie
                  </h2>
                  <div className={styles.chronologyTrack}>
                    <div className={styles.chronologyLine} aria-hidden />
                    <ol className={styles.chronologyList}>
                      {DINGRY_HERITAGE_CHRONOLOGY.map((milestone) => (
                        <li key={milestone.year} className={styles.chronologyItem}>
                          <span className={styles.chronologyMarker} aria-hidden />
                          <p className={styles.chronologyYear}>{milestone.year}</p>
                          <p className={styles.chronologyLabel}>{milestone.label}</p>
                        </li>
                      ))}
                    </ol>
                  </div>
                </section>
              </div>
            </div>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
