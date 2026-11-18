import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as edgeApiRateLimit from "@/lib/edge-api-rate-limit";
import {
  PROXY_MATCHER,
  handleProxyRequest,
  pathMatchesProxyMatcher,
} from "@/lib/proxy-gate";
import { signAdminSession } from "@/lib/admin/session-token";

const SESSION_SECRET = "a".repeat(32);

function requestFor(
  path: string,
  cookieToken?: string,
  init?: { method?: string; body?: string; host?: string },
): NextRequest {
  const originHost = init?.host ?? "www.dingry.com";
  const url = new URL(path, `https://${originHost}`);
  const headers: Record<string, string> = { "x-vercel-forwarded-for": "203.0.113.1" };
  if (cookieToken) headers.cookie = `dingry_admin=${cookieToken}`;
  if (init?.body) headers["Content-Type"] = "application/json";
  return new NextRequest(url, { headers, method: init?.method ?? "GET", body: init?.body });
}

describe("pathMatchesProxyMatcher", () => {
  it("couvre les routes vitrine et admin", () => {
    expect(pathMatchesProxyMatcher("/websitedx")).toBe(true);
    expect(pathMatchesProxyMatcher("/checkout/success")).toBe(true);
    expect(pathMatchesProxyMatcher("/api/catalog")).toBe(true);
    expect(pathMatchesProxyMatcher("/admin/lookbook")).toBe(true);
  });

  it("couvre webhook et cron (catch-all)", () => {
    expect(pathMatchesProxyMatcher("/api/paypal/webhook")).toBe(true);
    expect(pathMatchesProxyMatcher("/api/cron/stock-reconcile")).toBe(true);
    expect(pathMatchesProxyMatcher("/api/teaser")).toBe(true);
  });

  it("exclut les assets Next statiques", () => {
    expect(pathMatchesProxyMatcher("/_next/static/chunk.js")).toBe(false);
    expect(pathMatchesProxyMatcher("/favicon.ico")).toBe(false);
  });

  it("matcher exporté cohérent", () => {
    expect(PROXY_MATCHER).toEqual(["/", "/((?!_next/static|_next/image|favicon.ico).*)"]);
  });
});

describe("handleProxyRequest host split", () => {
  const SPLIT_ENVS = {
    DINGRY_CRM_HOST: "crm.dingry.com",
    DINGRY_SHOP_HOSTS: "dingry.com,www.dingry.com",
    DINGRY_TEASER_GATE: "",
    ADMIN_SESSION_SECRET: SESSION_SECRET,
    NODE_ENV: "production",
    VERCEL_ENV: "production",
  } as const;

  beforeEach(() => {
    vi.stubEnv("DINGRY_CRM_HOST", SPLIT_ENVS.DINGRY_CRM_HOST);
    vi.stubEnv("DINGRY_SHOP_HOSTS", SPLIT_ENVS.DINGRY_SHOP_HOSTS);
    vi.stubEnv("DINGRY_TEASER_GATE", SPLIT_ENVS.DINGRY_TEASER_GATE);
    vi.stubEnv("ADMIN_SESSION_SECRET", SPLIT_ENVS.ADMIN_SESSION_SECRET);
    vi.stubEnv("NODE_ENV", SPLIT_ENVS.NODE_ENV);
    vi.stubEnv("VERCEL_ENV", SPLIT_ENVS.VERCEL_ENV);
    vi.spyOn(edgeApiRateLimit, "limitEdgeApiWrite").mockResolvedValue({
      ok: true,
      limit: 20,
      remaining: 19,
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("boutique + /admin → 404", async () => {
    const response = await handleProxyRequest(requestFor("/admin", undefined, { host: "www.dingry.com" }));
    expect(response.status).toBe(404);
    expect(response.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
  });

  it("boutique + /api/upload → 404", async () => {
    const response = await handleProxyRequest(requestFor("/api/upload", undefined, { host: "dingry.com" }));
    expect(response.status).toBe(404);
  });

  it("vercel.app + /admin → 404", async () => {
    const response = await handleProxyRequest(
      requestFor("/admin", undefined, { host: "dingry-git-main.vercel.app" }),
    );
    expect(response.status).toBe(404);
  });

  it("boutique + webhook → next()", async () => {
    const response = await handleProxyRequest(
      requestFor("/api/paypal/webhook", undefined, { host: "www.dingry.com" }),
    );
    expect(response.status).toBe(200);
  });

  it("CRM + / → 404", async () => {
    const response = await handleProxyRequest(requestFor("/", undefined, { host: "crm.dingry.com" }));
    expect(response.status).toBe(404);
  });

  it("CRM + /admin → login page (next)", async () => {
    const response = await handleProxyRequest(requestFor("/admin", undefined, { host: "crm.dingry.com" }));
    expect(response.status).toBe(200);
  });

  it("split inactif : /admin sur boutique → redirect legacy", async () => {
    vi.stubEnv("DINGRY_CRM_HOST", "");
    const response = await handleProxyRequest(requestFor("/websitedx", undefined, { host: "www.dingry.com" }));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/admin");
  });
});

describe("handleProxyRequest teaser gate", () => {
  beforeEach(() => {
    vi.stubEnv("DINGRY_TEASER_GATE", "");
    vi.stubEnv("ADMIN_SESSION_SECRET", SESSION_SECRET);
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("VERCEL_ENV", "");
    vi.spyOn(edgeApiRateLimit, "limitEdgeApiWrite").mockResolvedValue({
      ok: true,
      limit: 20,
      remaining: 19,
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
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

  it("sans cookie : /checkout/success?token= public (retour PayPal)", async () => {
    const response = await handleProxyRequest(
      requestFor("/checkout/success?token=5R989080W42399034"),
    );
    expect(response.status).toBe(200);
  });

  it("sans cookie : POST /api/checkout capture autorisé", async () => {
    const response = await handleProxyRequest(
      requestFor("/api/checkout", undefined, {
        method: "POST",
        body: JSON.stringify({ intent: "capture", orderId: "5R989080W42399034" }),
      }),
    );
    expect(response.status).toBe(200);
  });

  it("sans cookie : POST /api/checkout create refusé", async () => {
    const response = await handleProxyRequest(
      requestFor("/api/checkout", undefined, {
        method: "POST",
        body: JSON.stringify({ intent: "create", token: "x", lines: [] }),
      }),
    );
    expect(response.status).toBe(401);
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
