import {
  collectProductionEnvErrors,
  isProductionEnvCheck,
  readSupabaseEnv,
  validateProductionEnv as validateProductionEnvCore,
} from "./env-core.mjs";

export { readSupabaseEnv, collectProductionEnvErrors, isProductionEnvCheck };

/** Bloque le build (`next.config`) et le boot serveur (`instrumentation`) si la prod est mal configurée. */
export function validateProductionEnv(): void {
  validateProductionEnvCore();
}

export function requireProductionEnv(): void {
  validateProductionEnv();
}
