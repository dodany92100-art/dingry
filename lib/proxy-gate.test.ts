import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  PROXY_MATCHER,
  handleProxyRequest,
  pathMatchesProxyMatcher,
} from "@/lib/proxy-gate";
import { signAdminSession } from "@/lib/admin/session-token";

const SESSION_SECRET = "a".repeat(32);

function requestFor(path: string, cookieToken?: string): NextRequest {
  const url = new URL(path, "https://www.dingry.com");
  const headers: Record<string, string> = {};
  if (cookieToken) headers.cookie = `dingry_admin=${cookieToken}`;
  return new NextRequest(url, { headers });
}

describe("pathMatchesProxyMatcher", () => {
  it("couvre les routes vitrine et admin", () => {
    expect(pathMatchesProxyMatcher("/websitedx")).toBe(true);
    expect(pathMatchesProxyMatcher("/checkout/success")).toBe(true);
    expect(pathMatchesProxyMatcher("/api/catalog")).toBe(true);
    expect(pathMatchesProxyMatcher("/admin/lookbook")).toBe(true);
  });

  it("n'inclut pas webhook ni cron", () => {
    expect(pathMatchesProxyMatcher("/api/paypal/webhook")).toBe(false);
    expect(pathMatchesProxyMatcher("/api/cron/stock-reconcile")).toBe(false);
    expect(pathMatchesProxyMatcher("/api/teaser")).toBe(true);
  });

  it("matcher exporté cohérent", () => {
    expect(PROXY_MATCHER).not.toContain("/api/paypal/webhook");
    expect(PROXY_MATCHER).not.toContain("/api/cron/stock-reconcile");
  });
});

describe("handleProxyRequest teaser gate", () => {
  beforeEach(() => {
    vi.stubEnv("DINGRY_TEASER_GATE", "");
    vi.stubEnv("ADMIN_SESSION_SECRET", SESSION_SECRET);
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("VERCEL_ENV", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("webhook et cron passent sans cookie via next()", async () => {
    for (const path of ["/api/paypal/webhook", "/api/cron/stock-reconcile"]) {
      const response = await handleProxyRequest(requestFor(path));
      expect(response.status).toBe(200);
      expect(response.headers.get("location")).toBeNull();
    }
  });

  it("sans cookie : redirect admin + next sur /websitedx", async () => {
    const response = await handleProxyRequest(requestFor("/websitedx"));
    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toContain("/admin");
    expect(location).toContain("next=%2Fwebsitedx");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("X-Robots-Tag")).toBe("noindex");
  });

  it("sans cookie : 401 json sur /api/catalog", async () => {
    const response = await handleProxyRequest(requestFor("/api/catalog"));
    expect(response.status).toBe(401);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("X-Robots-Tag")).toBe("noindex");
    const body = (await response.json()) as { error?: string };
    expect(body.error).toBe("Non autorisé.");
  });

  it("avec cookie admin valide : accès /websitedx", async () => {
    const { token } = await signAdminSession(SESSION_SECRET);
    const response = await handleProxyRequest(requestFor("/websitedx", token));
    expect(response.status).toBe(200);
  });

  it("gate désactivé : /api/catalog sans cookie", async () => {
    vi.stubEnv("DINGRY_TEASER_GATE", "off");
    const response = await handleProxyRequest(requestFor("/api/catalog"));
    expect(response.status).toBe(200);
  });
});
