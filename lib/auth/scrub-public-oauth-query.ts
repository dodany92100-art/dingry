/** Paramètres OAuth / Supabase à ne pas laisser traîner sur les pages boutique. */
export const OAUTH_URL_QUERY_KEYS = [
  "error",
  "error_description",
  "error_code",
  "code",
  "sb_flow_id",
  "token_hash",
  "type",
] as const;

export function hasSupabaseOAuthQuery(params: URLSearchParams): boolean {
  return OAUTH_URL_QUERY_KEYS.some((key) => params.has(key));
}

export function searchWithoutOAuthQuery(params: URLSearchParams): string {
  const next = new URLSearchParams(params);
  for (const key of OAUTH_URL_QUERY_KEYS) next.delete(key);
  const query = next.toString();
  return query ? `?${query}` : "";
}
