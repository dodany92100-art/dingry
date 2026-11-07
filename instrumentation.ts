export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;

  const { validateProductionEnv } = await import("@/lib/env");
  validateProductionEnv();
}
