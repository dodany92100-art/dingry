"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ProductCard } from "@/components/product-card";
import { ShopFooter } from "@/components/shop-footer";
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";
import { AnimatedTabs } from "@/components/ui/animated-tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { overlayShopCatalog, shopProductFromUnknown, type ShopProduct } from "@/lib/catalog";

const MODAL_OVERLAY_EASE = [0.16, 1, 0.3, 1] as const;
const MODAL_PANEL_SPRING = { type: "spring" as const, stiffness: 420, damping: 34, mass: 0.85 };

const IMAGES = {
  hero1: "https://res.cloudinary.com/dc9xmxpvv/image/upload/v1787868461/dingry-home_lbcx9b.jpg",
  hero2: "https://images.unsplash.com/photo-1652823780977-b22c0ed84c97?w=1400&h=900&fit=crop&auto=format",
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
  cap1: "https://images.unsplash.com/photo-1732475530155-90158f3b5f79?w=800&h=1000&fit=crop&auto=format",
  cap2: "https://images.unsplash.com/photo-1579883180654-695b7f038d4c?w=800&h=1000&fit=crop&auto=format",
  sneaker1: "https://images.unsplash.com/photo-1568153487049-4431a8c15c20?w=800&h=1000&fit=crop&auto=format",
  sneaker2: "https://images.unsplash.com/photo-1763750581767-b367bcd6c117?w=800&h=1000&fit=crop&auto=format",
  tee1: "https://res.cloudinary.com/dc9xmxpvv/image/upload/v1793124730/PHOTO-2026-06-26-22-50-57_ttb7tx.jpg",
  tee2: "https://res.cloudinary.com/dc9xmxpvv/image/upload/v1793124730/PHOTO-2026-06-26-22-50-57_2_pbdovu.jpg",
  tee3: "https://res.cloudinary.com/dc9xmxpvv/image/upload/v1793124729/PHOTO-2026-06-26-22-50-56_4_r3ivag.jpg",
  tee4: "https://res.cloudinary.com/dc9xmxpvv/image/upload/v1793124729/PHOTO-2026-06-26-22-50-57_3_dsmlnj.jpg",
  tee5: "https://res.cloudinary.com/dc9xmxpvv/image/upload/v1793124728/PHOTO-2026-06-26-22-50-56_2_cxu50l.jpg",
  tee6: "https://res.cloudinary.com/dc9xmxpvv/image/upload/v1793124728/PHOTO-2026-06-26-22-50-56_tk3msx.jpg",
  tee7: "https://res.cloudinary.com/dc9xmxpvv/image/upload/v1793124727/PHOTO-2026-06-26-22-50-56_3_cnbjll.jpg",
  tee8: "https://res.cloudinary.com/dc9xmxpvv/image/upload/v1793124727/PHOTO-2026-06-26-22-50-56_6_dhs3l2.jpg",
  tee9: "https://res.cloudinary.com/dc9xmxpvv/image/upload/v1793124727/PHOTO-2026-06-26-22-50-56_7_iowqbr.jpg",
  tee10: "https://res.cloudinary.com/dc9xmxpvv/image/upload/v1793124726/PHOTO-2026-06-26-22-50-56_8_g8yqde.jpg",
  tee11: "https://res.cloudinary.com/dc9xmxpvv/image/upload/v1793124726/PHOTO-2026-06-26-22-50-57_4_uk6yej.jpg",
  tee12: "https://res.cloudinary.com/dc9xmxpvv/image/upload/v1793122204/WhatsApp_Image_2026-10-26_at_19.33.25_yzr0fb.jpg",
  tee13: "https://res.cloudinary.com/dc9xmxpvv/image/upload/v1793122204/WhatsApp_Image_2026-10-26_at_21.13.25_ypgmnf.jpg",
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

/** IDs affichés dans le catalogue (devant uniquement). Versos conservés pour Stripe / paires. */
const CATALOG_RECTO_HOODIE_IDS = new Set([2, 4, 6, 7]);
const CATALOG_RECTO_TEE_IDS = new Set([11, 13, 15, 17, 19, 21, 22, 23]);

/** Devant réel par collection (assets Cloudinary). */
const TEE_RECTO_IMAGE_BY_COLLECTION: Record<number, keyof typeof IMAGES> = {
  1: "tee4",
  3: "tee10",
  5: "tee9",
  7: "tee8",
  9: "tee9",
  11: "tee11",
};

/** Dos du même modèle que le produit recto (id catalogue), pas collection n+1. */
const TEE_VERSO_BY_RECTO_ID: Record<
  number,
  { image: keyof typeof IMAGES; variant: string }
> = {
  11: { image: "tee1", variant: "COLLECTION 01 — VERSO" },
  13: { image: "tee3", variant: "COLLECTION 03 — VERSO" },
  15: { image: "tee5", variant: "COLLECTION 05 — VERSO" },
  17: { image: "tee7", variant: "COLLECTION 07 — VERSO" },
  19: { image: "tee5", variant: "COLLECTION 09 — VERSO" },
};

function isCatalogRectoProduct(product: { id: number; category: string }): boolean {
  if (product.category === "Hoodie" || product.category === "Hoodie zippé") {
    return CATALOG_RECTO_HOODIE_IDS.has(product.id);
  }
  if (product.category === "Tee") {
    return CATALOG_RECTO_TEE_IDS.has(product.id);
  }
  return true;
}

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
    return {
      id: 11 + index,
      name: "DINGRY TEE",
      variant: `COLLECTION ${String(collection).padStart(2, "0")} — ${inCatalog ? "RECTO" : "VERSO"}`,
      price: 119,
      image: IMAGES[imageKey],
      description: inCatalog
        ? "T-shirt DINGRY en édition limitée. Vue recto."
        : "T-shirt DINGRY en édition limitée. Vue verso.",
      category: "Tee",
    };
  }),
  {
    id: 22,
    name: "DINGRY TEE FEMME",
    variant: "ORIGINAL — RECTO",
    price: 119,
    image: IMAGES.tee12,
    description: "T-shirt DINGRY femme en édition limitée. Vue recto.",
    category: "Tee",
  },
  {
    id: 23,
    name: "DINGRY TEE FEMME",
    variant: "SIGNATURE — RECTO",
    price: 119,
    image: IMAGES.tee13,
    description: "T-shirt DINGRY femme en édition limitée. Vue recto.",
    category: "Tee",
  },
  {
    id: 24,
    name: "DINGRY TEE",
    variant: "PERSONNALISÉ — RECTO",
    price: 119,
    image: IMAGES.tee11,
    description: "T-shirt noir personnalisable — ville ou texte sous le logo (+5€).",
    category: "Tee",
  },
  ];

type CartItem = {
  product: ShopProduct;
  size: string;
  qty: number;
  personalization?: string;
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
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState("Tout");
  const [catalogExpanded, setCatalogExpanded] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const [navScrolled, setNavScrolled] = useState(false);
  const [modalSide, setModalSide] = useState<"recto" | "verso">("recto");
  const [personalizeOpen, setPersonalizeOpen] = useState(false);
  const [personalizeLabel, setPersonalizeLabel] = useState("PARIS");
  const [personalizeSize, setPersonalizeSize] = useState("");
  const [personalizeQty, setPersonalizeQty] = useState(1);
  const [personalizeShirtId, setPersonalizeShirtId] = useState<(typeof PERSONALIZATION_SHIRTS)[number]["id"]>("noir");

  useEffect(() => {
    const handleWindowScroll = () => setNavScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleWindowScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleWindowScroll);
  }, []);

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

  useEffect(() => {
    setCatalogExpanded(false);
  }, [activeFilter]);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => s + cartItemUnitPrice(i) * i.qty, 0);
  const personalizationProduct = products.find((p) => p.id === 24) ?? PRODUCTS.find((p) => p.id === 24);
  const personalizePreviewLabel = personalizeLabel.trim().slice(0, PERSONALIZATION_MAX_LABEL_LENGTH).toUpperCase() || "PARIS";
  const personalizeShirt =
    PERSONALIZATION_SHIRTS.find((s) => s.id === personalizeShirtId) ?? PERSONALIZATION_SHIRTS[0];

  const filters = ["Tout", "T-shirts", "Hoodie", "Hoodie zippé", "Pants", "Caps", "Jersey", "Crop Top"];

  function isProductInActiveFilter(product: ShopProduct): boolean {
    if (activeFilter === "Tout") {
      return product.category === "Hoodie" || product.category === "Hoodie zippé" || product.category === "Tee";
    }
    return product.category === activeFilter || (activeFilter === "T-shirts" && product.category === "Tee");
  }

  const filtered = products.filter((product) => {
    if (!isProductInActiveFilter(product)) return false;
    if (catalogExpanded) return true;
    return isCatalogRectoProduct(product);
  });

  const catalogExtraProducts = products.filter(
    (product) => isProductInActiveFilter(product) && !isCatalogRectoProduct(product),
  );
  const hoodieCatalogExtras = catalogExtraProducts.filter((p) => p.category === "Hoodie");
  const showVoirPlus =
    !catalogExpanded && catalogExtraProducts.length > 0 && activeFilter !== "Hoodie";
  const showVoirPlusHoodie =
    !catalogExpanded && activeFilter === "Hoodie" && hoodieCatalogExtras.length > 0;

  function addToCart() {
    if (!selectedProduct || !selectedSize) return;
    setCart((prev) => {
      const existing = prev.find(
        (i) => i.product.id === selectedProduct.id && i.size === selectedSize && !i.personalization,
      );
      if (existing) return prev.map((i) => i === existing ? { ...i, qty: i.qty + selectedQuantity } : i);
      return [...prev, { product: selectedProduct, size: selectedSize, qty: selectedQuantity }];
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

  async function startCheckout() {
    if (checkoutLoading || cart.length === 0) return;
    setCheckoutLoading(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((item) => ({
            productId: item.product.id,
            name: item.product.name,
            size: item.size,
            quantity: item.qty,
            personalization: item.personalization,
          })),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.url) throw new Error(data.error || "Checkout unavailable");
      window.location.assign(data.url);
    } catch {
      setCheckoutLoading(false);
    }
  }

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    setNavScrolled(e.currentTarget.scrollTop > 60);
  }

  const heroImages = [IMAGES.hero1, IMAGES.hero2];
  const hoodiePairs = [
    { id: 1, color: "Bleu roi", reference: "DINGRY-H01", versoId: 1, rectoId: 2 },
    { id: 2, color: "Vert original", reference: "DINGRY-H02", versoId: 3, rectoId: 7 },
    { id: 3, color: "Noir outline zippé", reference: "DINGRY-H03", versoId: 5, rectoId: 4 },
    { id: 4, color: "Noir original", reference: "DINGRY-H04", versoId: 8, rectoId: 6 },
  ].flatMap((pair) => {
    const recto = products.find((item) => item.id === pair.rectoId);
    const verso =
      products.find((item) => item.id === pair.versoId) ??
      PRODUCTS.find((item) => item.id === pair.versoId);
    if (!recto || !verso) return [];
    return [{ ...pair, recto, verso }];
  });

  const activeHoodiePair =
    selectedProduct && ["Hoodie", "Hoodie zippé"].includes(selectedProduct.category)
      ? hoodiePairs.find((pair) => pair.verso.id === selectedProduct.id || pair.recto.id === selectedProduct.id)
      : undefined;

  const teeVersoMeta = selectedProduct ? TEE_VERSO_BY_RECTO_ID[selectedProduct.id] : undefined;
  const showModalSideToggle = Boolean(activeHoodiePair || teeVersoMeta);

  const activeModalView = (() => {
    if (!selectedProduct) return null;
    if (activeHoodiePair) {
      return modalSide === "verso" ? activeHoodiePair.verso : activeHoodiePair.recto;
    }
    if (teeVersoMeta && modalSide === "verso") {
      return {
        ...selectedProduct,
        image: IMAGES[teeVersoMeta.image],
        variant: teeVersoMeta.variant,
        description: "T-shirt DINGRY en édition limitée. Vue verso.",
      };
    }
    return selectedProduct;
  })();

  function openProductModal(product: ShopProduct) {
    setSelectedProduct(product);
    setSelectedSize("");
    setModalSide("recto");
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
    <div className="relative size-full text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <BackgroundGradientAnimation />
      <div className="relative z-10 size-full overflow-y-auto bg-transparent" onScroll={handleScroll}>

      {/* NAV */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${navScrolled ? "bg-[#12151c]/95 backdrop-blur-sm border-b border-white/[0.08]" : "bg-transparent"}`}>
        <div className="flex items-center justify-between px-6 md:px-12 py-5">
          <div className="flex items-center gap-8">
            <button
              type="button"
              onClick={() => scrollToSection("catalogue")}
              className="text-xs tracking-[0.25em] text-white/40 uppercase hidden md:block hover:text-white transition-colors"
            >
              Catalogue
            </button>
          </div>
          <a href="#" className="text-xl font-bold tracking-[0.3em] text-white">DINGRY</a>
          <div className="flex items-center gap-6">
            <span className="text-xs tracking-[0.2em] text-white/40 uppercase hidden md:block">Paris / Lyon</span>
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

      {/* HERO */}
      <section className="relative h-screen overflow-hidden">
        <div className="absolute inset-0 bg-[#050505]">
          {heroImages.map((img, i) => (
            <img
              key={i}
              src={img}
              alt="DINGRY editorial"
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
              style={{
                opacity: heroIndex === i ? 1 : 0,
                filter: "brightness(0.7) contrast(1.1) grayscale(1)",
              }}
            />
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/60 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/20 to-transparent" />

        <div className="absolute bottom-16 left-8 md:left-16 max-w-xl">
          <h1 className="text-5xl md:text-7xl font-bold leading-[0.9] tracking-tight uppercase mb-6">
            LE LUXE EST<br />DANS L&apos;ATTITUDE
          </h1>
          <p className="text-sm text-white/50 tracking-wider mb-10 leading-relaxed">
            Le luxe est dans l&apos;attitude.<br />
            Chaque pièce est une déclaration. Éditions limitées.
          </p>
          <p className="text-xs text-white/30 tracking-widest">LIVRAISON OFFERTE • RETOURS GRATUITS</p>
        </div>

        {/* Hero dots */}
        <div className="absolute bottom-10 right-8 md:right-16 flex flex-col items-center gap-3">
          {heroImages.map((_, i) => (
            <button
              key={i}
              onClick={() => setHeroIndex(i)}
              className={`w-0.5 transition-all duration-300 ${heroIndex === i ? "h-8 bg-white" : "h-3 bg-white/30"}`}
            />
          ))}
        </div>

        {/* Shot on location */}
        <div className="absolute top-8 left-8 z-20">
          <p className="text-[10px] tracking-[0.3em] text-white/30 uppercase">Shot on location — Paris / Lyon</p>
        </div>
      </section>

      {/* TICKER */}
      <div className="bg-[#0066FF] py-3 overflow-hidden">
        <div className="flex gap-16 animate-marquee whitespace-nowrap">
          {Array(4).fill(null).map((_, i) => (
            <span key={i} className="text-[11px] font-bold tracking-[0.3em] uppercase">
              ROCK THE STREET &nbsp;•&nbsp; DINGRY OFFICIEL &nbsp;��&nbsp; LIVRAISON OFFERTE &nbsp;•&nbsp; ÉDITION LIMITÉE 200 EXEMPLAIRES &nbsp;•&nbsp; @dingry_officiel &nbsp;•&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* CATALOGUE */}
      <section id="catalogue" className="px-4 pb-20 md:px-12 md:pb-24">
        <div className="mb-6 flex items-end justify-between md:mb-10">
          <div>
            <p className="mb-2 text-[10px] tracking-[0.35em] text-[#0066FF] uppercase md:mb-3">Collection Capsule</p>
            <h2 className="text-2xl font-bold tracking-tight uppercase md:text-4xl">DINGRY Catalogue</h2>
          </div>
          <p className="text-xs text-white/30 hidden md:block">Instagram @dingry_officiel</p>
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-3 md:mb-12 md:flex md:flex-wrap md:items-center md:gap-3 md:space-y-0">
          <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:overflow-visible md:px-0">
            <AnimatedTabs
              tabs={filters}
              value={activeFilter}
              onValueChange={setActiveFilter}
              layoutId="dingry-catalog-tabs"
              aria-label="Catégories du catalogue"
              className="w-max max-w-none"
            />
          </div>
          <Button
            type="button"
            variant="rotate-border"
            onClick={() => setPersonalizeOpen(true)}
            className="h-9 w-full min-h-9 whitespace-nowrap px-4 text-[10px] tracking-[0.18em] uppercase font-medium sm:w-auto md:min-h-10 md:px-5 md:text-[11px] md:tracking-[0.2em]"
          >
            Personnalisation
          </Button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
          {activeFilter === "Hoodie" ? hoodiePairs.map((pair) => (
            <ProductCard
              key={pair.id}
              name={pair.color}
              variant={pair.reference}
              description={`${pair.recto.name} · hoodie original`}
              image={pair.recto.image}
              price={pair.recto.price}
              onClick={() => openProductModal(pair.recto)}
            />
          )) : filtered.length > 0 ? filtered.map(renderProductCard) : (
            <div className="col-span-full border border-white/[0.06] py-20 text-center">
              <p className="text-[10px] tracking-[0.35em] text-[#0066FF] uppercase mb-4">Bientôt disponible</p>
              <p className="text-sm text-white/40 tracking-wider">Cette catégorie sera bientôt disponible dans le catalogue.</p>
            </div>
          )}
        </div>

        {(showVoirPlus || showVoirPlusHoodie) && (
          <div className="mt-14 flex justify-center pb-4">
            <Badge variant="rotate-border" onClick={() => setCatalogExpanded(true)}>
              Voir plus
            </Badge>
          </div>
        )}

        {catalogExpanded && activeFilter === "Hoodie" && hoodieCatalogExtras.length > 0 && (
          <div className="mt-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 border-t border-white/[0.06] pt-12">
            {hoodieCatalogExtras.map(renderProductCard)}
          </div>
        )}
      </section>

      {/* EDITORIAL STRIP */}
      <section className="border-t border-white/[0.05] px-6 md:px-12 py-20 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-[10px] tracking-[0.35em] text-[#0066FF] uppercase mb-6">DINGRY Rock The Street</p>
          <h2 className="text-4xl md:text-5xl font-bold uppercase leading-tight mb-8">
            Chaque silhouette<br />raconte l'attitude.
          </h2>
          <p className="text-sm text-white/40 leading-relaxed max-w-sm">
            DINGRY PARIS est une marque de streetwear française en plein développement, qui séduit un public toujours plus large grâce à une identité forte, un style affirmé et surtout un nom aussi original qu&apos;universel.
            <br /><br />
            DINGRY, c&apos;est peut-être l&apos;un des meilleurs noms qu&apos;une marque puisse porter aujourd&apos;hui. Un mot populaire, utilisé par toutes les générations et toutes les classes sociales, qui reflète parfaitement notre époque. Son écriture singulière en fait une signature immédiatement reconnaissable.
          </p>
        </div>
        <div className="relative" style={{ aspectRatio: "4/5" }}>
          <img
            src={IMAGES.editorial}
            alt="DINGRY editorial"
            className="w-full h-full object-cover"
            style={{ filter: "brightness(0.75) contrast(1.1) grayscale(0.4)" }}
          />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[#050505]/20" />
          <div className="absolute bottom-8 left-8">
            <p className="text-xs tracking-[0.3em] text-white/60 uppercase">Le luxe est dans l'attitude</p>
          </div>
        </div>
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
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-12"
        >
          <motion.div
            className="absolute inset-0 bg-[#050505]/90 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: MODAL_OVERLAY_EASE }}
            onClick={() => setSelectedProduct(null)}
          />
          <motion.div
            className="relative z-10 bg-[#0a0a0a] border border-white/[0.06] w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col md:flex-row"
            key={selectedProduct.id}
            initial={{ opacity: 0, scale: 0.96, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            transition={MODAL_PANEL_SPRING}
          >
            <div className="flex-1 bg-[#080808]" style={{ minHeight: 400 }}>
              <img
                src={activeModalView?.image ?? selectedProduct.image}
                alt={activeModalView?.name ?? selectedProduct.name}
                className="w-full h-full object-cover"
                style={{ filter: "brightness(0.85) contrast(1.05) grayscale(0.2)", maxHeight: 600 }}
              />
            </div>
            <div className="flex-1 p-8 md:p-10 flex flex-col justify-between">
              <div>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="absolute top-5 right-5 w-11 h-11 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
                <p className="text-[10px] tracking-[0.35em] text-[#0066FF] uppercase mb-2">{selectedProduct.category}</p>
                <h2 className="text-2xl font-bold tracking-widest uppercase mb-1">{selectedProduct.name}</h2>
                <p className="text-base tracking-[0.2em] text-white/60 uppercase mb-6">{activeModalView?.variant ?? selectedProduct.variant}</p>
                {showModalSideToggle && (
                  <div className="flex gap-2 mb-6" role="group" aria-label="Choisir la vue du produit">
                    {(["recto", "verso"] as const).map((side) => (
                      <button
                        key={side}
                        type="button"
                        onClick={() => setModalSide(side)}
                        className={`border px-4 py-2 text-[10px] tracking-[0.25em] uppercase transition-colors ${modalSide === side ? "border-white bg-white text-black" : "border-white/20 text-white/50 hover:border-white/60 hover:text-white"}`}
                      >
                        {side}
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-sm text-white/50 leading-relaxed mb-8">{activeModalView?.description ?? selectedProduct.description}</p>
                <p className="text-2xl font-bold mb-8">{selectedProduct.price}€</p>

                <div className="flex items-center justify-between mb-8 border-y border-white/[0.08] py-4">
                  <span className="text-[10px] tracking-[0.3em] text-white/40 uppercase">Quantité</span>
                  <div className="flex items-center border border-white/15">
                    <button
                      type="button"
                      onClick={() => setSelectedQuantity((quantity) => Math.max(1, quantity - 1))}
                      aria-label="Diminuer la quantité"
                      className="w-9 h-9 text-white/60 hover:bg-white hover:text-black transition-colors"
                    >−</button>
                    <span className="w-10 text-center text-sm" aria-live="polite">{selectedQuantity}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedQuantity((quantity) => Math.min(99, quantity + 1))}
                      aria-label="Augmenter la quantité"
                      className="w-9 h-9 text-white/60 hover:bg-white hover:text-black transition-colors"
                    >+</button>
                  </div>
                </div>
                <p className="text-[10px] tracking-[0.3em] text-white/40 uppercase mb-4">Select a Size</p>
                <div className={`grid gap-2 mb-8 ${(selectedProduct.sizes && selectedProduct.sizes.length > 0 ? selectedProduct.sizes : SIZES).length <= 4 ? "grid-cols-4" : "grid-cols-6"}`}>
                  {(selectedProduct.sizes && selectedProduct.sizes.length > 0 ? selectedProduct.sizes : SIZES).map((s) => (
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

      {/* CART DRAWER */}
      {cartOpen && (
        <div className="fixed inset-0 z-[70] flex justify-end">
          <div className="absolute inset-0 bg-[#050505]/80 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
          <div className="relative z-10 bg-[#0a0a0a] border-l border-white/[0.06] w-full max-w-md flex flex-col h-full">
            <div className="flex items-center justify-between p-8 border-b border-white/[0.06]">
              <div>
                <h2 className="text-sm font-bold tracking-[0.3em] uppercase">Votre Vault</h2>
                {cartCount > 0 && <p className="text-xs text-white/40 mt-1">{cartCount} article{cartCount > 1 ? "s" : ""}</p>}
              </div>
              <button onClick={() => setCartOpen(false)} className="w-10 h-10 flex items-center justify-center text-white/40 hover:text-white transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-sm tracking-[0.3em] text-white/20 uppercase mb-2">YOUR VAULT IS EMPTY</p>
                  <p className="text-xs text-white/15">Aucun article pour le moment.</p>
                </div>
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
                <button
                  type="button"
                  onClick={startCheckout}
                  disabled={checkoutLoading}
                  className="w-full py-4 bg-white text-[#050505] text-xs font-bold tracking-[0.3em] uppercase hover:bg-[#0066FF] hover:text-white transition-colors duration-300 disabled:cursor-wait disabled:opacity-60"
                >
                  {checkoutLoading ? "Redirection..." : "Payer — carte, PayPal ou Apple Pay"}
                </button>
                <p className="text-center text-[10px] text-white/20 mt-3 tracking-wider leading-relaxed">
                  Paiement sécurisé par Stripe · PayPal et Apple Pay sur la page de paiement (Safari / iPhone)
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
