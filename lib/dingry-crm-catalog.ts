/** Vitrine + devis : n'afficher que les fiches CRM live (pas PRODUCTS). Activé par DINGRY_CRM_SOURCE=1. */
export function isDingryCrmOnlyCatalog(): boolean {
  return process.env.DINGRY_CRM_SOURCE === "1";
}
