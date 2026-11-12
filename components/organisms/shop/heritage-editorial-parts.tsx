"use client";

import type { HeritageEditorialArticle, HeritageReaderBlock } from "@/lib/dingry-heritage-articles";
import styles from "./heritage-editorial.module.css";

export function HeritageReaderBlockView({
  block,
  blockKey,
  visualPlaceholder,
}: {
  block: HeritageReaderBlock;
  blockKey: string;
  visualPlaceholder: string;
}) {
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
          <span className={styles.visualPlaceholderLabel}>{visualPlaceholder}</span>
          <span className={`${styles.visualPlaceholderLabel} max-w-[12rem] normal-case tracking-[0.08em]`}>
            {block.caption}
          </span>
        </div>
      )}
      <figcaption className={styles.caption}>{block.caption}</figcaption>
    </figure>
  );
}

export function HeritageArticleCard({
  article,
  visualPlaceholder,
  chapterLabel,
}: {
  article: HeritageEditorialArticle;
  visualPlaceholder: string;
  chapterLabel: string;
}) {
  return (
    <section className={styles.chapter} id={`heritage-${article.id}`} aria-labelledby={`heritage-chapter-${article.id}`}>
      <p className={styles.chapterEyebrow} id={`heritage-chapter-${article.id}`}>
        {chapterLabel}
      </p>
      <article className={styles.articleCard}>
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
          <h2 className={styles.articleTitle}>{article.title}</h2>
          <p className={styles.articleSubtitle}>{article.subtitle}</p>
          {article.blocks.map((block, index) => (
            <HeritageReaderBlockView
              key={`${article.id}-${index}`}
              block={block}
              blockKey={`${article.id}-${index}`}
              visualPlaceholder={visualPlaceholder}
            />
          ))}
        </div>
      </article>
    </section>
  );
}
