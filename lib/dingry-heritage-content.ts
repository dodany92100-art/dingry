/** Contenus éditoriaux section Héritage (manifeste + histoire). */

export const DINGRY_HERITAGE_BASELINE = "LE LUXE EST DANS L'ATTITUDE";

export const DINGRY_HERITAGE_HOMEPAGE_HOOK =
  "DINGRY redéfinit le luxe : le caractère, l'indépendance et l'attitude avant le statut.";

export type HeritageChronologyMilestone = {
  year: string;
  label: string;
};

/** Frise chronologique (lecteur Héritage + vitrine). */
export const DINGRY_HERITAGE_CHRONOLOGY: readonly HeritageChronologyMilestone[] = [
  { year: "1998", label: "Royal Wear" },
  { year: "2001", label: "J'voulais" },
  { year: "2020s", label: "Le retour" },
  { year: "Aujourd'hui", label: "DINGRY" },
];

export type HeritagePhilosophyPillar = {
  title: string;
  paragraphs: readonly string[];
};

export type HeritageStoryChapter = {
  title: string;
  paragraphs: readonly string[];
};

export const DINGRY_HERITAGE_MANIFESTE_INTRO: readonly string[] = [
  "DINGRY est une marque streetwear qui se permet de redéfinir la définition du luxe.",
  "Le véritable luxe ne se résume pas à ce que l'on possède ou à ce que l'on porte mais à ce que l'on est et à la manière dont on se comporte.",
  "Nous croyons en une élégance libre, en une esthétique qui traverse les tendances et en une identité qui ne se négocie pas. Nous préférons le caractère à l'apparence, la personnalité à la conformité, l'expression de soi à la validation des autres.",
  "Nous ne suivons pas les codes pour appartenir. Nous choisissons nos propres codes pour exister.",
  "DINGRY ne cherche pas à plaire à tous. Elle revendique une vision, une sensibilité et une certaine idée de l'indépendance.",
  "Parce que le luxe est dans l'attitude.",
  "DINGRY.",
];

export const DINGRY_HERITAGE_PHILOSOPHY_PILLARS: readonly HeritagePhilosophyPillar[] = [
  {
    title: "ATTITUDE BEFORE STATUS",
    paragraphs: [
      "Le statut s'affiche. L'attitude se ressent. Nous croyons en une forme de distinction qui n'a rien à prouver.",
      "Refuser les chemins tracés. Ne pas se laisser définir par les tendances. Faire de sa différence une signature.",
    ],
  },
  {
    title: "TIMELESS BY NATURE",
    paragraphs: [
      "Le véritable style ne dépend pas d'une époque. Il se construit dans la durée, avec exigence, cohérence et caractère.",
      "Ne pas chercher sa place. La prendre. Assumer pleinement qui l'on est, sans compromis et sans permission.",
    ],
  },
];

export const DINGRY_HERITAGE_MANIFESTE_OUTRO: readonly string[] = [
  "Une signature. Un état d'esprit.",
  "DINGRY est plus qu'un nom, plus qu'une esthétique, plus qu'une marque.",
  "C'est une manière de penser, de choisir et de se présenter au monde. Une invitation à sortir du cadre, à affirmer son individualité et à redéfinir ses propres standards.",
  "Nous ne croyons pas au luxe comme démonstration de pouvoir. Nous croyons au luxe comme expression de personnalité.",
  "Le luxe n'est pas une question de prix. C'est une question de présence.",
  "DINGRY",
  "LE LUXE EST DANS L'ATTITUDE",
];

export const DINGRY_HERITAGE_STORY_CHAPTERS: readonly HeritageStoryChapter[] = [
  {
    title: "LE FONDATEUR — UN ESPRIT CRÉATIF. UNE VISION INDÉPENDANTE.",
    paragraphs: [
      "Une vision libre. Une même obsession : créer sans suivre.",
      "Artiste, producteur, entrepreneur et créateur de mode, Sully Sefil a construit son parcours à la croisée de plusieurs univers : la musique, la culture hip-hop, le streetwear et l'entrepreneuriat.",
      "Issu de la culture urbaine, il développe très tôt une sensibilité créative nourrie par les différentes expressions du mouvement hip-hop : la musique, la danse, le graffiti et la mode.",
      "Un environnement qui lui transmet bien plus qu'une esthétique : un état d'esprit fondé sur la liberté, l'indépendance et l'affirmation de soi.",
    ],
  },
  {
    title: "LA MUSIQUE — LES PREMIÈRES EXPRESSIONS",
    paragraphs: [
      "C'est dans la musique que Sully Sefil se fait d'abord connaître.",
      "Artiste et producteur, il évolue au cœur du hip-hop français et participe à son développement à travers différentes collaborations artistiques et productions musicales.",
      "Son parcours le conduit notamment à travailler sur des projets associés à des figures majeures du rap français ; il compose entre autres la musique du titre « That's my people » pour le groupe Suprême NTM, définitivement considéré comme l'un des plus grands classiques du rap français.",
      "En 2001, en auteur-interprète, il connaît un succès populaire avec « J'voulais », titre emblématique qui marque une étape importante de sa carrière et révèle son univers au grand public.",
      "Mais pour Sully, la musique n'a jamais été une finalité. Elle constitue le premier territoire d'expression d'une créativité qui cherche constamment à explorer de nouveaux horizons.",
    ],
  },
  {
    title: "LA MODE — L'ESPRIT ENTREPRENEURIAL",
    paragraphs: [
      "Animé par la même envie de créer et d'entreprendre, Sully Sefil transpose progressivement son univers dans la mode.",
      "À la fin des années 1990, il fonde Royal Wear, une marque de streetwear. Il devient ainsi le premier rappeur français à développer sa marque. Royal Wear va connaître un véritable succès et marquer des générations.",
      "Cette aventure marque une étape fondatrice dans son parcours entrepreneurial.",
      "Il explore ensuite d'autres projets et territoires créatifs, notamment à travers Rock The Street, poursuivant une démarche guidée par l'indépendance, l'expérimentation et la volonté de proposer sa propre lecture de la mode.",
      "Pour lui, le vêtement n'est pas simplement un produit. C'est un message, un langage, une attitude et une manière d'affirmer son identité.",
    ],
  },
  {
    title: "UNE VISION QUI ÉVOLUE",
    paragraphs: [
      "Au fil de ses expériences, Sully Sefil développe une approche transversale de la création.",
      "La musique lui a appris à construire un univers. La mode lui a permis de lui donner une forme. L'entrepreneuriat lui a appris à transformer une vision en projet.",
      "Ces différentes expériences nourrissent aujourd'hui une envie de réinterprétation du luxe, loin des conventions et des signes extérieurs de réussite.",
      "Une conception où le caractère prime sur le statut, où l'identité est plus importante que les tendances et où la liberté reste la première forme de distinction.",
    ],
  },
  {
    title: "DINGRY — UN NOUVEAU CHAPITRE",
    paragraphs: [
      "Avec DINGRY, Sully Sefil ouvre un nouveau chapitre de son histoire créative et entrepreneuriale.",
      "DINGRY est peut-être l'un des meilleurs noms qu'une marque puisse porter, tant il reflète parfaitement l'époque dans laquelle nous vivons.",
      "À travers cette marque streetwear, il entend repousser les frontières traditionnelles entre culture urbaine et luxe contemporain.",
      "Une marque qui revendique sa liberté, assume sa différence et défend une conviction profonde : le véritable luxe ne se porte pas seulement, il se vit !",
      "Le luxe est dans l'attitude.",
    ],
  },
];
