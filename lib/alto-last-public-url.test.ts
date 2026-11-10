import { describe, expect, it, vi, beforeEach } from "vitest";
import { DINGRY_TEASER_OPENING_AT } from "@/lib/dingry-teaser-opening";
import {
  ALTO_LAST_PUBLIC_URL_KEY,
  ALTO_PUBLIC_FALLBACK_PATH,
  buildRelativeUrl,
  isAdminAppPath,
  normalizeAltoPublicUrl,
  readAltoLastPublicUrl,
  saveAltoLastPublicUrl,
} from "./alto-last-public-url";

describe("alto-last-public-url", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal("sessionStorage", {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
      removeItem: (k: string) => {
        store.delete(k);
      },
    });
  });

  it("mémorise l'URL boutique avec query", () => {
    saveAltoLastPublicUrl("/websitedx?category=jersey");
    expect(readAltoLastPublicUrl()).toBe("/websitedx?category=jersey");
  });

  it("refuse de mémoriser l'admin", () => {
    saveAltoLastPublicUrl("/admin?tab=produits");
    expect(readAltoLastPublicUrl()).toBe(ALTO_PUBLIC_FALLBACK_PATH);
  });

  it("buildRelativeUrl", () => {
    expect(buildRelativeUrl("/websitedx", "category=jersey")).toBe("/websitedx?category=jersey");
    expect(buildRelativeUrl("/", "")).toBe("/");
  });

  it("détecte les chemins admin", () => {
    expect(isAdminAppPath("/admin")).toBe(true);
    expect(isAdminAppPath("/websitedx")).toBe(false);
  });

  it("utilise la clé sessionStorage attendue", () => {
    saveAltoLastPublicUrl("/websitedx");
    expect(sessionStorage.getItem(ALTO_LAST_PUBLIC_URL_KEY)).toBe("/websitedx");
  });

  it("redirige Alto / teaser vers /websitedx avant ouverture", () => {
    vi.stubEnv("DINGRY_PUBLIC_HOME", "");
    vi.stubEnv("NEXT_PUBLIC_DINGRY_PUBLIC_HOME", "");
    const beforeOpen = DINGRY_TEASER_OPENING_AT - 60_000;
    expect(normalizeAltoPublicUrl("/", beforeOpen)).toBe("/websitedx");
    expect(normalizeAltoPublicUrl("/?foo=1", beforeOpen)).toBe("/websitedx?foo=1");
    saveAltoLastPublicUrl("/");
    expect(readAltoLastPublicUrl()).toBe("/websitedx");
  });
});
