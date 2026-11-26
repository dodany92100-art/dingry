/** Clé de comparaison insensible aux accents / casse pour libellés coloris. */
export function catalogSheetColorLabelKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export function catalogSheetColorsEquivalent(a: string, b: string): boolean {
  return catalogSheetColorLabelKey(a) === catalogSheetColorLabelKey(b);
}