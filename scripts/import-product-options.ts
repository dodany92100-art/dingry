/**
 * Import bulk variantes → `product_options` (+ métadonnées parent DINGRY).
 * Usage : npm run import:product-options -- data/examples/dingry-product-options-import.json
 * Requiert SUPABASE_SERVICE_ROLE_KEY dans .env.local
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import {
  buildDingryVariantSku,
  buildVariantAltText,
  dingryProductSeoSlug,
  dingryR2VariantObjectKey,
  DINGRY_BRAND,
} from "../lib/catalog/dingry-variant-naming";
import { normalizeOptionKey } from "../lib/catalog/product-options";

config({ path: path.join(process.cwd(), ".env.local") });
config({ path: path.join(process.cwd(), ".env") });

type VariantImport = {
  option_key?: string;
  label?: string;
  color?: string;
  sku_suffix?: string;
  variant_sku?: string;
  price_delta?: number;
  image_url?: string;
  image_blob_pathname?: string;
  alt_text?: string;
  sort_order?: number;
  is_default?: boolean;
};

type ProductImport = {
  id: string;
  name: string;
  parent_sku: string;
  seo_slug?: string;
  fulfillment_mode?: "made_to_order" | "stocked";
  category?: string;
  variants: VariantImport[];
};

type ImportPayload = {
  brand?: string;
  products: ProductImport[];
};

function env(name: string): string {
  return (process.env[name] ?? "").trim();
}

function parsePayload(raw: unknown): ImportPayload {
  if (!raw || typeof raw !== "object") throw new Error("JSON racine invalide");
  const body = raw as Record<string, unknown>;
  if (!Array.isArray(body.products)) throw new Error("Champ products[] requis");
  return {
    brand: typeof body.brand === "string" ? body.brand : DINGRY_BRAND,
    products: body.products as ProductImport[],
  };
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const jsonArg = process.argv.find((a) => a.endsWith(".json")) ?? "data/examples/dingry-product-options-import.json";
  const absolutePath = path.resolve(process.cwd(), jsonArg);

  const supabaseUrl = env("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    console.error("❌ NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis.");
    process.exit(1);
  }

  const rawData = await readFile(absolutePath, "utf8");
  const payload = parsePayload(JSON.parse(rawData));
  const brand = payload.brand?.trim() || DINGRY_BRAND;

  console.log(`📂 ${absolutePath}${dryRun ? " (dry-run)" : ""}`);

  const supabase = createClient(supabaseUrl, serviceKey);

  for (const product of payload.products) {
    const productId = String(product.id).trim();
    if (!productId) continue;

    console.log(`\n📦 [${productId}] ${product.name}`);

    const { data: existing, error: fetchError } = await supabase
      .from("products")
      .select("id")
      .eq("id", productId)
      .maybeSingle();

    if (fetchError) {
      console.error("  ❌ lecture parent:", fetchError.message);
      continue;
    }
    if (!existing) {
      console.error("  ❌ parent absent en base — créer la fiche CRM d’abord (id text).");
      continue;
    }

    const seoSlug = product.seo_slug?.trim() || dingryProductSeoSlug(product.name, product.category);
    const parentPatch = {
      brand,
      seo_slug: seoSlug,
      fulfillment_mode: product.fulfillment_mode ?? "made_to_order",
    };

    if (!dryRun) {
      const { error: parentError } = await supabase.from("products").update(parentPatch).eq("id", productId);
      if (parentError) {
        console.error("  ❌ update parent:", parentError.message);
        continue;
      }
    }
    console.log(`  ✓ parent · seo_slug=${seoSlug}`);

    const colorDeclinations: string[] = [];
    const optionsRows: Record<string, unknown>[] = [];

    product.variants.forEach((variant, index) => {
      const rawColor = variant.color ?? variant.option_key ?? "";
      const optionKey = normalizeOptionKey(rawColor);
      if (!optionKey) return;

      const label = (variant.label ?? rawColor).trim().toUpperCase() || optionKey;
      colorDeclinations.push(label);

      const variantSku =
        variant.variant_sku?.trim().toUpperCase() ||
        buildDingryVariantSku(product.parent_sku, label);

      const altText = variant.alt_text?.trim() || buildVariantAltText(product.name, label);

      const imageBlobPathname =
        variant.image_blob_pathname?.trim() ||
        dingryR2VariantObjectKey(productId, product.name, label);

      optionsRows.push({
        product_id: productId,
        brand,
        option_key: optionKey,
        label,
        color: optionKey,
        sku_suffix: variant.sku_suffix?.trim().toUpperCase() || optionKey,
        variant_sku: variantSku,
        price_delta: variant.price_delta ?? 0,
        image_url: variant.image_url?.trim() ?? "",
        image_blob_pathname: imageBlobPathname,
        alt_text: altText,
        sort_order: variant.sort_order ?? index,
        is_default: Boolean(variant.is_default),
      });
    });

    if (optionsRows.length > 0 && !optionsRows.some((r) => r.is_default)) {
      optionsRows[0]!.is_default = true;
    }

    if (!dryRun && colorDeclinations.length > 0) {
      await supabase.from("products").update({ color_declinations: colorDeclinations }).eq("id", productId);
    }

    if (dryRun) {
      for (const row of optionsRows) {
        console.log(`  · ${row.variant_sku} (${row.option_key}) default=${String(row.is_default)}`);
      }
      continue;
    }

    const { error: deleteError } = await supabase.from("product_options").delete().eq("product_id", productId);
    if (deleteError && !deleteError.message.includes("schema cache")) {
      console.error("  ❌ purge options:", deleteError.message);
      continue;
    }

    if (optionsRows.length === 0) {
      console.log("  (aucune variante)");
      continue;
    }

    const { error: insertError } = await supabase.from("product_options").insert(optionsRows);
    if (insertError) {
      console.error("  ❌ insert options:", insertError.message);
      continue;
    }

    for (const row of optionsRows) {
      console.log(`  ✓ ${row.variant_sku}`);
    }
  }

  console.log("\n✨ Terminé.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
