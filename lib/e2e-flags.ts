/** Flags réservés Playwright / CI — jamais en production Vercel. */
export function isE2eAutomation(): boolean {
  return process.env.NEXT_PUBLIC_DINGRY_E2E === "1";
}