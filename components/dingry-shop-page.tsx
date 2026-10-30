"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { DingryLogo } from "@/components/dingry-logo";
import { ProductCard } from "@/components/product-card";
import { ShopFooter } from "@/components/shop-footer";
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";
import { AnimatedTabs } from "@/components/ui/animated-tabs";
import { StickyScroll, type StickyScrollItem } from "@/components/ui/sticky-scroll-reveal";
import { Button } from "@/components/ui/button";
import { PayPalPaymentButton, type PayPalPaymentResult } from "@/components/paypal-payment-button";
import { overlayShopCatalog, shopProductFromUnknown, type ShopProduct } from "@/lib/catalog";
import {
  CATALOG_FILTER_LABEL,
  CATALOG_FILTERS,
  filterCatalogProducts,
  isRectoVersoShopCategory,
  parseCatalogFilter,
  type CatalogFilter,
} from "@/lib/shop-catalog";

import { DINGRY_PRODUCT_MEDIA } from "@/lib/dingry-product-media";
import { buildSweatCatalogPairs } from "@/lib/sweat-catalog-pairs";
import {
  isJerseyShopProduct,
  JERSEY_COLOR_OPTIONS,
  jerseyColorKeyFromProduct,
  resolveJerseyProduct,
  type JerseyColorKey,
} from "@/lib/jersey-shop";

const MODAL_OVERLAY_EASE = [0.16, 1, 0.3, 1] as const;
const MODAL_PANEL_SPRING = { type: "spring" as const, stiffness: 420, damping: 34, mass: 0.85 };

const IMAGES = {
  hero1: "https://res.cloudinary.com/dc9xmxpvv/image/upload/c_crop,g_north,h_1430,w_1960/v1793310395/014c39fa-7191-491e-a893-a58b934498dd_no55a0.jpg",
  editorial: "https://res.cloudinary.com/dc9xmxpvv/image/upload/v1793134245/IMG_4031_o8jpgl.jpg",
  hoodie1: "https://res.cloudinary.com/dc9xmxpvv/image/upload/v1793122066/HOODIE_DINGRY_ORIGINAL_BLEU_ROI_-_VERSO_xsoywe.png",
  hoodie2: "https://res.cloudinary.com/dc9xmxpvv/image/upload/v1793122066/HOODIE_DINGRY_ORIGINAL_BLEU_ROI_-_RECTO_m541tv.png",
  hoodie3: "https://res.cloudinary.com/dc9xmxpvv/image/upload/v1793122065/DINGRY_HOODIE_ORIGINAL_VERT_VERSO_g3tdgu.png",
  hoodie4: "https://res.cloudinary.com/dc9xmxpvv/image/upload/v1793122064/HOODIE_DINGRY_BLACK_ZIPPE%CC%81_OUTLINE_RECTO_iedtrv.png",
  hoodie5: "https://res.cloudinary.com/dc9xmxpvv/image/upload/v1793122064/HOODIE_DINGRY_BLACK_ZIPPE%CC%81_OUTLINE_VERSO_ljjxwj.png",
  hoodie6: "https://res.cloudinary.com/dc9xmxpvv/image/upload/v1793122064/DINGRY_HOODIE_ORIGINAL_BLACK_RECTO_knvlfw.png",
  hoodie7: "https://res.cloudinary.com/dc9xmxpvv/image/upload/v1793122063/DINGRY_HOODIE_ORIGINAL_VERT_RECTO_b4ilsd.png",
  hoodie8: "https://res.cloudinary.com/dc9xmxpvv/image/upload/v1793122061/DINGRY_-_HOODIE_ORIGINAL_BLACK_VERSO_llv6wk.png",
  cargo1: "https://images.unsplash.com/photo-1552902875-9ac1f9fe0c07?w=800&h=1000&fit=crop&auto=format",
  cargo2: "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=800&h=1000&fit=crop&auto=format",
  bomber1: "https://images.unsplash.com/photo-1660486044177-45cd45bb5e99?w=800&h=1000&fit=crop&auto=format",
  bomber2: "https://images.unsplash.com/photo-1577471444692-4e7c23b51ce4?w=800&h=1000&fit=crop&auto=format",
  cap1: "https://res.cloudinary.com/dc9xmxpvv/image/upload/v1793310306/99459ef5-5357-4aa7-adce-8ab461ca0370_obzc2o.jpg",
  cap2: "https://res.cloudinary.com/dc9xmxpvv/image/upload/v1793310306/acb2c9c8-a7d8-4a1b-96bb-c9d6bd131857_qfnvcu.jpg",
  jersey1: DINGRY_PRODUCT_MEDIA.jerseyWhite,
  sneaker1: "https://images.unsplash.com/photo-1568153487049-4431a8c15c20?w=800&h=1000&fit=crop&auto=format",
  sneaker2: "https://images.unsplash.com/photo-1763750581767-b367bcd6c117?w=800&h=1000&fit=crop&auto=format",
  tee1: DINGRY_PRODUCT_MEDIA.teeWhiteVerso,
  tee2: "https://res.cloudinary.com/dc9xmxpvv/image/upload/v1793124730/PHOTO-2026-06-26-22-50-57_2_pbdovu.jpg",
  tee3: "https://res.cloudinary.com/dc9xmxpvv/image/upload/v1793124729/PHOTO-2026-06-26-22-50-56_4_r3ivag.jpg",
  tee4: DINGRY_PRODUCT_MEDIA.teeWhiteRecto,
  tee5: "https://res.cloudinary.com/dc9xmxpvv/image/upload/v1793124728/PHOTO-2026-06-26-22-50-56_2_cxu50l.jpg",
  tee6: "https://res.cloudinary.com/dc9xmxpvv/image/upload/v1793124728/PHOTO-2026-06-26-22-50-56_tk3msx.jpg",
  tee7: "https://res.cloudinary.com/dc9xmxpvv/image/upload/v1793124727/PHOTO-2026-06-26-22-50-56_3_cnbjll.jpg",
  tee8: "https://res.cloudinary.com/dc9xmxpvv/image/upload/v1793124727/PHOTO-2026-06-26-22-50-56_6_dhs3l2.jpg",
  tee9: "https://res.cloudinary.com/dc9xmxpvv/image/upload/v1793124727/PHOTO-2026-06-26-22-50-56_7_iowqbr.jpg",
  tee10: "https://res.cloudinary.com/dc9xmxpvv/image/upload/v1793124726/PHOTO-2026-06-26-22-50-56_8_g8yqde.jpg",
  tee11: DINGRY_PRODUCT_MEDIA.teeBlackRecto,
  teeBlackVerso: DINGRY_PRODUCT_MEDIA.teeBlackVerso,
  tee12: "https://res.cloudinary.com/dc9xmxpvv/image/upload/v1793122204/WhatsApp_Image_2026-10-26_at_19.33.25_yzr0fb.jpg",
  tee13: "https://res.cloudinary.com/dc9xmxpvv/image/upload/v1793122204/WhatsApp_Image_2026-10-26_at_21.13.25_ypgmnf.jpg",
  hoodieParisBlackRecto: DINGRY_PRODUCT_MEDIA.hoodieParisBlackRecto,
  hoodieParisBlackVerso: DINGRY_PRODUCT_MEDIA.hoodieParisBlackVerso,
  hoodieParisGreyRecto: DINGRY_PRODUCT_MEDIA.hoodieParisGreyRecto,
  hoodieParisGreyVerso: DINGRY_PRODUCT_MEDIA.hoodieParisGreyVerso,
  hoodieParisWhiteRecto: DINGRY_PRODUCT_MEDIA.hoodieParisWhiteRecto,
  hoodieParisWhiteVerso: DINGRY_PRODUCT_MEDIA.hoodieParisWhiteVerso,
  hoodieRoyalBlueRecto: DINGRY_PRODUCT_MEDIA.hoodieRoyalBlueRecto,
  hoodieRoyalBlueVerso: DINGRY_PRODUCT_MEDIA.hoodieRoyalBlueVerso,
  sweatNeonYellowRecto: DINGRY_PRODUCT_MEDIA.sweatNeonYellowRecto,
  sweatNeonYellowVerso: DINGRY_PRODUCT_MEDIA.sweatNeonYellowVerso,
  sweatRoyalBlueRecto: DINGRY_PRODUCT_MEDIA.sweatRoyalBlueRecto,
  sweatRoyalBlueVerso: DINGRY_PRODUCT_MEDIA.sweatRoyalBlueVerso,
  sweatPurpleRecto: DINGRY_PRODUCT_MEDIA.sweatPurpleRecto,
  sweatPurpleVerso: DINGRY_PRODUCT_MEDIA.sweatPurpleVerso,
};

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

const PERSONALIZATION_SURCHARGE_EUR = 5;
const PERSONALIZATION_MAX_LABEL_LENGTH = 28;

/** Maquettes recto (devant) — même logique que la PJ Paris / Marseille / Lyon */
const PERSONALIZATION_SHIRTS = [
  { id: "noir", label: "Noir", image: IMAGES.tee11, cityTop: "57%", citySize: "clamp(0.55rem, 2.9vw, 0.82rem)" },
  { id: "vert", label: "Vert", image: IMAGES.tee8, cityTop: "53%", citySize: "clamp(0.65rem, 3.1vw, 0.95rem)" },
  { id: "rouge", label: "Rouge", image: IMAGES.tee9, cityTop: "53%", citySize: "clamp(0.65rem, 3.1vw, 0.95rem)" },
] as const;

const EDITORIAL_SCROLL_ITEMS: StickyScrollItem[] = [
  {
    title: "Chaque silhouette raconte l'attitude.",
    description:
      "DINGRY PARIS est une marque de streetwear française en plein développement, qui séduit un public toujours plus large grâce à une identité forte, un style affirmé et surtout un nom aussi original qu'universel.",
  },
  {
    title: "Rock the street.",
    description:
      "DINGRY, c'est peut-être l'un des meilleurs noms qu'une marque puisse porter aujourd'hui. Un mot populaire, utilisé par toutes les générations et toutes les classes sociales, qui reflète parfaitement notre époque. Son écriture singulière en fait une signature immédiatement reconnaissable.",
  },
];

/** Devant réel par collection (assets Cloudinary). */
const TEE_RECTO_IMAGE_BY_COLLECTION: Record<number, keyof typeof IMAGES> = {
  1: "tee4",
  3: "tee10",
  7: "tee8",
  9: "tee9",
  11: "tee11",
};

const TEE_RECTO_VARIANT_BY_COLLECTION: Record<number, string> = {
  1: "BLANC — RECTO",
  11: "NOIR — RECTO",
};

/** Dos du même modèle que le produit recto (id catalogue), pas collection n+1. */
const TEE_VERSO_BY_RECTO_ID: Record<
  number,
  { image: keyof typeof IMAGES; variant: string }
> = {
  11: { image: "tee1", variant: "BLANC — VERSO" },
  13: { image: "tee3", variant: "COLLECTION 03 — VERSO" },
  17: { image: "tee7", variant: "COLLECTION 07 — VERSO" },
  19: { image: "tee5", variant: "COLLECTION 09 — VERSO" },
  21: { image: "teeBlackVerso", variant: "NOIR — VERSO" },
};

const PRODUCTS: ShopProduct[] = [
  {
    id: 1,
    name: "PHANTOM HOODIE",
    variant: "NUIT NOIRE — VERSO",
    price: 189,
    image: IMAGES.hoodie1,
    description: "Coton lourd 480g, coupe oversize, capuche doublée. Finitions intérieures ton sur ton.",
    category: "Hoodie",
  },
  {
    id: 2,
    name: "PHANTOM HOODIE",
    variant: "ZENITH",
    price: 189,
    image: IMAGES.hoodie2,
    description: "Même coupe que la Nuit Noire. Coloris exclusive, édition numérotée 200 exemplaires.",
    category: "Hoodie",
  },
  {
    id: 3,
    name: "DINGRY ORIGINAL HOODIE",
    variant: "VERT — VERSO",
    price: 189,
    image: IMAGES.hoodie3,
    description: "Coton lourd, coupe oversize et signature DINGRY au dos.",
    category: "Hoodie",
  },
  {
    id: 4,
    name: "DINGRY ZIP HOODIE",
    variant: "BLACK OUTLINE — RECTO",
    price: 219,
    image: IMAGES.hoodie4,
    description: "Hoodie zippé noir, silhouette structurée et détails outline.",
    category: "Hoodie zippé",
  },
  {
    id: 5,
    name: "DINGRY ZIP HOODIE",
    variant: "BLACK OUTLINE — VERSO",
    price: 219,
    image: IMAGES.hoodie5,
    description: "Vue dos du hoodie zippé signature, édition limitée.",
    category: "Hoodie zippé",
  },
  {
    id: 6,
    name: "DINGRY ORIGINAL HOODIE",
    variant: "BLACK — RECTO",
    price: 189,
    image: IMAGES.hoodie6,
    description: "Le hoodie original DINGRY en noir, coupe oversize.",
    category: "Hoodie",
  },
  {
    id: 7,
    name: "DINGRY ORIGINAL HOODIE",
    variant: "VERT — RECTO",
    price: 189,
    image: IMAGES.hoodie7,
    description: "Le modèle original en vert, pensé pour la rue.",
    category: "Hoodie",
  },
  {
    id: 8,
    name: "DINGRY ORIGINAL HOODIE",
    variant: "BLACK — VERSO",
    price: 189,
    image: IMAGES.hoodie8,
    description: "Vue dos du hoodie original noir DINGRY.",
    category: "Hoodie",
  },
  ...Array.from({ length: 11 }, (_, index) => {
    const collection = index + 1;
    const inCatalog = collection in TEE_RECTO_IMAGE_BY_COLLECTION;
    const defaultKey = `tee${index + 1}` as keyof typeof IMAGES;
    const imageKey = inCatalog ? TEE_RECTO_IMAGE_BY_COLLECTION[collection] : defaultKey;
    const rectoVariant =
      TEE_RECTO_VARIANT_BY_COLLECTION[collection] ??
      `COLLECTION ${String(collection).padStart(2, "0")} — RECTO`;
    return {
      id: 11 + index,
      name: "DINGRY TEE",
      variant: inCatalog ? rectoVariant : `COLLECTION ${String(collection).padStart(2, "0")} — VERSO`,
      price: 119,
      image: IMAGES[imageKey],
      description: "",
      category: "T-shirts",
    };
  }),
  {
    id: 22,
    name: "DINGRY TEE FEMME",
    variant: "ORIGINAL — RECTO",
    price: 119,
    image: IMAGES.tee12,
    description: "",
    category: "T-shirts",
  },
  {
    id: 23,
    name: "DINGRY TEE FEMME",
    variant: "SIGNATURE — RECTO",
    price: 119,
    image: IMAGES.tee13,
    description: "",
    category: "T-shirts",
  },
  {
    id: 24,
    name: "DINGRY TEE",
    variant: "PERSONNALISÉ — RECTO",
    price: 119,
    image: IMAGES.tee11,
    description: "T-shirt noir personnalisable — ville ou texte sous le logo (+5€).",
    category: "T-shirts",
  },
  {
    id: 25,
    name: "HOODIE BLACK PARIS BACK-LOGO",
    variant: "NOIR PARIS — RECTO",
    price: 189,
    image: IMAGES.hoodieParisBlackRecto,
    description:
      "Hoodie noir avec logo DINGRY Paris sur la poitrine, éclairs sur les manches et grand print vertical DINGRY au dos.",
    category: "Hoodie",
  },
  {
    id: 26,
    name: "HOODIE BLACK PARIS BACK-LOGO",
    variant: "NOIR PARIS — VERSO",
    price: 189,
    image: IMAGES.hoodieParisBlackVerso,
    description: "",
    category: "Hoodie",
  },
  {
    id: 27,
    name: "HOODIE GREY PARIS BACK-LOGO",
    variant: "GRIS PARIS — RECTO",
    price: 189,
    image: IMAGES.hoodieParisGreyRecto,
    description:
      "Hoodie gris chiné avec logo DINGRY Paris rouge sur la poitrine, éclairs sur les manches et grand print vertical DINGRY au dos.",
    category: "Hoodie",
  },
  {
    id: 28,
    name: "HOODIE GREY PARIS BACK-LOGO",
    variant: "GRIS PARIS — VERSO",
    price: 189,
    image: IMAGES.hoodieParisGreyVerso,
    description: "",
    category: "Hoodie",
  },
  {
    id: 29,
    name: "HOODIE CHOCOLAT PARIS",
    variant: "CHOCOLAT PARIS — RECTO",
    price: 189,
    image: IMAGES.hoodieRoyalBlueRecto,
    description: "Hoodie chocolat à capuche, logo DINGRY Paris sur la poitrine et éclairs sur les manches.",
    category: "Hoodie",
  },
  {
    id: 30,
    name: "HOODIE CHOCOLAT PARIS",
    variant: "CHOCOLAT PARIS — VERSO",
    price: 189,
    image: IMAGES.hoodieRoyalBlueVerso,
    description: "",
    category: "Hoodie",
  },
  {
    id: 35,
    name: "HOODIE WHITE PARIS BACK-LOGO",
    variant: "BLANC PARIS — RECTO",
    price: 189,
    image: IMAGES.hoodieParisWhiteRecto,
    description:
      "Hoodie blanc avec logo DINGRY Paris sur la poitrine, éclairs sur les manches et grand print vertical DINGRY au dos.",
    category: "Hoodie",
  },
  {
    id: 36,
    name: "HOODIE WHITE PARIS BACK-LOGO",
    variant: "BLANC PARIS — VERSO",
    price: 189,
    image: IMAGES.hoodieParisWhiteVerso,
    description: "",
    category: "Hoodie",
  },
  {
    id: 31,
    name: "SWEAT NEON YELLOW PARIS",
    variant: "JAUNE FLUO — RECTO",
    price: 169,
    image: IMAGES.sweatNeonYellowRecto,
    description: "Sweat col rond jaune fluo sans capuche, logo DINGRY Paris noir sur la poitrine.",
    category: "Sweats",
  },
  {
    id: 32,
    name: "SWEAT NEON YELLOW PARIS",
    variant: "JAUNE FLUO — VERSO",
    price: 169,
    image: IMAGES.sweatNeonYellowVerso,
    description: "",
    category: "Sweats",
  },
  {
    id: 33,
    name: "SWEAT ROYAL BLUE RETRO",
    variant: "ROYAL BLUE — RECTO",
    price: 169,
    image: IMAGES.sweatRoyalBlueRecto,
    description: "Sweat col rond bleu royal sans capuche, écriture Dingry jaune style rétro sur la poitrine.",
    category: "Sweats",
  },
  {
    id: 34,
    name: "SWEAT ROYAL BLUE RETRO",
    variant: "ROYAL BLUE — VERSO",
    price: 169,
    image: IMAGES.sweatRoyalBlueVerso,
    description: "",
    category: "Sweats",
  },
  {
    id: 39,
    name: "CREWNECK DINGRY PURPLE",
    variant: "PURPLE — RECTO",
    price: 169,
    image: IMAGES.sweatPurpleRecto,
    description: "Sweat col rond violet sans capuche, logo DINGRY Paris rose sur la poitrine et éclair sur la manche.",
    category: "Sweats",
  },
  {
    id: 40,
    name: "CREWNECK DINGRY PURPLE",
    variant: "PURPLE — VERSO",
    price: 169,
    image: IMAGES.sweatPurpleVerso,
    description: "",
    category: "Sweats",
  },
  {
    id: 37,
    name: "CASQUETTE DINGRY",
    variant: "NOIR",
    price: 45,
    image: IMAGES.cap1,
    description: "Casquette noire, logo DINGRY blanc sur l'avant et marque sur la bride.",
    category: "Caps",
    sizes: ["TU"],
  },
  {
    id: 38,
    name: "CASQUETTE DINGRY",
    variant: "ROUGE",
    price: 45,
    image: IMAGES.cap2,
    description: "Casquette rouge, logo DINGRY blanc sur l'avant et marque sur la bride.",
    category: "Caps",
    sizes: ["TU"],
  },
  {
    id: 41,
    name: "JERSEY DINGRY",
    variant: "BLANC",
    price: 129,
    image: DINGRY_PRODUCT_MEDIA.jerseyWhite,
    description: "Jersey mesh blanc, logo DINGRY Paris noir sur la poitrine et éclairs sur les manches.",
    category: "Jersey",
  },
  {
    id: 42,
    name: "JERSEY DINGRY",
    variant: "NOIR",
    price: 129,
    image: DINGRY_PRODUCT_MEDIA.jerseyBlack,
    description: "Jersey mesh noir, logo DINGRY Paris sur la poitrine et éclairs sur les manches.",
    category: "Jersey",
  },
  ];

type CartItem = {
  product: ShopProduct;
  size: string;
  qty: number;
  personalization?: string;
};

type OrderConfirmation = {
  orderId: string;
  payerName: string;
  email: string;
  total: number;
  items: string[];
  shippingName: string;
  shippingAddress: string;
};

function cartItemUnitPrice(item: CartItem): number {
  return item.product.price + (item.personalization ? PERSONALIZATION_SURCHARGE_EUR : 0);
}

export default function App() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [products, setProducts] = useState<ShopProduct[]>(PRODUCTS);
  const [selectedProduct, setSelectedProduct] = useState<ShopProduct | null>(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [orderConfirmation, setOrderConfirmation] = useState<OrderConfirmation | null>(null);
  const [paymentToastVisible, setPaymentToastVisible] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeFilter = parseCatalogFilter(searchParams.get("category"));
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [headerHidden, setHeaderHidden] = useState(false);
  const [modalSide, setModalSide] = useState<"recto" | "verso">("recto");
  const [jerseyColor, setJerseyColor] = useState<JerseyColorKey>("BLANC");
  const [personalizeOpen, setPersonalizeOpen] = useState(false);
  const [personalizeLabel, setPersonalizeLabel] = useState("PARIS");
  const [personalizeSize, setPersonalizeSize] = useState("");
  const [personalizeQty, setPersonalizeQty] = useState(1);
  const [personalizeShirtId, setPersonalizeShirtId] = useState<(typeof PERSONALIZATION_SHIRTS)[number]["id"]>("noir");
  const pageScrollRef = useRef<HTMLDivElement>(null);
  const productModalRef = useRef<HTMLDivElement>(null);
  const productImageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("dingry-theme");
    const next = saved === "dark" ? "dark" : "light";
    setTheme(next);
    document.documentElement.dataset.theme = next;
  }, []);

  function setThemeMode(next: "light" | "dark") {
    setTheme(next);
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem("dingry-theme", next);
  }

  useEffect(() => {
    let cancelled = false;
    async function loadCatalog() {
      try {
        const response = await fetch("/api/catalog", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { products?: unknown };
        const live = Array.isArray(data.products)
          ? data.products
              .map(shopProductFromUnknown)
              .filter((item): item is NonNullable<typeof item> => item !== null)
          : [];
        if (!cancelled && live.length > 0) {
          setProducts(overlayShopCatalog(PRODUCTS, live));
        }
      } catch {
        // catalogue statique
      }
    }
    void loadCatalog();
    return () => {
      cancelled = true;
    };
  }, []);

  function selectCatalogFilter(next: CatalogFilter) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "all") params.delete("category");
    else params.set("category", next);
    const query = params.toString();
    router.replace(query ? `/?${query}` : "/", { scroll: false });
  }

  const skipCatalogScroll = useRef(true);
  useEffect(() => {
    if (skipCatalogScroll.current) {
      skipCatalogScroll.current = false;
      return;
    }
    const scroller = pageScrollRef.current;
    const landing = document.getElementById("catalogue-landing");
    if (!scroller || !landing) return;
    const top =
      landing.getBoundingClientRect().top -
      scroller.getBoundingClientRect().top +
      scroller.scrollTop;
    scroller.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }, [activeFilter]);

  function handlePageScroll() {
    const scroller = pageScrollRef.current;
    if (!scroller) return;
    const hidden = scroller.scrollTop > 8;
    setHeaderHidden((current) => (current === hidden ? current : hidden));
  }

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => s + cartItemUnitPrice(i) * i.qty, 0);
  const personalizationProduct = products.find((p) => p.id === 24) ?? PRODUCTS.find((p) => p.id === 24);
  const personalizePreviewLabel = personalizeLabel.trim().slice(0, PERSONALIZATION_MAX_LABEL_LENGTH).toUpperCase() || "PARIS";
  const personalizeShirt =
    PERSONALIZATION_SHIRTS.find((s) => s.id === personalizeShirtId) ?? PERSONALIZATION_SHIRTS[0];

  const filtered = filterCatalogProducts(products, activeFilter);

  function addToCart() {
    if (!selectedProduct || !selectedSize) return;
    const checkoutProduct = isJerseyShopProduct(selectedProduct)
      ? resolveJerseyProduct(products, jerseyColor) ?? selectedProduct
      : selectedProduct;
    setCart((prev) => {
      const existing = prev.find(
        (i) => i.product.id === checkoutProduct.id && i.size === selectedSize && !i.personalization,
      );
      if (existing) return prev.map((i) => i === existing ? { ...i, qty: i.qty + selectedQuantity } : i);
      return [...prev, { product: checkoutProduct, size: selectedSize, qty: selectedQuantity }];
    });
    setSelectedProduct(null);
    setSelectedSize("");
    setSelectedQuantity(1);
    setCartOpen(true);
  }

  function addPersonalizedToCart() {
    if (!personalizationProduct || !personalizeSize) return;
    const label = personalizeLabel.trim().slice(0, PERSONALIZATION_MAX_LABEL_LENGTH);
    if (!label) return;
    const persoLine = `${label} — ${personalizeShirt.label} (recto)`;
    setCart((prev) => {
      const existing = prev.find(
        (i) => i.product.id === 24 && i.size === personalizeSize && i.personalization === persoLine,
      );
      if (existing) return prev.map((i) => i === existing ? { ...i, qty: i.qty + personalizeQty } : i);
      return [
        ...prev,
        {
          product: personalizationProduct,
          size: personalizeSize,
          qty: personalizeQty,
          personalization: persoLine,
        },
      ];
    });
    setPersonalizeOpen(false);
    setCartOpen(true);
  }

  function removeFromCart(idx: number) {
    setCart((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateCartQuantity(idx: number, delta: number) {
    setCart((prev) => prev.flatMap((item, i) => {
      if (i !== idx) return [item];
      const nextQty = item.qty + delta;
      return nextQty > 0 ? [{ ...item, qty: nextQty }] : [];
    }));
  }

  async function handlePayPalPaid(payment: PayPalPaymentResult) {
    const items = cart.map((item) => {
      const detail = item.personalization ? `${item.product.name} — ${item.personalization}` : item.product.name;
      return `${detail} — ${item.size} ×${item.qty}`;
    });
    const total = payment.total > 0 ? payment.total : cartTotal;

    try {
      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: payment.orderId,
          payerName: payment.payerName,
          email: payment.email,
          total,
          items,
          shippingName: payment.shippingName,
          shippingAddress: payment.shippingAddress,
        }),
      });
    } catch {
      // Paiement déjà capturé côté PayPal.
    }

    setOrderConfirmation({
      orderId: payment.orderId,
      payerName: payment.payerName,
      email: payment.email,
      total,
      items,
      shippingName: payment.shippingName,
      shippingAddress: payment.shippingAddress,
    });
    setCart([]);
    setPaymentToastVisible(true);
    setCartOpen(true);
    window.setTimeout(() => setPaymentToastVisible(false), 6500);
  }

  const heroImages = [IMAGES.hero1];
  const hoodiePairs = [
    { id: 8, color: "Chocolat Paris", reference: "DINGRY-H08", versoId: 30, rectoId: 29 },
    { id: 9, color: "Blanc Paris", reference: "DINGRY-H09", versoId: 36, rectoId: 35 },
    { id: 5, color: "Gris Paris", reference: "DINGRY-H05", versoId: 28, rectoId: 27 },
    // Collection originale
    { id: 1, color: "Bleu roi", reference: "DINGRY-H01", versoId: 1, rectoId: 2 },
    { id: 2, color: "Vert original", reference: "DINGRY-H02", versoId: 3, rectoId: 7 },
    { id: 4, color: "Noir original", reference: "DINGRY-H04", versoId: 8, rectoId: 6 },
    { id: 3, color: "Noir zippé outline", reference: "DINGRY-H03", versoId: 5, rectoId: 4 },
  ].flatMap((pair) => {
    const recto =
      products.find((item) => item.id === pair.rectoId) ??
      PRODUCTS.find((item) => item.id === pair.rectoId);
    const verso =
      products.find((item) => item.id === pair.versoId) ??
      PRODUCTS.find((item) => item.id === pair.versoId);
    if (!recto || !verso) return [];
    return [{ ...pair, recto, verso }];
  });

  const sweatPairs = buildSweatCatalogPairs(products, PRODUCTS);

  const flipCatalogPairs = [...hoodiePairs, ...sweatPairs];
  const activeFlipPair =
    selectedProduct && isRectoVersoShopCategory(selectedProduct.category)
      ? flipCatalogPairs.find(
          (pair) => pair.verso.id === selectedProduct.id || pair.recto.id === selectedProduct.id,
        )
      : undefined;

  const teeVersoMeta = selectedProduct ? TEE_VERSO_BY_RECTO_ID[selectedProduct.id] : undefined;
  const showModalSideToggle = Boolean(activeFlipPair || teeVersoMeta);
  const isJerseyModal = selectedProduct !== null && isJerseyShopProduct(selectedProduct);
  const jerseyCheckoutProduct =
    isJerseyModal && selectedProduct
      ? resolveJerseyProduct(products, jerseyColor) ?? selectedProduct
      : null;

  const activeModalView = (() => {
    if (!selectedProduct) return null;
    if (activeFlipPair) {
      return modalSide === "verso" ? activeFlipPair.verso : activeFlipPair.recto;
    }
    if (teeVersoMeta && modalSide === "verso") {
      return {
        ...selectedProduct,
        image: IMAGES[teeVersoMeta.image],
        variant: teeVersoMeta.variant,
        description: "",
      };
    }
    if (jerseyCheckoutProduct) return jerseyCheckoutProduct;
    return selectedProduct;
  })();

  function openProductModal(product: ShopProduct) {
    setSelectedProduct(product);
    setSelectedSize("");
    setModalSide("recto");
    if (isJerseyShopProduct(product)) {
      setJerseyColor(jerseyColorKeyFromProduct(product));
    }
  }

  function showProductSide(side: "recto" | "verso") {
    setModalSide(side);
    if (side !== "verso") return;
    window.requestAnimationFrame(() => {
      const image = productImageRef.current;
      const modal = productModalRef.current;
      if (!image || !modal) return;
      const top = image.getBoundingClientRect().top - modal.getBoundingClientRect().top + modal.scrollTop;
      modal.scrollTo({ top, behavior: "smooth" });
    });
  }

  function scrollToSection(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }

  const renderProductCard = (product: ShopProduct) => (
    <ProductCard
      key={product.id}
      name={product.name}
      variant={product.variant}
      description={product.description}
      image={product.image}
      price={product.price}
      onClick={() => openProductModal(product)}
    />
  );

  return (
    <div className="dingry-shop relative h-dvh overflow-hidden text-white" style={{ fontFamily: "'Archivo Black', 'Arial Black', sans-serif" }}>
      <BackgroundGradientAnimation />
      <nav
        className={`fixed top-0 left-0 right-0 z-50 border-b border-white/[0.08] bg-[#12151c] backdrop-blur-md transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform ${headerHidden ? "pointer-events-none -translate-y-full opacity-0" : "translate-y-0 opacity-100"}`}
      >
        <div className="flex items-center justify-between px-4 py-2.5 md:px-12 md:py-5">
          <div className="flex items-center gap-8">
            <button
              type="button"
              onClick={() => scrollToSection("catalogue")}
              className="text-xs tracking-[0.25em] text-white/40 uppercase hidden md:block hover:text-white transition-colors"
            >
              Catalogue
            </button>
          </div>
          <a href="/" className="flex items-center [perspective:900px]" aria-label="DINGRY Paris">
            <DingryLogo animate />
          </a>
          <div className="flex items-center gap-6">
            <span className="text-xs tracking-[0.2em] text-white/40 uppercase hidden md:block">Paris</span>
            <div className="flex rounded-full border border-current/25 p-0.5 text-[10px] font-medium tracking-[0.14em] uppercase" role="group" aria-label="Mode d'affichage">
              <button
                type="button"
                onClick={() => setThemeMode("light")}
                aria-pressed={theme === "light"}
                className={`rounded-full px-2.5 py-1 transition-colors ${theme === "light" ? "bg-[#0066FF] text-white" : "text-current/70"}`}
              >
                Day
              </button>
              <button
                type="button"
                onClick={() => setThemeMode("dark")}
                aria-pressed={theme === "dark"}
                className={`rounded-full px-2.5 py-1 transition-colors ${theme === "dark" ? "bg-[#0066FF] text-white" : "text-current/70"}`}
              >
                Night
              </button>
            </div>
            <button
              onClick={() => setCartOpen(true)}
              className="relative flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-white/80 hover:text-white transition-colors duration-300"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-2.5 -right-2.5 w-4 h-4 bg-[#0066FF] flex items-center justify-center text-[10px] font-bold text-white rounded-none">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>
      <div
        ref={pageScrollRef}
        className="dingry-page relative z-10 h-full overflow-y-auto bg-transparent [overflow-anchor:none]"
        onScroll={handlePageScroll}
      >

      <div className="flex min-h-dvh flex-col">
        <div className="dingry-hero-offset h-[49px] shrink-0 bg-[#050505] md:h-[85px]" aria-hidden />

      {/* HERO */}
      <section className="dingry-hero relative w-full max-md:min-h-0 max-md:flex-1 max-md:overflow-hidden">
        {heroImages.map((img) => (
          <img
            key={img}
            src={img}
            alt="DINGRY editorial"
            className="block h-auto w-full max-md:absolute max-md:inset-0 max-md:h-full max-md:object-cover max-md:object-center"
          />
        ))}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#050505]/60 via-transparent to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/20 to-transparent" />

        <div className="absolute bottom-16 left-8 md:left-16 max-w-xl">
          <h1 className="text-5xl md:text-7xl font-bold leading-[0.9] tracking-tight uppercase mb-6">
            LE LUXE EST<br />DANS L&apos;ATTITUDE
          </h1>
          <p className="text-sm text-white/50 tracking-wider mb-10 leading-relaxed">
            Chaque pièce est une déclaration. Éditions limitées.
          </p>
        </div>

      </section>
      </div>

      {/* TICKER */}
      <div id="catalogue-landing" className="dingry-catalog-strip">
        <div className="dingry-catalog-strip-fade dingry-catalog-strip-fade--top" aria-hidden />
        <div className="dingry-catalog-strip-track py-3 overflow-hidden">
          <div className="flex w-max gap-16 animate-marquee whitespace-nowrap">
            {Array(2).fill(null).map((_, i) => (
              <span key={i} className="shrink-0 text-[11px] font-semibold tracking-[0.28em] uppercase text-white">
                ROCK THE STREET &nbsp;•&nbsp; DINGRY OFFICIEL &nbsp;•&nbsp; LIVRAISON OFFERTE &nbsp;•&nbsp; PERSONNALISER VOTRE T-SHIRT &nbsp;•&nbsp; @dingry_officiel &nbsp;•&nbsp;
              </span>
            ))}
          </div>
        </div>
        <div className="dingry-catalog-strip-fade dingry-catalog-strip-fade--bottom" aria-hidden />
      </div>

      {/* CATALOGUE */}
      <section id="catalogue" className="dingry-catalog-surface px-4 pb-20 md:px-12 md:pb-24">
        <div className="mb-2 md:mb-3">
          <h2 className="text-2xl font-bold tracking-tight uppercase md:text-4xl">DINGRY Catalogue</h2>
        </div>

        {/* Filters */}
        <div className="dingry-catalog-bar sticky top-0 z-40 -mx-4 mb-8 border-b border-white/15 bg-[#12151c]/50 px-4 py-3 shadow-[inset_0_1px_0_rgb(255_255_255/0.16)] backdrop-blur-2xl backdrop-saturate-150 md:mb-12 md:mx-0 md:px-0">
          <AnimatedTabs
            tabs={[...CATALOG_FILTERS]}
            value={activeFilter}
            onValueChange={(tab) => selectCatalogFilter(parseCatalogFilter(tab))}
            layoutId="dingry-catalog-tabs"
            aria-label="Catégories du catalogue"
            variant="underline"
            labelForTab={(tab) => CATALOG_FILTER_LABEL[parseCatalogFilter(tab)]}
            endAction={
              <button
                type="button"
                onClick={() => setPersonalizeOpen(true)}
                className="rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-[10px] font-medium tracking-[0.18em] uppercase text-white/75 transition-colors hover:border-[#0066FF]/45 hover:text-white active:scale-[0.97]"
              >
                Perso
              </button>
            }
          />
        </div>

        {/* Grid */}
        <motion.div
          key={activeFilter}
          initial={{ opacity: 0.5, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: MODAL_OVERLAY_EASE }}
          className="grid grid-cols-2 gap-2.5 md:grid-cols-3 md:gap-4 lg:grid-cols-4"
        >
          {filtered.length > 0 ? (
            filtered.map(renderProductCard)
          ) : (
            <div className="col-span-full border border-white/[0.06] py-20 text-center">
              <p className="text-[10px] tracking-[0.35em] text-[#0066FF] uppercase mb-4">Bientôt disponible</p>
              <p className="text-sm text-white/40 tracking-wider">Cette catégorie sera bientôt disponible dans le catalogue.</p>
            </div>
          )}
        </motion.div>
      </section>

      {/* EDITORIAL STRIP */}
      <section className="dingry-below-hero-surface border-t border-white/[0.05] px-6 md:px-12 py-12 md:py-16">
        <p className="mb-8 text-[10px] font-semibold tracking-[0.35em] text-[#0066FF] uppercase md:mb-10">
          DINGRY Rock The Street
        </p>
        <StickyScroll
          scrollContainerRef={pageScrollRef}
          items={EDITORIAL_SCROLL_ITEMS}
          stickyPanel={
            <div className="relative w-full">
              <img
                src={IMAGES.editorial}
                alt="DINGRY editorial"
                className="block h-auto w-full object-contain object-center"
                style={{ filter: "brightness(0.75) contrast(1.1) grayscale(0.4)" }}
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050505]/30 via-transparent to-transparent" />
            </div>
          }
        />
      </section>

      <ShopFooter />

      {/* PERSONNALISATION MODAL */}
      <AnimatePresence>
        {personalizeOpen ? (
        <div
          key="dingry-personalize-modal"
          className="fixed inset-0 z-[65] flex items-center justify-center p-4 md:p-8"
        >
          <motion.div
            className="absolute inset-0 bg-[#050505]/90 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: MODAL_OVERLAY_EASE }}
            onClick={() => setPersonalizeOpen(false)}
          />
          <motion.div
            className="relative z-10 bg-[#0a0a0a] border border-white/[0.06] w-full max-w-5xl max-h-[92vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.96, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            transition={MODAL_PANEL_SPRING}
          >
            <button
              type="button"
              onClick={() => setPersonalizeOpen(false)}
              className="absolute top-5 right-5 z-20 w-11 h-11 flex items-center justify-center text-white/40 hover:text-white transition-colors"
              aria-label="Fermer"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
            <div className="p-8 md:p-10 border-b border-white/[0.06]">
              <p className="text-[10px] tracking-[0.35em] text-[#0066FF] uppercase mb-2">Studio</p>
              <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-tight pr-12">
                À chaque ville sa DINGRY
              </h2>
            </div>
            <div className="p-8 md:p-10 grid md:grid-cols-2 gap-10 md:gap-12 items-start">
              <div className="relative mx-auto w-full max-w-xs" style={{ aspectRatio: "3/4" }}>
                <img
                  src={personalizeShirt.image}
                  alt={`Tee ${personalizeShirt.label} — vue recto`}
                  className="w-full h-full object-cover"
                  style={{ filter: "brightness(0.92) contrast(1.05)" }}
                />
                <div
                  className="dingry-personalize-city pointer-events-none absolute left-1/2 -translate-x-1/2 text-center uppercase"
                  style={{
                    top: personalizeShirt.cityTop,
                    width: "78%",
                    fontSize: personalizeShirt.citySize,
                  }}
                  aria-live="polite"
                >
                  {personalizePreviewLabel}
                </div>
                <p className="absolute top-3 left-0 right-0 text-center text-[9px] tracking-[0.25em] text-white/60 uppercase">
                  Vue recto — sous le logo
                </p>
                <p className="absolute bottom-3 left-0 right-0 text-center text-[9px] tracking-[0.3em] text-white/45 uppercase">
                  Simulation indicative
                </p>
              </div>
              <div className="flex flex-col gap-6">
                <div>
                  <p className="text-sm text-white/70 leading-relaxed mb-1">
                    Choisis ta ville et personnalise ton DINGRY
                  </p>
                  <p className="text-sm text-white/45">
                    Personnalisation possible, {PERSONALIZATION_SURCHARGE_EUR}€ par article.
                  </p>
                </div>
                <div>
                  <p className="text-[10px] tracking-[0.3em] text-white/40 uppercase mb-3">Couleur du tee</p>
                  <div className="flex flex-wrap gap-2">
                    {PERSONALIZATION_SHIRTS.map((shirt) => (
                      <button
                        key={shirt.id}
                        type="button"
                        onClick={() => setPersonalizeShirtId(shirt.id)}
                        className={`px-4 py-2 text-[11px] tracking-[0.2em] uppercase border transition-colors ${
                          personalizeShirtId === shirt.id
                            ? "bg-[#0066FF] border-[#0066FF] text-white"
                            : "border-white/15 text-white/50 hover:border-white/40 hover:text-white"
                        }`}
                      >
                        {shirt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="block">
                  <span className="text-[10px] tracking-[0.3em] text-white/40 uppercase mb-2 block">Ville, pays ou texte</span>
                  <input
                    type="text"
                    value={personalizeLabel}
                    onChange={(e) => setPersonalizeLabel(e.target.value.slice(0, PERSONALIZATION_MAX_LABEL_LENGTH))}
                    placeholder="Ville, Pays"
                    className="w-full rounded-full border border-white/20 bg-[#080808] px-5 py-3.5 text-sm text-white placeholder:text-white/30 focus:border-[#0066FF] focus:outline-none"
                    maxLength={PERSONALIZATION_MAX_LABEL_LENGTH}
                  />
                </label>
                <div>
                  <p className="text-[10px] tracking-[0.3em] text-white/40 uppercase mb-3">Taille</p>
                  <div className="grid grid-cols-6 gap-2">
                    {SIZES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setPersonalizeSize(s)}
                        className={`py-2.5 text-xs font-medium tracking-widest border transition-all duration-200 ${
                          personalizeSize === s
                            ? "bg-[#0066FF] border-[#0066FF] text-white"
                            : "border-white/10 text-white/50 hover:border-white/30 hover:text-white"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between border-y border-white/[0.08] py-4">
                  <span className="text-[10px] tracking-[0.3em] text-white/40 uppercase">Quantité</span>
                  <div className="flex items-center border border-white/15">
                    <button
                      type="button"
                      onClick={() => setPersonalizeQty((q) => Math.max(1, q - 1))}
                      className="w-9 h-9 text-white/60 hover:bg-white hover:text-black transition-colors"
                      aria-label="Diminuer la quantité"
                    >−</button>
                    <span className="w-10 text-center text-sm">{personalizeQty}</span>
                    <button
                      type="button"
                      onClick={() => setPersonalizeQty((q) => Math.min(99, q + 1))}
                      className="w-9 h-9 text-white/60 hover:bg-white hover:text-black transition-colors"
                      aria-label="Augmenter la quantité"
                    >+</button>
                  </div>
                </div>
                <p className="text-lg font-bold">
                  {(personalizationProduct?.price ?? 119) + PERSONALIZATION_SURCHARGE_EUR}€{" "}
                  <span className="text-xs font-normal text-white/40 tracking-wider">({personalizationProduct?.price ?? 119}€ + {PERSONALIZATION_SURCHARGE_EUR}€ perso.)</span>
                </p>
                <button
                  type="button"
                  onClick={addPersonalizedToCart}
                  disabled={!personalizeSize || !personalizeLabel.trim()}
                  className={`w-full py-4 text-xs font-bold tracking-[0.3em] uppercase transition-all duration-300 ${
                    personalizeSize && personalizeLabel.trim()
                      ? "bg-white text-[#050505] hover:bg-[#0066FF] hover:text-white"
                      : "bg-white/10 text-white/20 cursor-not-allowed"
                  }`}
                >
                  Ajouter au panier
                </button>
              </div>
            </div>
          </motion.div>
        </div>
        ) : null}
      </AnimatePresence>

      {/* PRODUCT MODAL */}
      <AnimatePresence>
        {selectedProduct ? (
        <div
          key="dingry-product-modal"
          className="dingry-sale fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-12"
        >
          <motion.div
            className="dingry-sale-overlay absolute inset-0 bg-[#050505]/90 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: MODAL_OVERLAY_EASE }}
            onClick={() => setSelectedProduct(null)}
          />
          <motion.div
            ref={productModalRef}
            data-product-modal=""
            className="dingry-sale-panel relative z-10 bg-[#0a0a0a] border border-white/[0.06] w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col md:flex-row"
            key={isJerseyModal ? `jersey-${jerseyColor}` : selectedProduct.id}
            initial={{ opacity: 0, scale: 0.96, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            transition={MODAL_PANEL_SPRING}
          >
            <div ref={productImageRef} className="dingry-sale-photo w-full shrink-0 overflow-hidden bg-[#080808] md:w-1/2 md:max-w-[520px] md:self-start">
              <img
                src={activeModalView?.image ?? selectedProduct.image}
                alt={activeModalView?.name ?? selectedProduct.name}
                className="block h-auto w-full"
                style={{ filter: "brightness(0.85) contrast(1.05) grayscale(0.2)" }}
              />
            </div>
            <div className="dingry-sale-panel relative z-10 flex flex-1 flex-col justify-between bg-[#0a0a0a] p-6 md:p-10">
              <div>
                <div className="mb-2 flex items-center justify-end gap-3">
                  <div className="flex shrink-0 items-center gap-2">
                    {showModalSideToggle ? (
                      <button
                        type="button"
                        onClick={() => showProductSide(modalSide === "verso" ? "recto" : "verso")}
                        className={`border px-3 py-2 text-[10px] tracking-[0.22em] uppercase transition-colors md:hidden ${modalSide === "verso" ? "border-white bg-white text-black" : "border-white/20 text-white/50 hover:border-white/60 hover:text-white"}`}
                        aria-pressed={modalSide === "verso"}
                      >
                        {modalSide === "verso" ? "recto" : "verso"}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setSelectedProduct(null)}
                      className={`h-11 w-11 items-center justify-center text-white/40 transition-colors hover:text-white ${showModalSideToggle ? "hidden md:flex" : "flex"}`}
                      aria-label="Fermer"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <h2 className="text-2xl font-bold tracking-widest uppercase mb-4">{selectedProduct.name}</h2>
                <div className="mb-6 flex items-start justify-between gap-3">
                  <span className="text-[10px] tracking-[0.3em] text-white/40 uppercase">Quantité</span>
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="flex items-center border border-white/15">
                      <button
                        type="button"
                        onClick={() => setSelectedQuantity((quantity) => Math.max(1, quantity - 1))}
                        aria-label="Diminuer la quantité"
                        className="w-9 h-9 text-white/60 hover:bg-white hover:text-black transition-colors"
                      >−</button>
                      <span className="w-10 text-center text-sm font-medium" aria-live="polite">{selectedQuantity}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedQuantity((quantity) => Math.min(99, quantity + 1))}
                        aria-label="Augmenter la quantité"
                        className="w-9 h-9 text-white/60 hover:bg-white hover:text-black transition-colors"
                      >+</button>
                    </div>
                    <p className="text-xs font-normal tabular-nums tracking-wide text-white/55">
                      {(jerseyCheckoutProduct ?? selectedProduct).price}€
                    </p>
                  </div>
                </div>
                {isJerseyModal ? (
                  <div className="mb-6">
                    <p className="text-[10px] tracking-[0.3em] text-white/40 uppercase mb-3">Couleur</p>
                    <div className="flex flex-wrap gap-2">
                      {JERSEY_COLOR_OPTIONS.map((option) => (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() => setJerseyColor(option.key)}
                          className={`border px-4 py-2.5 text-[10px] tracking-[0.22em] uppercase transition-all ${
                            jerseyColor === option.key
                              ? "border-white bg-white text-black"
                              : "border-white/15 text-white/50 hover:border-white/40 hover:text-white"
                          }`}
                          aria-pressed={jerseyColor === option.key}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
                <p className="text-[10px] tracking-[0.3em] text-white/40 uppercase mb-4">Select a Size</p>
                {(() => {
                  const modalSizes =
                    selectedProduct.sizes && selectedProduct.sizes.length > 0 ? selectedProduct.sizes : SIZES;
                  const modalSizeCols = modalSizes.length <= 4 ? 4 : 6;
                  const rectoColumn = Math.max(1, modalSizes.indexOf("S") + 1);
                  const nextSide = modalSide === "verso" ? "recto" : "verso";
                  return (
                    <>
                      <div className={`grid gap-2 ${showModalSideToggle ? "mb-2" : "mb-8"} ${modalSizeCols === 4 ? "grid-cols-4" : "grid-cols-6"}`}>
                        {modalSizes.map((s) => (
                          <button
                            key={s}
                            onClick={() => setSelectedSize(s)}
                            className={`py-2.5 text-xs font-medium tracking-widest border transition-all duration-200 ${
                              selectedSize === s
                                ? "bg-[#0066FF] border-[#0066FF] text-white"
                                : "border-white/10 text-white/50 hover:border-white/30 hover:text-white"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                      {showModalSideToggle ? (
                        <div
                          className="mb-8 hidden gap-2 md:grid"
                          style={{ gridTemplateColumns: `repeat(${modalSizeCols}, minmax(0, 1fr))` }}
                        >
                          <button
                            type="button"
                            onClick={() => showProductSide(nextSide)}
                            aria-pressed={modalSide === "verso"}
                            style={{ gridColumn: rectoColumn }}
                            className={`py-2.5 text-[10px] font-medium tracking-[0.18em] uppercase border transition-all ${
                              modalSide === "verso"
                                ? "border-white bg-white text-black"
                                : "border-white/20 text-white/50 hover:border-white/60 hover:text-white"
                            }`}
                          >
                            {nextSide}
                          </button>
                        </div>
                      ) : null}
                    </>
                  );
                })()}
              </div>
              <button
                onClick={addToCart}
                disabled={!selectedSize}
                className={`w-full py-4 text-xs font-bold tracking-[0.3em] uppercase transition-all duration-300 ${
                  selectedSize
                    ? "bg-white text-[#050505] hover:bg-[#0066FF] hover:text-white"
                    : "bg-white/10 text-white/20 cursor-not-allowed"
                }`}
              >
                ADD TO CART
              </button>
            </div>
          </motion.div>
        </div>
        ) : null}
      </AnimatePresence>

      {/* Toast confirmation PayPal */}
      <AnimatePresence>
        {paymentToastVisible ? (
          <motion.div
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.28, ease: MODAL_OVERLAY_EASE }}
            className="pointer-events-none fixed top-24 left-1/2 z-[80] w-[min(92vw,24rem)] -translate-x-1/2 border border-[#0066FF]/45 bg-[#0a0a0a]/95 px-5 py-4 shadow-[0_12px_40px_rgba(0,102,255,0.15)] backdrop-blur-md"
          >
            <p className="text-[10px] font-medium tracking-[0.32em] text-[#0066FF] uppercase">Commande validée</p>
            <p className="mt-2 text-sm leading-relaxed text-white/90">
              Un reçu e-mail vous a été envoyé par PayPal.
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* CART DRAWER */}
      {cartOpen && (
        <div className="fixed inset-0 z-[70] flex justify-end">
          <div className="absolute inset-0 bg-[#050505]/80 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
          <div className="relative z-10 bg-[#0a0a0a] border-l border-white/[0.06] w-full max-w-md flex flex-col h-full">
            <div className="flex items-center justify-between p-8 border-b border-white/[0.06]">
              <div>
                <h2 className="text-sm font-bold tracking-[0.3em] uppercase">
                  {orderConfirmation ? "Commande confirmée" : "Votre Vault"}
                </h2>
                {cartCount > 0 && !orderConfirmation ? (
                  <p className="text-xs text-white/40 mt-1">{cartCount} article{cartCount > 1 ? "s" : ""}</p>
                ) : null}
              </div>
              <button onClick={() => setCartOpen(false)} className="w-10 h-10 flex items-center justify-center text-white/40 hover:text-white transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="flex-1 flex items-center justify-center px-8 overflow-y-auto">
                {orderConfirmation ? (
                  <div className="w-full border border-[#0066FF]/40 bg-[#0066FF]/10 p-6">
                    <p className="text-[10px] tracking-[0.35em] text-[#0066FF] uppercase">Commande validée</p>
                    <p className="mt-4 text-sm leading-relaxed text-white">
                      Merci {orderConfirmation.payerName}. Un reçu e-mail vous a été envoyé par PayPal.
                    </p>
                    <p className="mt-4 text-[10px] tracking-[0.22em] text-white/40 uppercase">
                      Réf. {orderConfirmation.orderId}
                    </p>
                    <ul className="mt-4 space-y-2 border-t border-white/[0.08] pt-4 text-sm text-white/75">
                      {orderConfirmation.items.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                    <p className="mt-4 text-base font-bold">{orderConfirmation.total}€</p>
                    {orderConfirmation.shippingAddress ? (
                      <div className="mt-4 border-t border-white/[0.08] pt-4 text-xs leading-relaxed text-white/55">
                        <p className="text-[10px] tracking-[0.22em] text-white/35 uppercase mb-1">Livraison</p>
                        <p>{orderConfirmation.shippingName}</p>
                        <p>{orderConfirmation.shippingAddress}</p>
                      </div>
                    ) : null}
                    {orderConfirmation.email ? (
                      <p className="mt-3 text-xs text-white/40">{orderConfirmation.email}</p>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => {
                        setOrderConfirmation(null);
                        setCartOpen(false);
                      }}
                      className="mt-6 w-full py-4 bg-white text-[#050505] text-xs font-bold tracking-[0.3em] uppercase hover:bg-[#0066FF] hover:text-white transition-colors"
                    >
                      Continuer
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm tracking-[0.3em] text-white/20 uppercase mb-2">YOUR VAULT IS EMPTY</p>
                    <p className="text-xs text-white/15">Aucun article pour le moment.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex gap-4 border border-white/[0.05] p-4 bg-[#080808]">
                    <img src={item.product.image} alt={item.product.name} className="w-20 h-24 object-cover flex-shrink-0" style={{ filter: "grayscale(0.3)" }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] tracking-[0.3em] text-white/40 uppercase">{item.product.name}</p>
                      <p className="text-sm font-medium tracking-widest uppercase truncate">{item.product.variant}</p>
                      {item.personalization && (
                        <p className="text-xs text-[#0066FF] mt-1 tracking-wider uppercase">« {item.personalization} »</p>
                      )}
                      <p className="text-xs text-white/40 mt-1">Taille: {item.size}</p>
                      <div className="flex items-center gap-3 mt-3">
                        <span className="text-[9px] tracking-[0.25em] text-white/35 uppercase">Quantité</span>
                        <div className="flex items-center border border-white/15">
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(idx, -1)}
                            aria-label={`Diminuer la quantité de ${item.product.name}`}
                            className="w-7 h-7 text-white/55 hover:bg-white hover:text-black transition-colors"
                          >−</button>
                          <span className="w-7 text-center text-xs" aria-live="polite">{item.qty}</span>
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(idx, 1)}
                            aria-label={`Augmenter la quantité de ${item.product.name}`}
                            className="w-7 h-7 text-white/55 hover:bg-white hover:text-black transition-colors"
                          >+</button>
                        </div>
                      </div>
                      <p className="text-sm font-bold mt-2">{cartItemUnitPrice(item) * item.qty}€</p>
                    </div>
                    <button onClick={() => removeFromCart(idx)} className="text-white/20 hover:text-white/60 transition-colors self-start mt-1">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {cart.length > 0 && (
              <div className="p-6 border-t border-white/[0.06]">
                <div className="flex justify-between mb-6">
                  <span className="text-xs tracking-[0.25em] text-white/40 uppercase">Total</span>
                  <span className="text-base font-bold">{cartTotal}€</span>
                </div>
                <PayPalPaymentButton
                  lines={cart.map((item) => ({
                    name: item.personalization
                      ? `${item.product.name} — ${item.personalization}`
                      : `${item.product.name} — ${item.size}`,
                    quantity: item.qty,
                    unitAmount: cartItemUnitPrice(item),
                  }))}
                  onPaid={handlePayPalPaid}
                />
                <p className="text-center text-[10px] text-white/20 mt-3 tracking-wider leading-relaxed">
                  PayPal ou carte via PayPal
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
      `}</style>
      </div>
    </div>
  );
}
