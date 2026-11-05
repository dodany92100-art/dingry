"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { DingryLogo } from "@/components/dingry-logo";
import { cldOpt, ProductCard } from "@/components/product-card";
import { ShopFooter } from "@/components/shop-footer";
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";
import { AnimatedTabs } from "@/components/ui/animated-tabs";
import { StickyScroll, type StickyScrollItem } from "@/components/ui/sticky-scroll-reveal";
import { Button } from "@/components/ui/button";
import { overlayShopCatalog, isShopProductInStock, shopProductFromUnknown, type ShopProduct } from "@/lib/catalog";
import {
  cartUnitPrice,
  consumeCheckoutConfirmation,
  PERSONALIZATION_SURCHARGE_EUR,
  readStoredCart,
  writeStoredCart,
  type StoredCartItem,
} from "@/lib/checkout-draft";
import {
  CATALOG_MENU_TAB_CUSTOM,
  CATALOG_MENU_TABS,
  catalogMenuTabLabel,
  filterCatalogProducts,
  isRectoVersoShopCategory,
  parseCatalogFilter,
  type CatalogFilter,
} from "@/lib/shop-catalog";
import {
  sortCatalogProducts,
} from "@/lib/catalog-sort";

import {
  productSlugForCatalogId,
  rectoIdFromProductSlug,
} from "@/lib/dingry-product-copy";
import { DINGRY_DELIVERY_ESTIMATE, DINGRY_SHIPPING_LABEL } from "@/lib/dingry-checkout-copy";
import {
  catalogRectoId,
  completeLookForProduct,
  productDetailCopy,
  productLineForCatalogId,
  storefrontProductSubtitle,
  storefrontProductTitle,
} from "@/lib/dingry-product-display";
import { DINGRY_TEASING_HERO_SRC } from "@/lib/dingry-brand";
import {
  DINGRY_MANIFESTO_EN,
  DINGRY_MANIFESTO_FR,
  DINGRY_HERO_EDITORIAL_LINES,
  DINGRY_STREET_LINE,
} from "@/lib/dingry-brand-voice";
import { readWishlistIds, toggleWishlistId } from "@/lib/wishlist";
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
  hero1: "https://res.cloudinary.com/dc9xmxpvv/image/upload/f_auto,q_auto,w_1920,c_crop,g_north,h_1430,w_1960/v1793310395/014c39fa-7191-491e-a893-a58b934498dd_no55a0.jpg",
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

const PERSONALIZATION_MAX_LABEL_LENGTH = 28;

/** Maquettes recto (devant) — même logique que la PJ Paris / Marseille / Lyon */
const PERSONALIZATION_SHIRTS = [
  { id: "noir", label: "Noir", image: IMAGES.tee11, cityTop: "57%", citySize: "clamp(0.55rem, 2.9vw, 0.82rem)" },
  { id: "vert", label: "Vert", image: IMAGES.tee8, cityTop: "53%", citySize: "clamp(0.65rem, 3.1vw, 0.95rem)" },
  { id: "rouge", label: "Rouge", image: IMAGES.tee9, cityTop: "53%", citySize: "clamp(0.65rem, 3.1vw, 0.95rem)" },
] as const;

const EDITORIAL_SCROLL_ITEMS: StickyScrollItem[] = [
  {
    kickerLogo: true,
    title: "Chaque silhouette raconte l'attitude.",
    description:
      "DINGRY Paris est une marque de streetwear française en plein développement, qui séduit un public toujours plus large grâce à une identité forte, un style affirmé et surtout un nom aussi original qu'universel.\n\nEntre coupes oversize, finitions soignées et drops en édition limitée, DINGRY réinvente le streetwear premium pensé pour Paris, Lyon et la scène urbaine européenne.",
  },
  {
    title: DINGRY_STREET_LINE,
    titleVariant: "street",
    description:
      "DINGRY, c'est peut-être l'un des meilleurs noms qu'une marque de streetwear puisse porter aujourd'hui. Un mot populaire, utilisé par toutes les générations et toutes les classes sociales, qui reflète parfaitement notre époque. Son écriture singulière en fait une signature immédiatement reconnaissable.",
    elasticLogoCenter: true,
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
    name: "Hoodie DINGRY Original KING BLUE / PINK",
    variant: "VERSO",
    price: 80,
    image: IMAGES.hoodie1,
    description: "Coton lourd 480g, coupe oversize, capuche doublée. Finitions intérieures ton sur ton.",
    category: "Hoodie",
  },
  {
    id: 2,
    name: "Hoodie DINGRY Original KING BLUE / PINK",
    variant: "RECTO",
    price: 80,
    image: IMAGES.hoodie2,
    description: "Coloris king blue, broderie pink. Édition limitée.",
    category: "Hoodie",
  },
  {
    id: 3,
    name: "Hoodie DINGRY Original VERT",
    variant: "VERSO",
    price: 80,
    image: IMAGES.hoodie3,
    description: "Coton lourd, coupe oversize et signature DINGRY au dos.",
    category: "Hoodie",
  },
  {
    id: 4,
    name: "Hoodie zippé DINGRY Outline / BLACK",
    variant: "RECTO",
    price: 90,
    image: IMAGES.hoodie4,
    description: "Hoodie zippé noir, silhouette structurée et détails outline.",
    category: "Hoodie zippé",
  },
  {
    id: 5,
    name: "Hoodie zippé DINGRY Outline / BLACK",
    variant: "VERSO",
    price: 90,
    image: IMAGES.hoodie5,
    description: "Vue dos du hoodie zippé outline.",
    category: "Hoodie zippé",
  },
  {
    id: 6,
    name: "Hoodie DINGRY Original BLACK",
    variant: "RECTO",
    price: 80,
    image: IMAGES.hoodie6,
    description: "Le hoodie original DINGRY en noir, coupe oversize.",
    category: "Hoodie",
  },
  {
    id: 7,
    name: "Hoodie DINGRY Original VERT",
    variant: "RECTO",
    price: 80,
    image: IMAGES.hoodie7,
    description: "Le modèle original en vert, pensé pour la rue.",
    category: "Hoodie",
  },
  {
    id: 8,
    name: "Hoodie DINGRY Original BLACK",
    variant: "VERSO",
    price: 80,
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
      name:
        collection === 1
          ? "T-shirt DINGRY Original WHITE"
          : collection === 11
            ? "T-shirt DINGRY Original BLACK"
            : "DINGRY TEE",
      variant: inCatalog ? rectoVariant : `COLLECTION ${String(collection).padStart(2, "0")} — VERSO`,
      price: collection === 1 || collection === 11 ? 35 : 119,
      image: IMAGES[imageKey],
      description: "",
      category: "T-shirts",
    };
  }),
  {
    id: 22,
    name: "DINGRY TEE FEMME",
    variant: "ORIGINAL — RECTO",
    price: 35,
    image: IMAGES.tee12,
    description: "",
    category: "T-shirts",
  },
  {
    id: 23,
    name: "DINGRY TEE FEMME",
    variant: "SIGNATURE — RECTO",
    price: 35,
    image: IMAGES.tee13,
    description: "",
    category: "T-shirts",
  },
  {
    id: 24,
    name: "DINGRY TEE",
    variant: "PERSONNALISÉ — RECTO",
    price: 35,
    image: IMAGES.tee11,
    description: "T-shirt noir personnalisable — ville ou texte sous le logo (+5€).",
    category: "T-shirts",
  },
  {
    id: 25,
    name: "HOODIE BLACK PARIS BACK-LOGO",
    variant: "NOIR PARIS — RECTO",
    price: 80,
    image: IMAGES.hoodieParisBlackRecto,
    description:
      "Hoodie noir avec logo DINGRY Paris sur la poitrine, éclairs sur les manches et grand print vertical DINGRY au dos.",
    category: "Hoodie",
  },
  {
    id: 26,
    name: "HOODIE BLACK PARIS BACK-LOGO",
    variant: "NOIR PARIS — VERSO",
    price: 80,
    image: IMAGES.hoodieParisBlackVerso,
    description: "",
    category: "Hoodie",
  },
  {
    id: 27,
    name: "Hoodie DINGRY Original GREY",
    variant: "RECTO",
    price: 80,
    image: IMAGES.hoodieParisGreyRecto,
    description:
      "Hoodie gris chiné, logo DINGRY sur la poitrine et statement au dos.",
    category: "Hoodie",
  },
  {
    id: 28,
    name: "Hoodie DINGRY Original GREY",
    variant: "VERSO",
    price: 80,
    image: IMAGES.hoodieParisGreyVerso,
    description: "",
    category: "Hoodie",
  },
  {
    id: 29,
    name: "Hoodie DINGRY Original CHOCOLAT",
    variant: "RECTO",
    price: 80,
    image: IMAGES.hoodieRoyalBlueRecto,
    description: "Hoodie chocolat à capuche, logo DINGRY sur la poitrine.",
    category: "Hoodie",
  },
  {
    id: 30,
    name: "Hoodie DINGRY Original CHOCOLAT",
    variant: "VERSO",
    price: 80,
    image: IMAGES.hoodieRoyalBlueVerso,
    description: "",
    category: "Hoodie",
  },
  {
    id: 35,
    name: "Hoodie DINGRY Original WHITE",
    variant: "RECTO",
    price: 80,
    image: IMAGES.hoodieParisWhiteRecto,
    description: "Hoodie blanc, logo DINGRY sur la poitrine et statement au dos.",
    category: "Hoodie",
  },
  {
    id: 36,
    name: "Hoodie DINGRY Original WHITE",
    variant: "VERSO",
    price: 80,
    image: IMAGES.hoodieParisWhiteVerso,
    description: "",
    category: "Hoodie",
  },
  {
    id: 31,
    name: "Crewneck DINGRY Original YELLOW FLUO",
    variant: "RECTO",
    price: 50,
    image: IMAGES.sweatNeonYellowRecto,
    description: "Sweat col rond jaune fluo sans capuche, logo DINGRY Paris noir sur la poitrine.",
    category: "Sweats",
  },
  {
    id: 32,
    name: "Crewneck DINGRY Original YELLOW FLUO",
    variant: "VERSO",
    price: 50,
    image: IMAGES.sweatNeonYellowVerso,
    description: "",
    category: "Sweats",
  },
  {
    id: 33,
    name: "Crewneck DINGRY Original BLUE / YELLOW",
    variant: "RECTO",
    price: 50,
    image: IMAGES.sweatRoyalBlueRecto,
    description: "Sweat col rond bleu royal sans capuche, écriture Dingry jaune style rétro sur la poitrine.",
    category: "Sweats",
  },
  {
    id: 34,
    name: "Crewneck DINGRY Original BLUE / YELLOW",
    variant: "VERSO",
    price: 50,
    image: IMAGES.sweatRoyalBlueVerso,
    description: "",
    category: "Sweats",
  },
  {
    id: 39,
    name: "Crewneck DINGRY Original PURPLE / PINK",
    variant: "RECTO",
    price: 50,
    image: IMAGES.sweatPurpleRecto,
    description: "Sweat col rond violet sans capuche, logo DINGRY Paris rose sur la poitrine et éclair sur la manche.",
    category: "Sweats",
  },
  {
    id: 40,
    name: "Crewneck DINGRY Original PURPLE / PINK",
    variant: "VERSO",
    price: 50,
    image: IMAGES.sweatPurpleVerso,
    description: "",
    category: "Sweats",
  },
  {
    id: 37,
    name: "CAP DINGRY Original BLACK",
    variant: "TU",
    price: 40,
    image: IMAGES.cap1,
    description: "Casquette noire, logo DINGRY blanc sur l'avant et marque sur la bride.",
    category: "Caps",
    sizes: ["TU"],
  },
  {
    id: 38,
    name: "CAP DINGRY Original RED",
    variant: "TU",
    price: 40,
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

type CartItem = StoredCartItem;

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
  return cartUnitPrice(item);
}

export default function App() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartHydrated, setCartHydrated] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [products, setProducts] = useState<ShopProduct[]>(PRODUCTS);
  const [catalogState, setCatalogState] = useState<"loading" | "ready" | "error">("loading");
  const [catalogRetry, setCatalogRetry] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<ShopProduct | null>(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [orderConfirmation, setOrderConfirmation] = useState<OrderConfirmation | null>(null);
  const [paymentToastVisible, setPaymentToastVisible] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeFilter = parseCatalogFilter(searchParams.get("category"));
  const [modalSide, setModalSide] = useState<"recto" | "verso">("recto");
  const [jerseyColor, setJerseyColor] = useState<JerseyColorKey>("BLANC");
  const [personalizeOpen, setPersonalizeOpen] = useState(false);
  const [personalizeLabel, setPersonalizeLabel] = useState("PARIS");
  const [personalizeSize, setPersonalizeSize] = useState("");
  const [personalizeQty, setPersonalizeQty] = useState(1);
  const [personalizeShirtId, setPersonalizeShirtId] = useState<(typeof PERSONALIZATION_SHIRTS)[number]["id"]>("noir");
  const [wishlistIds, setWishlistIds] = useState<number[]>([]);
  const pageScrollRef = useRef<HTMLDivElement>(null);
  const productModalRef = useRef<HTMLDivElement>(null);
  const productImageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setWishlistIds(readWishlistIds());
  }, []);

  useEffect(() => {
    const confirmation = consumeCheckoutConfirmation();
    if (confirmation) {
      writeStoredCart([]);
      setCart([]);
      setOrderConfirmation(confirmation);
      setPaymentToastVisible(true);
      setCartOpen(true);
      setCartHydrated(true);
      const timer = window.setTimeout(() => setPaymentToastVisible(false), 6500);
      return () => window.clearTimeout(timer);
    }
    const saved = readStoredCart();
    if (saved.length > 0) setCart(saved);
    setCartHydrated(true);
  }, []);

  useEffect(() => {
    if (searchParams.get("panier") !== "1") return;
    if (readStoredCart().length === 0) return;
    setCartOpen(true);
  }, [searchParams]);

  useEffect(() => {
    if (!cartHydrated) return;
    writeStoredCart(cart);
  }, [cart, cartHydrated]);

  useEffect(() => {
    let cancelled = false;
    async function loadCatalog() {
      setCatalogState((state) => (state === "ready" ? state : "loading"));
      try {
        const response = await fetch("/api/catalog");
        if (response.status === 503) {
          if (!cancelled) setCatalogState("error");
          return;
        }
        if (!response.ok) {
          if (!cancelled) setCatalogState("error");
          return;
        }
        const data = (await response.json()) as {
          products?: unknown;
          removedCatalogIds?: unknown;
        };
        const live = Array.isArray(data.products)
          ? data.products
              .map(shopProductFromUnknown)
              .filter((item): item is NonNullable<typeof item> => item !== null)
          : [];
        const removedCatalogIds = Array.isArray(data.removedCatalogIds)
          ? data.removedCatalogIds.filter(
              (id): id is number => typeof id === "number" && Number.isInteger(id) && id > 0,
            )
          : [];
        if (!cancelled) {
          if (live.length > 0 || removedCatalogIds.length > 0) {
            setProducts(overlayShopCatalog(PRODUCTS, live, removedCatalogIds));
          }
          setCatalogState("ready");
        }
      } catch {
        if (!cancelled) setCatalogState("error");
      }
    }
    void loadCatalog();
    return () => { cancelled = true; };
  }, [catalogRetry]);

  useEffect(() => {
    if (catalogState !== "ready") return;
    const slug = searchParams.get("produit");
    if (!slug) return;
    const rectoId = rectoIdFromProductSlug(slug);
    if (!rectoId) return;
    if (selectedProduct && productSlugForCatalogId(selectedProduct.id) === slug) return;
    const product = products.find((item) => item.id === rectoId);
    if (!product) return;
    setSelectedProduct(product);
    setSelectedSize("");
    setModalSide("recto");
  }, [catalogState, searchParams, products, selectedProduct]);

  function syncProductInUrl(product: ShopProduct | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (product) {
      const slug = productSlugForCatalogId(product.id);
      if (slug) params.set("produit", slug);
      else params.delete("produit");
    } else {
      params.delete("produit");
    }
    const query = params.toString();
    router.replace(query ? `/?${query}` : "/", { scroll: false });
  }

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

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => s + cartItemUnitPrice(i) * i.qty, 0);
  const personalizationProduct = products.find((p) => p.id === 24) ?? PRODUCTS.find((p) => p.id === 24);
  const personalizePreviewLabel = personalizeLabel.trim().slice(0, PERSONALIZATION_MAX_LABEL_LENGTH).toUpperCase() || "PARIS";
  const personalizeShirt =
    PERSONALIZATION_SHIRTS.find((s) => s.id === personalizeShirtId) ?? PERSONALIZATION_SHIRTS[0];

  const filtered = useMemo(
    () => sortCatalogProducts(filterCatalogProducts(products, activeFilter), "featured"),
    [products, activeFilter],
  );
  const catalogTabValue = personalizeOpen ? CATALOG_MENU_TAB_CUSTOM : activeFilter;

  function openCustomConfigurator() {
    setPersonalizeOpen(true);
  }

  function handleCatalogTabChange(tab: string) {
    if (tab === CATALOG_MENU_TAB_CUSTOM) {
      openCustomConfigurator();
      return;
    }
    setPersonalizeOpen(false);
    selectCatalogFilter(parseCatalogFilter(tab));
  }

  function addToCart() {
    if (!selectedProduct || !selectedSize) return;
    if (!isShopProductInStock(selectedProduct)) return;
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
    if (!isShopProductInStock(personalizationProduct)) return;
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

  function goToCheckout() {
    if (catalogState === "error") return;
    writeStoredCart(cart);
    setCartOpen(false);
    router.push("/checkout");
  }

  const heroImages = [DINGRY_TEASING_HERO_SRC];
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
  const modalSaleProduct = jerseyCheckoutProduct ?? selectedProduct;
  const modalOutOfStock = modalSaleProduct !== null && !isShopProductInStock(modalSaleProduct);

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
    syncProductInUrl(product);
  }

  function closeProductModal() {
    setSelectedProduct(null);
    syncProductInUrl(null);
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
    const scroller = pageScrollRef.current;
    const target = document.getElementById(id);
    if (!scroller || !target) return;
    const top =
      target.getBoundingClientRect().top -
      scroller.getBoundingClientRect().top +
      scroller.scrollTop;
    scroller.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }

  function productById(id: number): ShopProduct | undefined {
    return products.find((item) => item.id === id);
  }

  function openVariantRecto(rectoId: number) {
    const target = productById(rectoId);
    if (target) openProductModal(target);
  }

  function handleWishlistToggle() {
    if (!selectedProduct) return;
    setWishlistIds(toggleWishlistId(catalogRectoId(selectedProduct.id)));
  }

  const selectedProductLine = selectedProduct ? productLineForCatalogId(selectedProduct.id) : null;
  const selectedRectoId = selectedProduct ? catalogRectoId(selectedProduct.id) : null;
  const selectedDetailCopy = selectedProduct ? productDetailCopy(selectedProduct) : null;
  const completeLookItems = selectedProduct ? completeLookForProduct(selectedProduct.id, products) : [];
  const wishlistActive =
    selectedRectoId !== null && wishlistIds.includes(selectedRectoId);

  const renderProductCard = (product: ShopProduct, index: number) => (
    <ProductCard
      key={product.id}
      name={storefrontProductTitle(product)}
      variant={storefrontProductSubtitle(product)}
      image={product.image}
      price={product.price}
      priority={index < 4}
      soldOut={!isShopProductInStock(product)}
      onClick={() => openProductModal(product)}
    />
  );

  return (
    <div className="dingry-shop relative h-dvh overflow-hidden text-white">
      <BackgroundGradientAnimation interactive={false} />
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.08] bg-[#12151c]/95 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 py-2.5 md:px-12 md:py-5">
          <div className="flex min-w-0 flex-1 items-center gap-4 md:gap-8">
            <a href="/" className="flex shrink-0 items-center [perspective:900px]" aria-label="DINGRY Paris">
              <DingryLogo animate />
            </a>
            <div className="hidden items-center gap-6 md:flex">
              {(
                [
                  ["catalogue", "Catalogue"],
                ["lookbook", "Lookbook"],
                ["heritage", "Heritage"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => scrollToSection(id)}
                  className="dingry-interactive-luxe text-xs tracking-[0.25em] text-white/40 uppercase hover:text-white"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-6">
            <div className="dingry-nav-tagline hidden text-right md:block">
              <span className="dingry-typo-manifesto-en block text-[9px] tracking-[0.2em]">
                {DINGRY_MANIFESTO_EN}
              </span>
              <span className="dingry-typo-street mt-1 block text-lg leading-none">{DINGRY_STREET_LINE}</span>
            </div>
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              aria-label={cartCount > 0 ? `Panier, ${cartCount} article${cartCount > 1 ? "s" : ""}` : "Ouvrir le panier"}
              className="dingry-interactive-luxe relative flex h-11 items-center gap-2.5 rounded-sm border border-white/20 bg-white/[0.06] px-3.5 text-white/90 hover:border-[#0066FF]/50 hover:bg-white/[0.1] hover:text-white md:px-4"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <circle cx="9" cy="20" r="1.25" fill="currentColor" stroke="none" />
                <circle cx="17" cy="20" r="1.25" fill="currentColor" stroke="none" />
                <path d="M2 3h2.2l2.4 12.4a1.5 1.5 0 0 0 1.48 1.22h9.56a1.5 1.5 0 0 0 1.47-1.18L21 7H6" />
              </svg>
              <span className="text-[10px] font-medium tracking-[0.22em] uppercase">Panier</span>
              {cartCount > 0 ? (
                <span className="flex h-5 min-w-5 items-center justify-center bg-[#0066FF] px-1.5 text-[10px] font-bold leading-none text-white">
                  {cartCount}
                </span>
              ) : null}
            </button>
          </div>
        </div>
      </nav>
      <div
        ref={pageScrollRef}
        className="dingry-page relative z-10 h-full overflow-y-auto bg-transparent [overflow-anchor:none]"
      >

      {/* HERO — même cadrage que le teaser (cover + hauteur viewport) */}
      <section className="dingry-hero relative h-dvh w-full shrink-0 overflow-hidden">
        {heroImages.map((img) => (
          <img
            key={img}
            src={img}
            alt="DINGRY editorial"
            fetchPriority="high"
            loading="eager"
            decoding="sync"
            width={1920}
            height={1080}
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
        ))}
        <div className="pointer-events-none absolute inset-0 z-10 flex items-end px-5 pb-8 pt-[var(--dingry-nav-h)] sm:px-8 sm:pb-10 md:items-center md:px-16 md:pb-0">
          <div className="dingry-brand-reveal dingry-hero-copy w-full max-w-[19rem] sm:max-w-sm md:max-w-md">
            <h1 className="dingry-typo-manifesto">{DINGRY_MANIFESTO_FR}</h1>
            <p className="dingry-typo-manifesto-en mt-2">{DINGRY_MANIFESTO_EN}</p>
            <div className="mt-3 h-px w-14 bg-white/70" />
            <p className="dingry-typo-street dingry-typo-street--sm mt-3">{DINGRY_STREET_LINE}</p>
            <p className="dingry-typo-body-alt mt-3">
              {DINGRY_HERO_EDITORIAL_LINES.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </p>
          </div>
        </div>
      </section>

      <div id="catalogue-landing" />

      {/* CATALOGUE */}
      <section id="catalogue" className="dingry-catalog-surface px-4 pb-20 md:px-12 md:pb-24">
        <div className="mb-4 md:mb-5">
          <h2 className="mb-2">
            <DingryLogo animate={false} className="dingry-catalog-logo h-9 md:h-14" />
          </h2>
          <p className="dingry-typo-manifesto text-[10px] sm:text-[11px]">{DINGRY_MANIFESTO_FR}</p>
          <p className="dingry-typo-street dingry-typo-street--sm mt-2 text-white/85">{DINGRY_STREET_LINE}</p>
        </div>

        {/* Filters */}
        <div className="dingry-catalog-bar -mx-4 mb-6 border-b border-white/15 bg-[#12151c]/95 px-4 py-3 shadow-[inset_0_1px_0_rgb(255_255_255/0.16)] backdrop-blur-2xl backdrop-saturate-150 md:mb-8 md:mx-0 md:px-0">
          <AnimatedTabs
            tabs={[...CATALOG_MENU_TABS]}
            value={catalogTabValue}
            onValueChange={handleCatalogTabChange}
            layoutId="dingry-catalog-tabs"
            aria-label="Catégories de la collection DINGRY"
            variant="underline"
            labelForTab={catalogMenuTabLabel}
            classNameForTab={(tab) =>
              tab === CATALOG_MENU_TAB_CUSTOM
                ? "border border-[#0066FF]/45 bg-[#0066FF]/12 text-white hover:text-white"
                : undefined
            }
          />
        </div>

        <button
          type="button"
          onClick={openCustomConfigurator}
          className="group mb-8 w-full border border-[#0066FF]/40 bg-gradient-to-r from-[#0066FF]/15 via-[#0066FF]/8 to-transparent p-5 text-left transition-colors hover:border-[#0066FF]/65 hover:from-[#0066FF]/22 md:p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="max-w-xl">
              <p className="text-[10px] font-semibold tracking-[0.32em] text-[#0066FF] uppercase">Custom · Configurateur</p>
              <p className="mt-2 text-lg uppercase tracking-tight text-white md:text-xl">
                Ville, texte ou message sous le logo
              </p>
              <p className="mt-2 text-sm text-white/50">
                Tee personnalisable · aperçu en direct · +{PERSONALIZATION_SURCHARGE_EUR}€
              </p>
            </div>
            <span className="shrink-0 bg-[#0066FF] px-5 py-3 text-[10px] font-medium tracking-[0.24em] text-white uppercase transition-colors group-hover:bg-[#0052cc]">
              Ouvrir
            </span>
          </div>
        </button>

        {catalogState === "error" ? (
          <div className="mb-10 border border-white/15 bg-[#0a0a0a]/80 px-6 py-8 text-center md:px-10">
            <p className="text-sm leading-relaxed text-white/60">
              Impossible de charger Dingry collection pour le moment.
            </p>
            <button
              type="button"
              onClick={() => setCatalogRetry((value) => value + 1)}
              className="mt-6 border border-white/20 px-6 py-3 text-[10px] tracking-[0.22em] text-white uppercase transition-colors hover:border-[#0066FF] hover:text-[#7EB3FF]"
            >
              Réessayer
            </button>
          </div>
        ) : null}

        {/* Grid */}
        {catalogState !== "error" ? (
        <motion.div
          key={activeFilter}
          initial={{ opacity: 0.5, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: MODAL_OVERLAY_EASE }}
          className="grid grid-cols-2 gap-2.5 md:grid-cols-3 md:gap-4 lg:grid-cols-4"
        >
          {filtered.length > 0 ? (
            filtered.map((product, index) => renderProductCard(product, index))
          ) : (
            <div className="col-span-full border border-white/[0.06] py-20 text-center">
              <p className="text-[10px] tracking-[0.35em] text-[#0066FF] uppercase mb-4">Bientôt disponible</p>
              <p className="text-sm text-white/40 tracking-wider">Cette catégorie sera bientôt disponible dans Dingry collection.</p>
            </div>
          )}
        </motion.div>
        ) : null}
      </section>

      <section id="lookbook" className="dingry-below-hero-surface border-t border-white/[0.05] px-6 py-12 md:px-12 md:py-16">
        <p className="mb-8 text-[10px] font-semibold tracking-[0.35em] text-[#0066FF] uppercase">Lookbook</p>
        <div className="grid gap-4 md:grid-cols-3">
          {(
            [
              [IMAGES.editorial, "DINGRY — Rock the Street", "Par Sully Sefil"],
              [IMAGES.hero1, "DINGRY Look Book", "Editorial"],
              [IMAGES.cap1, "DYRON — AFRO PUNK", "Saison capsule"],
            ] as const
          ).map(([src, title, caption]) => (
            <figure key={title} className="overflow-hidden">
              <img src={src} alt={title} loading="lazy" decoding="async" className="aspect-[3/4] w-full object-cover" />
              <figcaption className="mt-3">
                <p className="text-sm uppercase tracking-wide">{title}</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-white/45">{caption}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section id="heritage" className="dingry-below-hero-surface border-t border-white/[0.05] px-6 py-12 md:px-12 md:py-16">
        <p className="mb-4 text-[10px] font-semibold tracking-[0.35em] text-[#0066FF] uppercase">Heritage</p>
        <h2 className="max-w-xl text-3xl uppercase leading-tight md:text-5xl">True luxury is attitude.</h2>
        <p className="mt-6 max-w-xl text-sm leading-relaxed text-white/70">
          DINGRY est une attitude. Une vision du luxe qui ne demande pas la permission.
        </p>
        <p className="mt-6 text-[10px] uppercase tracking-[0.28em] text-white/45">DINGRY — Rock the Street</p>
        <StickyScroll
          scrollContainerRef={pageScrollRef}
          items={EDITORIAL_SCROLL_ITEMS}
          stickyPanel={
            <div className="dingry-editorial-frame relative w-full md:p-3">
              <div className="dingry-editorial-frame__inner relative">
                <img
                  src={IMAGES.editorial}
                  alt="DINGRY editorial"
                  className="block h-auto w-full object-cover object-center"
                  style={{ filter: "brightness(0.75) contrast(1.1) grayscale(0.4)" }}
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050505]/35 via-transparent to-transparent" />
              </div>
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
              <p className="text-[10px] tracking-[0.35em] text-[#0066FF] uppercase mb-2">Custom · Studio</p>
              <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-tight pr-12">
                Configurateur tee personnalisé
              </h2>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/55">
                Choisissez la couleur, saisissez votre texte, vérifiez l&apos;aperçu recto, puis ajoutez au panier.
              </p>
              <ol className="mt-6 flex flex-wrap gap-2 text-[9px] tracking-[0.16em] text-white/40 uppercase md:gap-3 md:text-[10px]">
                <li className="rounded-full border border-white/15 px-3 py-1.5">1 · Couleur</li>
                <li className="rounded-full border border-white/15 px-3 py-1.5">2 · Texte</li>
                <li className="rounded-full border border-white/15 px-3 py-1.5">3 · Taille & quantité</li>
              </ol>
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
                  <p className="mb-3 text-[10px] tracking-[0.3em] text-[#0066FF] uppercase">Étape 1 · Couleur du tee</p>
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
                  <span className="mb-2 block text-[10px] tracking-[0.3em] text-[#0066FF] uppercase">
                    Étape 2 · Ville, pays ou texte
                  </span>
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
                  <p className="mb-3 text-[10px] tracking-[0.3em] text-[#0066FF] uppercase">Étape 3 · Taille</p>
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
                  {((personalizationProduct?.price ?? 119) + PERSONALIZATION_SURCHARGE_EUR) * personalizeQty}€{" "}
                  <span className="text-xs font-normal text-white/40 tracking-wider">
                    ({(personalizationProduct?.price ?? 119) + PERSONALIZATION_SURCHARGE_EUR}€ × {personalizeQty})
                  </span>
                </p>
                <button
                  type="button"
                  onClick={addPersonalizedToCart}
                  disabled={!personalizeSize || !personalizeLabel.trim() || !isShopProductInStock(personalizationProduct!)}
                  className={`dingry-add-to-cart-btn w-full py-4 text-xs font-bold tracking-[0.3em] uppercase transition-all duration-300 ${
                    personalizeSize && personalizeLabel.trim() && isShopProductInStock(personalizationProduct!)
                      ? "bg-[#0066FF] text-white hover:bg-[#0052cc]"
                      : "bg-white/10 text-white/20 cursor-not-allowed"
                  }`}
                >
                  {personalizationProduct && !isShopProductInStock(personalizationProduct) ? "Épuisé" : "Ajouter au panier"}
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
            onClick={() => closeProductModal()}
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
                      onClick={() => closeProductModal()}
                      className={`h-11 w-11 items-center justify-center text-white/40 transition-colors hover:text-white ${showModalSideToggle ? "hidden md:flex" : "flex"}`}
                      aria-label="Fermer"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <p className="dingry-typo-manifesto-en mb-3">{DINGRY_MANIFESTO_EN}</p>
                <h2 className="mb-2 text-2xl font-bold uppercase tracking-wide leading-tight">
                  {storefrontProductTitle(selectedProduct)}
                </h2>
                {selectedDetailCopy?.description ? (
                  <p className="mb-4 text-sm leading-relaxed text-white/55">{selectedDetailCopy.description}</p>
                ) : null}
                {selectedDetailCopy?.fabrication ? (
                  <div className="mb-4">
                    <p className="mb-1 text-[10px] tracking-[0.28em] text-white/35 uppercase">Fabrication</p>
                    <p className="text-xs leading-relaxed text-white/50">{selectedDetailCopy.fabrication}</p>
                  </div>
                ) : null}
                {selectedDetailCopy?.limitedEdition ? (
                  <div className="mb-4">
                    <p className="mb-1 text-[10px] tracking-[0.28em] text-white/35 uppercase">Édition limitée</p>
                    <p className="text-xs leading-relaxed text-white/50">{selectedDetailCopy.limitedEdition}</p>
                  </div>
                ) : null}
                {selectedProductLine && selectedRectoId !== null ? (
                  <div className="mb-6">
                    <p className="mb-3 text-[10px] tracking-[0.3em] text-white/40 uppercase">Variantes</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedProductLine.variants.map((variant) => {
                        const isActive = variant.rectoId === selectedRectoId;
                        const disabled = variant.comingSoon || !productById(variant.rectoId);
                        return (
                          <button
                            key={variant.rectoId}
                            type="button"
                            disabled={disabled}
                            onClick={() => openVariantRecto(variant.rectoId)}
                            className={`border px-3 py-2 text-[10px] tracking-[0.16em] uppercase transition-colors ${
                              isActive
                                ? "border-[#0066FF] bg-[#0066FF] text-white"
                                : disabled
                                  ? "cursor-not-allowed border-white/10 text-white/25"
                                  : "border-white/15 text-white/55 hover:border-white/40 hover:text-white"
                            }`}
                            aria-pressed={isActive}
                          >
                            {variant.colorLabel}
                            {variant.comingSoon ? " · bientôt" : ""}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
                {selectedDetailCopy?.materials ? (
                  <div className="mb-4">
                    <p className="mb-1 text-[10px] tracking-[0.28em] text-white/35 uppercase">Matières</p>
                    <p className="text-xs leading-relaxed text-white/50">{selectedDetailCopy.materials}</p>
                  </div>
                ) : null}
                {selectedDetailCopy?.sizeGuide ? (
                  <div className="mb-6">
                    <p className="mb-1 text-[10px] tracking-[0.28em] text-white/35 uppercase">Guide des tailles</p>
                    <p className="text-xs leading-relaxed text-white/50">{selectedDetailCopy.sizeGuide}</p>
                  </div>
                ) : null}
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
                    <p className="text-2xl font-bold tabular-nums tracking-tight text-[#0066FF]">
                      {(jerseyCheckoutProduct ?? selectedProduct).price * selectedQuantity}€
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
                <p className="text-[10px] tracking-[0.3em] text-white/40 uppercase mb-4">Sélectionnez une taille</p>
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
              {completeLookItems.length > 0 ? (
                <div className="mb-6 border-t border-white/[0.06] pt-5">
                  <p className="mb-3 text-[10px] tracking-[0.28em] text-[#0066FF] uppercase">Complète le look</p>
                  <div className="flex gap-3 overflow-x-auto pb-1">
                    {completeLookItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => openProductModal(item)}
                        className="w-24 shrink-0 border border-white/10 bg-[#080808] text-left transition-colors hover:border-[#0066FF]/40"
                      >
                        <img src={item.image} alt="" className="aspect-[3/4] w-full object-cover" />
                        <span className="block p-2 text-[9px] uppercase leading-snug tracking-wide text-white/55">
                          {storefrontProductTitle(item)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={addToCart}
                  disabled={!selectedSize || modalOutOfStock}
                  className={`dingry-add-to-cart-btn w-full py-4 text-xs font-bold tracking-[0.3em] uppercase transition-all duration-300 ${
                    selectedSize && !modalOutOfStock
                      ? "bg-[#0066FF] text-white shadow-[0_8px_32px_rgba(0,102,255,0.35)] hover:bg-[#0052cc]"
                      : "bg-white/10 text-white/20 cursor-not-allowed"
                  }`}
                >
                  {modalOutOfStock ? "Épuisé" : "Ajouter au panier"}
                </button>
                <button
                  type="button"
                  onClick={handleWishlistToggle}
                  className={`w-full border py-3 text-[10px] font-medium tracking-[0.24em] uppercase transition-colors ${
                    wishlistActive
                      ? "border-[#0066FF] text-[#7EB3FF]"
                      : "border-white/20 text-white/55 hover:border-white/45 hover:text-white"
                  }`}
                >
                  {wishlistActive ? "Dans la wishlist" : "Ajouter à la wishlist"}
                </button>
              </div>
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
        <div className="fixed inset-0 z-[70] flex justify-end md:justify-stretch">
          <aside className="relative hidden min-w-0 flex-1 overflow-hidden md:block">
            <button
              type="button"
              onClick={() => setCartOpen(false)}
              className="absolute inset-0 z-20 cursor-pointer"
              aria-label="Fermer le panier et continuer vos achats"
            />
            <img
              src={IMAGES.editorial}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/75 to-[#050505]/40" />
            <div className="pointer-events-none relative z-10 flex h-full max-w-lg flex-col justify-end p-10 lg:p-14">
              <p className="dingry-typo-eyebrow text-[#0066FF]">DINGRY Paris</p>
              <p className="dingry-typo-manifesto mt-4 text-white/75">{DINGRY_MANIFESTO_FR}</p>
              <p className="dingry-typo-street dingry-typo-street--lg mt-3">{DINGRY_STREET_LINE}</p>
              <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/60">{DINGRY_DELIVERY_ESTIMATE}</p>
              <p className="mt-10 text-[10px] tracking-[0.24em] text-white/35 uppercase">
                Cliquez pour continuer vos achats
              </p>
            </div>
          </aside>
          <div
            className="absolute inset-0 bg-[#050505]/80 backdrop-blur-sm md:hidden"
            onClick={() => setCartOpen(false)}
            aria-hidden
          />
          <div className="relative z-10 flex h-full min-h-0 w-full max-w-md flex-col border-l border-white/[0.06] bg-[#0a0a0a] shadow-[-24px_0_80px_rgba(0,0,0,0.45)]">
            <div className="flex items-center justify-between p-8 border-b border-white/[0.06]">
              <div>
                <h2 className="text-sm font-bold tracking-[0.3em] uppercase">
                  {orderConfirmation ? "Commande confirmée" : "Panier"}
                </h2>
                {cartCount > 0 && !orderConfirmation ? (
                  <p className="mt-1 text-xs text-white/40">
                    {cartCount} article{cartCount > 1 ? "s" : ""} · {DINGRY_SHIPPING_LABEL.toLowerCase()}
                  </p>
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
                    <p className="text-sm tracking-[0.3em] text-white/20 uppercase mb-2">Votre panier est vide.</p>
                    <button
                      type="button"
                      onClick={() => setCartOpen(false)}
                      className="mt-6 text-[10px] uppercase tracking-[0.22em] text-white/50 hover:text-white"
                    >
                      Continuer vos achats
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain p-6">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex gap-4 border border-white/[0.05] p-4 bg-[#080808]">
                    <div className="flex h-28 w-20 shrink-0 items-center justify-center overflow-hidden bg-[#0a0a0a]">
                      <img
                        src={cldOpt(item.product.image, 240)}
                        alt={item.product.name}
                        className="max-h-full max-w-full object-contain object-center"
                        decoding="async"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] tracking-[0.3em] text-white/40 uppercase">{item.product.name}</p>
                      <p className="text-sm font-medium tracking-widest uppercase truncate">{item.product.variant}</p>
                      {item.personalization && (
                        <p className="text-xs text-[#0066FF] mt-1 tracking-wider uppercase">« {item.personalization} »</p>
                      )}
                      <p className="mt-1 text-xs text-white/40">Taille {item.size}</p>
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
                      <p className="mt-2 text-sm font-bold">{cartItemUnitPrice(item) * item.qty} €</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(idx)}
                      aria-label={`Retirer ${item.product.name} du panier`}
                      className="mt-1 self-start text-white/20 transition-colors hover:text-white/60"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {cart.length > 0 && (
              <div className="sticky bottom-0 shrink-0 border-t border-white/[0.06] bg-[#0a0a0a] p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
                <p className="mb-4 text-[10px] tracking-[0.22em] text-white/35 uppercase">Récapitulatif</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-white/55">
                    <span>Sous-total</span>
                    <span>{cartTotal} €</span>
                  </div>
                  <div className="flex justify-between text-white/55">
                    <span>{DINGRY_SHIPPING_LABEL}</span>
                    <span>0 €</span>
                  </div>
                  <div className="flex justify-between border-t border-white/[0.06] pt-3 text-base font-bold">
                    <span className="text-xs tracking-[0.22em] uppercase text-white/40">Total TTC</span>
                    <span>{cartTotal} €</span>
                  </div>
                </div>
                <p className="mt-3 text-[10px] leading-relaxed tracking-wide text-white/35">{DINGRY_DELIVERY_ESTIMATE}</p>
                <button
                  type="button"
                  onClick={goToCheckout}
                  disabled={catalogState === "error"}
                  className="mt-5 w-full bg-white py-4 text-[11px] font-medium tracking-[0.28em] text-[#050505] uppercase transition-colors hover:bg-[#0066FF] hover:text-white disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/25"
                >
                  Passer au paiement
                </button>
                <button
                  type="button"
                  onClick={() => setCartOpen(false)}
                  className="mt-3 w-full py-2 text-[10px] tracking-[0.2em] text-white/45 uppercase hover:text-white"
                >
                  Continuer mes achats
                </button>
                <p className="mt-3 text-center text-[10px] leading-relaxed tracking-wide text-white/25">
                  Paiement sécurisé sur la page suivante (PayPal ou carte).
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
