export type LegalDocId = "cgv" | "rgpd" | "mentions" | "retours" | "livraison" | "expedition";

export type LegalDocumentBundle = Record<
  LegalDocId,
  { title: string; subtitle: string; sections: Array<{ heading: string; body: string }> }
>;
