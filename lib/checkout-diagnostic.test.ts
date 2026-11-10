import { describe, expect, it } from "vitest";
import { formatClientCheckoutError } from "@/lib/checkout-diagnostic";

describe("formatClientCheckoutError", () => {
  it("ajoute le code entre parenthèses", () => {
    expect(formatClientCheckoutError("Paiement indisponible.", "CHK-07")).toBe(
      "Paiement indisponible. (CHK-07)",
    );
  });

  it("sans code, message inchangé", () => {
    expect(formatClientCheckoutError("Commande invalide.", undefined)).toBe("Commande invalide.");
  });
});
