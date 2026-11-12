export type LegalDocId = "cgv" | "rgpd" | "mentions" | "retours" | "livraison";

export type LegalDocumentBundle = Record<
  LegalDocId,
  { title: string; subtitle: string; sections: Array<{ heading: string; body: string }> }
>;
