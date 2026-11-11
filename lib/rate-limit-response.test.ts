import { describe, expect, it } from "vitest";
import { formatRetryAfterLabel, rateLimitMessage, retryAfterFromHeaders } from "@/lib/rate-limit-response";

describe("rate-limit-response", () => {
  it("formate les délais d'attente", () => {
    expect(formatRetryAfterLabel(1)).toContain("seconde");
    expect(formatRetryAfterLabel(90)).toContain("minute");
  });

  it("lit Retry-After", () => {
    const headers = new Headers({ "Retry-After": "42" });
    expect(retryAfterFromHeaders(headers)).toBe(42);
  });

  it("compose le message client 429", () => {
    expect(rateLimitMessage("Trop de tentatives.", 30)).toMatch(/30 secondes/);
  });
});
