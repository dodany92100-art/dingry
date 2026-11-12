import {
  DINGRY_HERITAGE_BASELINE,
  DINGRY_HERITAGE_CHRONOLOGY,
  DINGRY_HERITAGE_HOMEPAGE_HOOK,
  DINGRY_HERITAGE_MANIFESTE_INTRO,
  DINGRY_HERITAGE_MANIFESTE_OUTRO,
  DINGRY_HERITAGE_PHILOSOPHY_PILLARS,
  DINGRY_HERITAGE_STORY_CHAPTERS,
} from "@/lib/dingry-heritage-content";
import type { HeritageLocaleBundle } from "@/lib/i18n/heritage-types";

/** Contenu héritage FR (source éditoriale actuelle → exposé aussi dans `messages.fr.heritage`). */
export function buildFrHeritageBundle(): HeritageLocaleBundle {
  return {
    baseline: DINGRY_HERITAGE_BASELINE,
    homepageHook: DINGRY_HERITAGE_HOMEPAGE_HOOK,
    ctaDiscover: "Découvrir l'histoire",
    chronology: DINGRY_HERITAGE_CHRONOLOGY,
    manifesteIntro: DINGRY_HERITAGE_MANIFESTE_INTRO,
    manifesteOutro: DINGRY_HERITAGE_MANIFESTE_OUTRO,
    philosophyPillars: DINGRY_HERITAGE_PHILOSOPHY_PILLARS,
    storyChapters: DINGRY_HERITAGE_STORY_CHAPTERS,
    readerTabs: {
      manifeste: "Manifeste",
      philosophie: "Philosophie",
      fondateur: "Le fondateur",
    },
    articles: {
      manifeste: {
        category: "Manifeste",
        title: "Redéfinir le luxe",
        subtitle: "Le caractère avant le statut.",
        coverAlt: "DINGRY — manifeste",
      },
      philosophie: {
        category: "Philosophie",
        title: "Attitude & signature",
        subtitle: "Timeless by nature — le luxe comme présence.",
        coverAlt: "DINGRY — philosophie éditoriale",
        heading: "Notre philosophie",
      },
      fondateur: {
        category: "Histoire",
        title: "Le fondateur — Sully Sefil",
        subtitle: "Musique, NTM, mode et nouveau chapitre DINGRY.",
        coverAlt: "Sully Sefil — fondateur DINGRY",
      },
    },
    visuals: {
      musicAlt: "Musique et culture hip-hop",
      musicCaption: "Les premières expressions — illustration",
      modeAlt: "Streetwear et entrepreneuriat",
      modeCaption: "Royal Wear · Rock The Street — illustration",
    },
    founderChapterMusicPrefix: "LA MUSIQUE",
    founderChapterModePrefix: "LA MODE",
  };
}
