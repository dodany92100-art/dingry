import {
  DINGRY_HERITAGE_EDITORIAL_SRC,
  DINGRY_HERITAGE_PHILOSOPHY_COVER_SRC,
  DINGRY_HERITAGE_FOUNDER_SRC,
  DINGRY_HERITAGE_MUSIC_VISUAL_SRC,
  DINGRY_HERITAGE_MODE_VISUAL_SRC,
} from "@/lib/dingry-brand";
import type { HeritageLocaleBundle } from "@/lib/i18n/heritage-types";
import type {
  HeritageEditorialArticle,
  HeritageReaderBlock,
  HeritageReaderTabId,
} from "@/lib/dingry-heritage-articles";

export function heritageReaderTabsFromBundle(
  bundle: HeritageLocaleBundle,
): readonly { id: HeritageReaderTabId; label: string }[] {
  return [
    { id: "manifeste", label: bundle.readerTabs.manifeste },
    { id: "philosophie", label: bundle.readerTabs.philosophie },
    { id: "fondateur", label: bundle.readerTabs.fondateur },
  ];
}

function manifesteArticle(bundle: HeritageLocaleBundle): HeritageEditorialArticle {
  const meta = bundle.articles.manifeste;
  return {
    id: "manifeste",
    category: meta.category,
    title: meta.title,
    subtitle: meta.subtitle,
    date: "2026",
    cover: { src: DINGRY_HERITAGE_EDITORIAL_SRC, alt: meta.coverAlt },
    blocks: [
      { kind: "paragraphs", paragraphs: bundle.manifesteIntro },
      { kind: "paragraphs", paragraphs: bundle.manifesteOutro },
    ],
  };
}

function philosophieArticle(bundle: HeritageLocaleBundle): HeritageEditorialArticle {
  const meta = bundle.articles.philosophie;
  const blocks: HeritageReaderBlock[] = [{ kind: "heading", title: meta.heading }];

  for (const pillar of bundle.philosophyPillars) {
    blocks.push({ kind: "heading", title: pillar.title });
    blocks.push({ kind: "paragraphs", paragraphs: pillar.paragraphs });
  }

  blocks.push({ kind: "paragraphs", paragraphs: bundle.manifesteOutro });

  return {
    id: "philosophie",
    category: meta.category,
    title: meta.title,
    subtitle: meta.subtitle,
    date: "2026",
    cover: { src: DINGRY_HERITAGE_PHILOSOPHY_COVER_SRC, alt: meta.coverAlt },
    blocks,
  };
}

function founderArticle(bundle: HeritageLocaleBundle): HeritageEditorialArticle {
  const meta = bundle.articles.fondateur;
  const blocks: HeritageReaderBlock[] = [];
  const musicPrefix = bundle.founderChapterMusicPrefix;
  const modePrefix = bundle.founderChapterModePrefix;

  for (const chapter of bundle.storyChapters) {
    blocks.push({ kind: "heading", title: chapter.title });
    blocks.push({ kind: "paragraphs", paragraphs: chapter.paragraphs });
    if (chapter.title.startsWith(musicPrefix)) {
      blocks.push({
        kind: "visual",
        src: DINGRY_HERITAGE_MUSIC_VISUAL_SRC,
        alt: bundle.visuals.musicAlt,
        caption: bundle.visuals.musicCaption,
        ratio: "16/9",
      });
    }
    if (chapter.title.startsWith(modePrefix)) {
      blocks.push({
        kind: "visual",
        src: DINGRY_HERITAGE_MODE_VISUAL_SRC,
        alt: bundle.visuals.modeAlt,
        caption: bundle.visuals.modeCaption,
        ratio: "4/5",
      });
    }
  }

  return {
    id: "fondateur",
    category: meta.category,
    title: meta.title,
    subtitle: meta.subtitle,
    date: "2026",
    cover: {
      src: DINGRY_HERITAGE_FOUNDER_SRC,
      alt: meta.coverAlt,
      layout: "portrait",
    },
    blocks,
  };
}

export function heritageArticlesForLocale(bundle: HeritageLocaleBundle): readonly HeritageEditorialArticle[] {
  return [manifesteArticle(bundle), philosophieArticle(bundle), founderArticle(bundle)];
}

export function heritageArticleForTabLocale(
  tabId: HeritageReaderTabId,
  bundle: HeritageLocaleBundle,
): HeritageEditorialArticle {
  const articles = heritageArticlesForLocale(bundle);
  const article = articles.find((entry) => entry.id === tabId);
  return article ?? articles[0]!;
}
