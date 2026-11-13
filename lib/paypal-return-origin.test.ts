import { describe, expect, it, vi } from "vitest";
import { payPalReturnOrigin } from "@/lib/paypal-return-origin";

describe("payPalReturnOrigin", () => {
  it("utilise l'hôte de la requête en local", () => {
    const request = new Request("http://localhost:3000/api/checkout", {
      headers: { host: "localhost:3000" },
    });
    expect(payPalReturnOrigin(request)).toBe("http://localhost:3000");
  });

  it("utilise x-forwarded-host sur Vercel", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://www.dingry.com");
    const request = new Request("https://internal/api/checkout", {
      headers: {
        "x-forwarded-host": "dingry-git-main.vercel.app",
        "x-forwarded-proto": "https",
      },
    });
    expect(payPalReturnOrigin(request)).toBe("https://dingry-git-main.vercel.app");
    vi.unstubAllEnvs();
  });
});
