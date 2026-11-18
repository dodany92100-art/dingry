import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isCrmHost,
  isCrmOnlyPath,
  isCrmPermittedPath,
  isHostSplitActive,
  isShopHost,
  normalizeHostname,
} from "@/lib/host-routing";

afterEach(() => vi.unstubAllEnvs());

describe("normalizeHostname", () => {
  it("retire le port et normalise la casse", () => {
    expect(normalizeHostname("CRM.Dingry.com:443")).toBe("crm.dingry.com");
  });

  it("gère l'IPv6", () => {
    expect(normalizeHostname("[::1]:3000")).toBe("::1");
  });
});

describe("split host", () => {
  it("est inactif sans DINGRY_CRM_HOST", () => {
    vi.stubEnv("DINGRY_CRM_HOST", "");
    expect(isHostSplitActive()).toBe(false);
    expect(isCrmHost("crm.dingry.com")).toBe(false);
  });

  it("n'accepte que le host CRM exact", () => {
    vi.stubEnv("DINGRY_CRM_HOST", "crm.dingry.com");
    expect(isCrmHost("crm.dingry.com")).toBe(true);
    expect(isCrmHost("crm.dingry.com:3000")).toBe(true);
    expect(isCrmHost("evil-crm.dingry.com")).toBe(false);
    expect(isCrmHost("crm.dingry.com.evil.io")).toBe(false);
  });

  it("parse la liste des hosts boutique", () => {
    vi.stubEnv("DINGRY_SHOP_HOSTS", "dingry.com, www.dingry.com");
    expect(isShopHost("www.dingry.com")).toBe(true);
    expect(isShopHost("autre.com")).toBe(false);
  });
});

describe("chemins", () => {
  it("CRM : autorise admin, upload, statiques, well-known", () => {
    for (const p of [
      "/admin",
      "/admin/x",
      "/api/admin/y",
      "/api/upload",
      "/_next/static/a.js",
      "/.well-known/acme",
    ]) {
      expect(isCrmPermittedPath(p)).toBe(true);
    }
  });

  it("CRM : refuse la vitrine", () => {
    for (const p of ["/", "/checkout", "/api/catalog", "/api/paypal/webhook"]) {
      expect(isCrmPermittedPath(p)).toBe(false);
    }
  });

  it("isCrmOnlyPath couvre admin et upload", () => {
    expect(isCrmOnlyPath("/api/upload")).toBe(true);
    expect(isCrmOnlyPath("/administrateur")).toBe(false);
  });
});