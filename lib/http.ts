import { NextResponse } from "next/server";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

/** Réponses API JSON sans mise en cache (erreurs incluses). */
export function jsonNoStore(
  body: unknown,
  init?: ResponseInit & { status?: number },
): NextResponse {
  return NextResponse.json(body, {
    ...init,
    headers: { ...NO_STORE_HEADERS, ...init?.headers },
  });
}
