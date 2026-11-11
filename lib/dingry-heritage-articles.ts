import { DINGRY_HERITAGE_EDITORIAL_SRC, DINGRY_HERITAGE_FOUNDER_SRC } from "@/lib/dingry-brand";
import {
  DINGRY_HERITAGE_BASELINE,
  DINGRY_HERITAGE_MANIFESTE_INTRO,
  DINGRY_HERITAGE_MANIFESTE_OUTRO,
  DINGRY_HERITAGE_PHILOSOPHY_PILLARS,
  DINGRY_HERITAGE_STORY_CHAPTERS,
} from "@/lib/dingry-heritage-content";

export type HeritageVisualRatio = "16/9" | "4/5";

export type HeritageReaderBlock =
  | { kind: "paragraphs"; paragraphs: readonly string[] }
  | { kind: "heading"; title: string }
  | {
      kind: "visual";
      src?: string;
      alt: string;
      caption: string;
      ratio: HeritageVisualRatio;
    };

export type HeritageEditorialArticle = {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  date?: string;
  cover?: { src: string; alt: string; layout?: "landscape" | "portrait" };
  blocks: readonly HeritageReaderBlock[];
};

export type HeritageReaderTabId = "manifeste" | "philosophie" | "fondateur";

export const DINGRY_HERITAGE_READER_TABS: readonly {
  id: HeritageReaderTabId;
  label: string;
}[] = [
  { id: "manifeste", label: "Manifeste" },
  { id: "philosophie", label: "Philosophie" },
  { id: "fondateur", label: "Le fondateur" },
];

function manifesteArticle(): HeritageEditorialArticle {
  return {
    id: "manifeste",
    category: "Manifeste",
    title: "Redéfinir le luxe",
    subtitle: "Le caractère avant le statut.",
    date: "2026",
    cover: { src: DINGRY_HERITAGE_EDITORIAL_SRC, alt: "DINGRY — manifeste" },
    blocks: [
      { kind: "paragraphs", paragraphs: DINGRY_HERITAGE_MANIFESTE_INTRO },
      { kind: "paragraphs", paragraphs: DINGRY_HERITAGE_MANIFESTE_OUTRO },
    ],
  };
}

function philosophieArticle(): HeritageEditorialArticle {
  const blocks: HeritageReaderBlock[] = [{ kind: "heading", title: "Notre philosophie" }];

  for (const pillar of DINGRY_HERITAGE_PHILOSOPHY_PILLARS) {
    blocks.push({ kind: "heading", title: pillar.title });
    blocks.push({ kind: "paragraphs", paragraphs: pillar.paragraphs });
  }

  blocks.push({ kind: "paragraphs", paragraphs: DINGRY_HERITAGE_MANIFESTE_OUTRO });

  return {
    id: "philosophie",
    category: "Philosophie",
    title: "Attitude & signature",
    subtitle: "Timeless by nature — le luxe comme présence.",
    date: "2026",
    cover: { src: DINGRY_HERITAGE_EDITORIAL_SRC, alt: "DINGRY — philosophie éditoriale" },
    blocks,
  };
}

function founderArticle(): HeritageEditorialArticle {
  const blocks: HeritageReaderBlock[] = [];

  for (const chapter of DINGRY_HERITAGE_STORY_CHAPTERS) {
    blocks.push({ kind: "heading", title: chapter.title });
    blocks.push({ kind: "paragraphs", paragraphs: chapter.paragraphs });
    if (chapter.title.startsWith("LA MUSIQUE")) {
      blocks.push({
        kind: "visual",
        alt: "Musique et culture hip-hop",
        caption: "Les premières expressions — illustration",
        ratio: "16/9",
      });
    }
    if (chapter.title.startsWith("LA MODE")) {
      blocks.push({
        kind: "visual",
        alt: "Streetwear et entrepreneuriat",
        caption: "Royal Wear · Rock The Street — illustration",
        ratio: "4/5",
      });
    }
  }

  return {
    id: "fondateur",
    category: "Histoire",
    title: "Le fondateur — Sully Sefil",
    subtitle: "Musique, NTM, mode et nouveau chapitre DINGRY.",
    date: "2026",
    cover: {
      src: DINGRY_HERITAGE_FOUNDER_SRC,
      alt: "Sully Sefil — fondateur DINGRY",
      layout: "portrait",
    },
    blocks,
  };
}

export const DINGRY_HERITAGE_ARTICLES: readonly HeritageEditorialArticle[] = [
  manifesteArticle(),
  philosophieArticle(),
  founderArticle(),
];

export function heritageArticleForTab(tabId: HeritageReaderTabId): HeritageEditorialArticle {
  const article = DINGRY_HERITAGE_ARTICLES.find((entry) => entry.id === tabId);
  if (!article) {
    return DINGRY_HERITAGE_ARTICLES[0]!;
  }
  return article;
}

export const DINGRY_HERITAGE_BASELINE_ACCENT = DINGRY_HERITAGE_BASELINE;

export function heritageArticleById(id: string): HeritageEditorialArticle | undefined {
  return DINGRY_HERITAGE_ARTICLES.find((article) => article.id === id);
}
