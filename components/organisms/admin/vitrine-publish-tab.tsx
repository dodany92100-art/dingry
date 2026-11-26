"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import { resolveShopHeroSlideImageUrl, type ShopHeroMediaMap } from "@/lib/shop-hero-media";
import type { AdminLookbookSlideView } from "@/lib/admin/types";
import { ImageFocusControl } from "@/components/molecules/admin/image-focus-control";
import { ShopHeroFramingField } from "@/components/molecules/admin/shop-hero-framing-field";
import { prepareAndUploadAdminImage } from "@/lib/client/admin-media-upload";
import { R2_VITRINE_AMBIENCE_FOLDER } from "@/lib/client/admin-upload-image";
import {
  DEFAULT_SHOP_HERO_FRAMING_DEFAULTS,
  SHOP_HERO_SLIDES,
  type ShopHeroSlide,
} from "@/lib/shop-hero-slides";
import type { ShopHeroFramingMap } from "@/lib/shop-hero-framing";
import {
  DEFAULT_SHOP_VITRINE_AMBIENCE,
  type ShopVitrineAmbienceConfig,
} from "@/lib/shop-vitrine-ambience";
import {
  ADMIN_CRM_GLASS_PANEL,
  ADMIN_CRM_VITRINE_PUBLISH_BTN,
  ADMIN_CRM_VITRINE_RESET_BTN,
} from "@/components/organisms/admin/admin-crm-field-styles";
import { useAdminUploadGuard } from "./hooks/use-admin-upload-guard";
import { VitrineStorefrontCopySection } from "@/components/organisms/admin/vitrine-storefront-copy-section";

type VitrinePublishTabProps = {
  lookbookSlides: readonly AdminLookbookSlideView[];
  onUnauthorized: () => void;
};

type AmbienceSaveStatus = "idle" | "saving" | "saved" | "error";

function resolveHeroSlideSrc(
  slide: ShopHeroSlide,
  lookbookSlides: readonly AdminLookbookSlideView[],
): string {
  if (slide.id !== "lookbook-hero") return slide.src;
  const stored = [...lookbookSlides]
    .filter((row) => row.source === "stored" && row.imageUrl.trim())
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const first = stored[0] ?? lookbookSlides.find((row) => row.imageUrl.trim());
  return first?.imageUrl.trim() ? first.imageUrl : slide.src;
}

export function VitrinePublishTab({ lookbookSlides, onUnauthorized }: VitrinePublishTabProps) {
  const [framingMap, setFramingMap] = useState<ShopHeroFramingMap>({ ...DEFAULT_SHOP_HERO_FRAMING_DEFAULTS });
  const [framingBaseline, setFramingBaseline] = useState<ShopHeroFramingMap>({ ...DEFAULT_SHOP_HERO_FRAMING_DEFAULTS });
  const [framingLoaded, setFramingLoaded] = useState(false);
  const [ambience, setAmbience] = useState<ShopVitrineAmbienceConfig>(DEFAULT_SHOP_VITRINE_AMBIENCE);
  const [ambienceBaseline, setAmbienceBaseline] = useState<ShopVitrineAmbienceConfig>(DEFAULT_SHOP_VITRINE_AMBIENCE);
  const [ambienceLoaded, setAmbienceLoaded] = useState(false);
  const [ambienceDirty, setAmbienceDirty] = useState(false);
  const [ambienceStatus, setAmbienceStatus] = useState<AmbienceSaveStatus>("idle");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [heroDirtyBySlide, setHeroDirtyBySlide] = useState<Record<string, boolean>>({});
  const [copyDirty, setCopyDirty] = useState(false);
  const [resetVersion, setResetVersion] = useState(0);
  const [heroMedia, setHeroMedia] = useState<ShopHeroMediaMap>({});
  const [heroMediaBaseline, setHeroMediaBaseline] = useState<ShopHeroMediaMap>({});
  const [factoryResetting, setFactoryResetting] = useState(false);

  useAdminUploadGuard(uploadingImage);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [framingRes, ambienceRes, mediaRes] = await Promise.all([
          fetch("/api/admin/shop/hero-framing", { cache: "no-store" }),
          fetch("/api/admin/shop/vitrine-ambience", { cache: "no-store" }),
          fetch("/api/admin/shop/hero-media", { cache: "no-store" }),
        ]);
        if (framingRes.status === 401 || ambienceRes.status === 401 || mediaRes.status === 401) {
          onUnauthorized();
          return;
        }
        if (!cancelled && framingRes.ok) {
          const payload = (await framingRes.json()) as { framing?: ShopHeroFramingMap };
          if (payload.framing) {
            setFramingMap(payload.framing);
            setFramingBaseline(payload.framing);
          }
        }
        if (!cancelled && ambienceRes.ok) {
          const payload = (await ambienceRes.json()) as { ambience?: ShopVitrineAmbienceConfig };
          if (payload.ambience) {
            setAmbience(payload.ambience);
            setAmbienceBaseline(payload.ambience);
          }
        }
        if (!cancelled && mediaRes.ok) {
          const payload = (await mediaRes.json()) as { media?: ShopHeroMediaMap };
          if (payload.media) {
            setHeroMedia(payload.media);
            setHeroMediaBaseline(payload.media);
          }
        }
      } finally {
        if (!cancelled) {
          setFramingLoaded(true);
          setAmbienceLoaded(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [onUnauthorized]);

  const heroSlides = useMemo(
    () =>
      SHOP_HERO_SLIDES.map((slide) => {
        const fallback = resolveHeroSlideSrc(slide, lookbookSlides);
        const src = resolveShopHeroSlideImageUrl(slide.id, fallback, heroMedia);
        return { slide, src };
      }),
    [heroMedia, lookbookSlides],
  );

  const patchAmbience = useCallback((patch: Partial<ShopVitrineAmbienceConfig>) => {
    setAmbience((prev) => ({ ...prev, ...patch }));
    setAmbienceDirty(true);
    setAmbienceStatus("idle");
  }, []);

  async function handleAmbienceDrop(file: File) {
    setUploadingImage(true);
    const result = await prepareAndUploadAdminImage(file, {
      folder: R2_VITRINE_AMBIENCE_FOLDER,
      contentImage: true,
    });
    setUploadingImage(false);
    if (!result.ok) return;
    const url = result.uploaded?.url ?? "";
    if (!url) return;
    patchAmbience({ imageUrl: url });
  }

  async function resetAmbienceToFactory() {
    if (uploadingImage || ambienceStatus === "saving") return;
    if (
      !window.confirm(
        "Réinitialiser le visuel d’ambiance (panier, favoris, modale) sur l’image et le cadrage d’origine ?",
      )
    ) {
      return;
    }
    setAmbienceStatus("saving");
    try {
      const response = await fetch("/api/admin/shop/vitrine-ambience", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(DEFAULT_SHOP_VITRINE_AMBIENCE),
      });
      if (response.status === 401) {
        onUnauthorized();
        return;
      }
      if (!response.ok) {
        setAmbienceStatus("error");
        return;
      }
      const payload = (await response.json()) as { ambience?: ShopVitrineAmbienceConfig };
      if (payload.ambience) {
        setAmbience(payload.ambience);
        setAmbienceBaseline(payload.ambience);
      }
      setAmbienceDirty(false);
      setAmbienceStatus("saved");
    } catch {
      setAmbienceStatus("error");
    }
  }

  async function saveAmbience() {
    if (!ambienceDirty || ambienceStatus === "saving") return;
    setAmbienceStatus("saving");
    try {
      const response = await fetch("/api/admin/shop/vitrine-ambience", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(ambience),
      });
      if (response.status === 401) {
        onUnauthorized();
        return;
      }
      if (!response.ok) {
        setAmbienceStatus("error");
        return;
      }
      const payload = (await response.json()) as { ambience?: ShopVitrineAmbienceConfig };
      if (payload.ambience) {
        setAmbience(payload.ambience);
        setAmbienceBaseline(payload.ambience);
      }
      setAmbienceDirty(false);
      setAmbienceStatus("saved");
    } catch {
      setAmbienceStatus("error");
    }
  }

  const heroDirty = Object.values(heroDirtyBySlide).some(Boolean);
  const pageDirty = ambienceDirty || heroDirty || copyDirty;

  function discardAmbience() {
    setAmbience(ambienceBaseline);
    setAmbienceDirty(false);
    setAmbienceStatus("idle");
  }

  function discardAllPageChanges() {
    setFramingMap({ ...framingBaseline });
    setHeroMedia({ ...heroMediaBaseline });
    discardAmbience();
    setHeroDirtyBySlide({});
    setResetVersion((value) => value + 1);
  }

  const discardBusy = ambienceStatus === "saving" || uploadingImage || factoryResetting;

  async function resetToFactoryDefaults() {
    if (
      !window.confirm(
        "Réinitialiser les réglages de base du bandeau d’accueil (cadrages + images hero) sur la vitrine ?",
      )
    ) {
      return;
    }
    setFactoryResetting(true);
    try {
      const [framingRes, mediaRes] = await Promise.all([
        fetch("/api/admin/shop/hero-framing", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ resetAll: true }),
        }),
        fetch("/api/admin/shop/hero-media", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ resetAll: true }),
        }),
      ]);
      if (framingRes.status === 401 || mediaRes.status === 401) {
        onUnauthorized();
        return;
      }
      const defaults = { ...DEFAULT_SHOP_HERO_FRAMING_DEFAULTS };
      setFramingMap(defaults);
      setFramingBaseline(defaults);
      setHeroMedia({});
      setHeroMediaBaseline({});
      setHeroDirtyBySlide({});
      setResetVersion((value) => value + 1);
    } finally {
      setFactoryResetting(false);
    }
  }

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-[10px] uppercase tracking-[0.22em] text-white/40">Mise en ligne vitrine</p>
          <p className="mt-2 text-sm leading-relaxed text-white/50">
            Cadrage au scalpel des visuels d&apos;accueil et des panneaux panier, favoris et fiche produit. Les images
            lookbook du hero proviennent de l&apos;onglet Lookbook.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 self-start sm:mt-1">
          <button
            type="button"
            disabled={discardBusy}
            onClick={() => void resetToFactoryDefaults()}
            className={`${ADMIN_CRM_VITRINE_RESET_BTN} gap-2`}
            aria-label="Réinitialiser les réglages de base"
            title="Réinitialiser cadrages et images hero (défaut vitrine)"
          >
            <RotateCcw className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            <span className="hidden sm:inline">Réinitialiser</span>
          </button>
          <button
            type="button"
            disabled={!pageDirty || discardBusy}
            onClick={discardAllPageChanges}
            className="h-10 rounded-full border border-white/20 px-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70 transition hover:border-white/35 hover:text-white disabled:opacity-35"
          >
            Annuler les modifications
          </button>
        </div>
      </header>

      <section className={`${ADMIN_CRM_GLASS_PANEL} space-y-5`}>
        <div className="border-b border-white/[0.08] pb-4">
          <h3 className="text-[10px] uppercase tracking-[0.2em] text-white/70">Bandeau d&apos;accueil</h3>
          <p className="mt-1 text-[10px] leading-relaxed tracking-[0.06em] text-white/35">
            Glisser-déposer sur chaque visuel pour remplacer l&apos;image · lookbook par défaut via l&apos;onglet Lookbook
            si aucune image CRM.
          </p>
        </div>
        {!framingLoaded ? (
          <p className="text-sm text-white/40">Chargement des réglages hero…</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {heroSlides.map(({ slide, src }) => (
              <ShopHeroFramingField
                key={slide.id}
                slideId={slide.id}
                label={slide.alt}
                imageUrl={src}
                defaultFraming={slide.defaultFraming}
                framingMap={framingMap}
                resetVersion={resetVersion}
                onDirtyChange={(dirty) =>
                  setHeroDirtyBySlide((prev) => (prev[slide.id] === dirty ? prev : { ...prev, [slide.id]: dirty }))
                }
                onMapSaved={(map) => {
                  setFramingMap(map);
                  setFramingBaseline(map);
                }}
                onImageSaved={(id, imageUrl) => {
                  setHeroMedia((prev) => ({ ...prev, [id]: imageUrl }));
                  setHeroMediaBaseline((prev) => ({ ...prev, [id]: imageUrl }));
                }}
                onImageCleared={(id) => {
                  setHeroMedia((prev) => {
                    const next = { ...prev };
                    delete next[id];
                    return next;
                  });
                  setHeroMediaBaseline((prev) => {
                    const next = { ...prev };
                    delete next[id];
                    return next;
                  });
                }}
              />
            ))}
          </div>
        )}
      </section>

      <section className={`${ADMIN_CRM_GLASS_PANEL} space-y-5`}>
        <div className="border-b border-white/[0.08] pb-4">
          <h3 className="text-[10px] uppercase tracking-[0.2em] text-white/70">
            Panneau panier · favoris · modale produit
          </h3>
          <p className="mt-1 max-w-lg text-[10px] leading-relaxed tracking-[0.06em] text-white/35">
            Un seul visuel d&apos;ambiance pour le tiroir panier (desktop), les favoris et l&apos;arrière-plan de la
            fiche produit.
          </p>
        </div>
        {!ambienceLoaded ? (
          <p className="text-sm text-white/40">Chargement…</p>
        ) : (
          <div className="max-w-3xl space-y-4">
            <ImageFocusControl
              imageUrl={ambience.imageUrl}
              focusX={ambience.focusX}
              focusY={ambience.focusY}
              frameVariant="cart-drawer-ambience"
              disabled={uploadingImage || ambienceStatus === "saving"}
              onChange={({ focusX, focusY }) => patchAmbience({ focusX, focusY })}
              onDropFile={(file) => void handleAmbienceDrop(file)}
              uploading={uploadingImage}
            />
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={ambienceStatus === "saving" || uploadingImage}
                onClick={() => void resetAmbienceToFactory()}
                className={ADMIN_CRM_VITRINE_RESET_BTN}
              >
                Réinitialiser
              </button>
              <button
                type="button"
                disabled={!ambienceDirty || ambienceStatus === "saving" || uploadingImage}
                onClick={discardAmbience}
                className="h-10 rounded-full border border-white/20 px-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/65 transition hover:border-white/35 hover:text-white disabled:opacity-35"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={!ambienceDirty || ambienceStatus === "saving" || uploadingImage}
                onClick={() => void saveAmbience()}
                className={ADMIN_CRM_VITRINE_PUBLISH_BTN}
              >
                <span className="gold-text">
                  {ambienceStatus === "saving" ? "Publication…" : "Mettre en ligne"}
                </span>
              </button>
              {uploadingImage ? (
                <span className="text-[10px] uppercase tracking-[0.14em] text-white/45">Upload…</span>
              ) : null}
              {ambienceStatus === "saved" ? (
                <span className="text-[10px] uppercase tracking-[0.14em] text-emerald-400/90">Vitrine à jour</span>
              ) : null}
              {ambienceStatus === "error" ? (
                <span className="text-[10px] uppercase tracking-[0.14em] text-red-400/90">Échec — réessaie</span>
              ) : null}
            </div>
          </div>
        )}
      </section>

      <VitrineStorefrontCopySection
        onUnauthorized={onUnauthorized}
        resetVersion={resetVersion}
        onDirtyChange={setCopyDirty}
      />
    </div>
  );
}