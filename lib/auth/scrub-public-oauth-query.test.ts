import { describe, expect, it } from "vitest";
import { hasSupabaseOAuthQuery, searchWithoutOAuthQuery } from "@/lib/auth/scrub-public-oauth-query";

describe("scrub-public-oauth-query", () => {
  it("détecte et retire les paramètres OAuth", () => {
    const params = new URLSearchParams(
      "error=invalid_request&error_code=flow_state_already_used&next=%2Fwebsitedx",
    );
    expect(hasSupabaseOAuthQuery(params)).toBe(true);
    expect(searchWithoutOAuthQuery(params)).toBe("?next=%2Fwebsitedx");
  });
});
