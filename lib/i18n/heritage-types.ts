export type HeritageChronologyMilestone = { year: string; label: string };

export type HeritagePhilosophyPillar = {
  title: string;
  paragraphs: readonly string[];
};

export type HeritageStoryChapter = {
  title: string;
  paragraphs: readonly string[];
};

export type HeritageLocaleBundle = {
  baseline: string;
  homepageHook: string;
  ctaDiscover: string;
  chronology: readonly HeritageChronologyMilestone[];
  manifesteIntro: readonly string[];
  manifesteOutro: readonly string[];
  philosophyPillars: readonly HeritagePhilosophyPillar[];
  storyChapters: readonly HeritageStoryChapter[];
  readerTabs: { manifeste: string; philosophie: string; fondateur: string };
  articles: {
    manifeste: { category: string; title: string; subtitle: string; coverAlt: string };
    philosophie: { category: string; title: string; subtitle: string; coverAlt: string; heading: string };
    fondateur: { category: string; title: string; subtitle: string; coverAlt: string };
  };
  visuals: {
    musicAlt: string;
    musicCaption: string;
    modeAlt: string;
    modeCaption: string;
  };
  founderChapterMusicPrefix: string;
  founderChapterModePrefix: string;
};
