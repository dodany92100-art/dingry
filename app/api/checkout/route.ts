import Stripe from "stripe";
import { NextResponse } from "next/server";
import { loadStore } from "@/lib/admin/store";

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(secretKey);
}

const PRODUCT_PRICES: Record<number, number> = {
  1: 18900,
  2: 18900,
  3: 18900,
  4: 21900,
  5: 21900,
  6: 18900,
  7: 18900,
  8: 18900,
  9: 11900,
  10: 11900,
  11: 11900,
  12: 11900,
  13: 11900,
  14: 11900,
  15: 11900,
  16: 11900,
  17: 11900,
  18: 11900,
  19: 11900,
  20: 11900,
  21: 11900,
  22: 11900,
  23: 11900,
  24: 11900,
};

const PERSONALIZATION_SURCHARGE_CENTS = 500;
const PERSONALIZATION_MAX_LABEL_LENGTH = 28;

async function resolvePriceCents(productId: number): Promise<number | undefined> {
  try {
    const store = await loadStore();
    const product = store.products.find((item) => Number(item.id) === productId);
    if (product) return Math.round(product.price * 100);
  } catch {
    // fallback catalogue statique
  }
  return PRODUCT_PRICES[productId];
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const items = Array.isArray(body?.items) ? body.items : [];

    if (items.length === 0 || items.length > 50) {
      return NextResponse.json({ error: "Panier invalide." }, { status: 400 });
    }

    const lineItems = await Promise.all(items.map(async (item: {
      productId: number;
      name: string;
      size: string;
      quantity: number;
      personalization?: string;
    }) => {
      const productId = Number(item.productId);
      const quantity = Number(item.quantity);
      const basePrice = await resolvePriceCents(productId);
      const personalization =
        typeof item.personalization === "string"
          ? item.personalization.trim().slice(0, PERSONALIZATION_MAX_LABEL_LENGTH)
          : "";
      const hasPersonalization = personalization.length > 0;

      if (!basePrice || !Number.isInteger(quantity) || quantity < 1 || quantity > 99 || typeof item.size !== "string" || item.size.length > 10) {
        throw new Error("Article invalide.");
      }

      const unitAmount = basePrice + (hasPersonalization ? PERSONALIZATION_SURCHARGE_CENTS : 0);

      const description = hasPersonalization
        ? `Taille ${item.size} — Personnalisation : ${personalization}`
        : `Taille ${item.size}`;

      const name = hasPersonalization
        ? `${String(item.name || "DINGRY TEE").slice(0, 80)} — ${personalization}`
        : String(item.name || `DINGRY produit ${productId}`).slice(0, 120);

      return {
        quantity,
        price_data: {
          currency: "eur",
          unit_amount: unitAmount,
          product_data: {
            name,
            description: description.slice(0, 500),
          },
        },
      };
    }));

    const origin = request.headers.get("origin") ?? "http://localhost:3000";
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      locale: "fr",
      line_items: lineItems,
      success_url: `${origin}/?checkout=success`,
      cancel_url: `${origin}/?checkout=cancelled`,
      allowed_payment_method_types: ["card", "paypal"],
      payment_method_options: {
        paypal: {
          preferred_locale: "fr-FR",
        },
      },
      shipping_address_collection: {
        allowed_countries: [
          "FR",
          "BE",
          "CH",
          "LU",
          "DE",
          "ES",
          "IT",
          "PT",
          "NL",
          "GB",
          "IE",
          "AT",
        ],
      },
      integration_identifier: `dingry-checkout-${Math.random().toString(36).slice(2, 10)}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      console.error("[checkout]", error.message);
    }
    return NextResponse.json({ error: "Impossible de créer le paiement." }, { status: 400 });
  }
}
