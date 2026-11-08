/** Validation env production — importable depuis next.config.mjs (sans transpilation TS). */

/**
 * @param {string | undefined} value
 */
function trimmed(value) {
  return (value ?? "").trim();
}

/**
 * @param {string} key
 */
function envPresent(key) {
  return trimmed(process.env[key]).length > 0;
}

/**
 * @returns {{ url: string; serviceRole: string }}
 */
export function readSupabaseEnv() {
  const url = trimmed(process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL);
  const serviceRole = trimmed(process.env.SUPABASE_SERVICE_ROLE_KEY);
  return { url, serviceRole };
}

export function isProductionEnvCheck() {
  if (process.env.VITEST) return false;
  if (trimmed(process.env.SKIP_ENV_VALIDATION) === "1") return false;
  return process.env.NODE_ENV === "production";
}

/**
 * @returns {string[]}
 */
export function collectProductionEnvErrors() {
  const errors = [];

  const { url: supabaseUrl, serviceRole } = readSupabaseEnv();
  const hasSupabaseUrl = supabaseUrl.length > 0;
  const hasServiceRole = serviceRole.length > 0;

  if (hasSupabaseUrl !== hasServiceRole) {
    const missing = [];
    if (!hasSupabaseUrl) missing.push("NEXT_PUBLIC_SUPABASE_URL (ou SUPABASE_URL)");
    if (!hasServiceRole) missing.push("SUPABASE_SERVICE_ROLE_KEY");
    errors.push(
      `Supabase CRM incomplet : manque ${missing.join(" et ")}. Les deux sont obligatoires ensemble (Vercel : cocher Preview et Production, puis redeploy).`,
    );
  }

  const supabaseComplete = hasSupabaseUrl && hasServiceRole;

  if (!supabaseComplete) {
    errors.push(
      "Stockage CRM : définir NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (Supabase + R2 pour les images).",
    );
  }

  return errors;
}

export function validateProductionEnv() {
  if (!isProductionEnvCheck()) return;

  const errors = collectProductionEnvErrors();
  if (errors.length === 0) return;

  const body = errors.map((line) => `  • ${line}`).join("\n");
  throw new Error(
    `[DINGRY] Variables d'environnement production invalides.\n${body}\nVoir .env.example ou Vercel → Settings → Environment Variables.`,
  );
}
