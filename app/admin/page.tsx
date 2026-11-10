"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminHeader } from "@/components/organisms/admin/admin-header";
import { AdminGridWorkflowBanner } from "@/components/organisms/admin/admin-grid-workflow-banner";
import { AdminCrmPassage } from "@/components/organisms/admin/admin-crm-passage";
import { AuthGate } from "@/components/organisms/admin/auth-gate";
import { BackupCodesBanner } from "@/components/organisms/admin/backup-codes-banner";
import { useAdminCatalogPersoBanner } from "@/components/organisms/admin/hooks/use-admin-catalog-perso-banner";
import { useAdminLookbook } from "@/components/organisms/admin/hooks/use-admin-lookbook";
import { useAdminOrders } from "@/components/organisms/admin/hooks/use-admin-orders";
import { useAdminProducts } from "@/components/organisms/admin/hooks/use-admin-products";
import { useAdminSession } from "@/components/organisms/admin/hooks/use-admin-session";
import { CatalogPersoBannerTab } from "@/components/organisms/admin/catalog-perso-banner-tab";
import { LookbookTab } from "@/components/organisms/admin/lookbook-tab";
import { OrdersTab } from "@/components/organisms/admin/orders-tab";
import { ReleaseBanner } from "@/components/organisms/admin/release-banner";
import { AdminActionToast } from "@/components/organisms/admin/admin-action-toast";
import { AdminCrmTabRow } from "@/components/organisms/admin/admin-crm-tab-row";
import { AdminStockMobileContextSelect } from "@/components/organisms/admin/admin-stock-mobile-context-select";
import { AdminStockPreviewToggle } from "@/components/organisms/admin/admin-stock-preview-toggle";
import { AdminStockViewToggle } from "@/components/organisms/admin/admin-stock-view-toggle";
import { useAdminStockViewPrefs } from "@/components/organisms/admin/hooks/use-admin-stock-view-prefs";
import { StockTab } from "@/components/organisms/admin/stock-tab";
import { type TabId } from "@/components/organisms/admin/tab-nav";
import {
  countLowStock,
  countPendingShipments,
  countStockPending,
  selectPaypalOrders,
  sumProductStock,
} from "@/lib/admin/order-view";
import { sanitizeAdminLoginNext } from "@/lib/admin/login-next";
import {
  adminCategoryQueryValue,
  parseAdminCategoryParam,
  parseAdminProductParam,
  readAdminScrollSnapshot,
  saveAdminScrollSnapshot,
} from "@/lib/admin/crm-navigation-state";
import type { AdminLookbookSlideView, AdminProduct } from "@/lib/admin/types";
import type { AdminProductCategoryFilter } from "@/lib/shop-data";

const ProductEditorModal = dynamic(
  () =>
    import("@/components/organisms/admin/product-editor-modal").then((m) => ({
      default: m.ProductEditorModal,
    })),
  { ssr: false },
);

const LookbookEditorModal = dynamic(
  () =>
    import("@/components/organisms/admin/lookbook-editor-modal").then((m) => ({
      default: m.LookbookEditorModal,
    })),
  { ssr: false },
);

/** null = fermé ; { product: null } = création ; { product } = modification. */
type EditorState = { product: AdminProduct | null } | null;
type LookbookEditorState = { slide: AdminLookbookSlideView | null } | null;

function parseTabParam(value: string | null): TabId {
  if (
    value === "produits" ||
    value === "brouillons" ||
    value === "commandes" ||
    value === "lookbook" ||
    value === "banniere"
  ) {
    return value;
  }
  return "produits";
}

function LoadingScreen({ status = "CRM · chargement" }: { status?: string }) {
  return (
    <div className="dingry-admin flex min-h-screen items-center justify-center px-6">
      <AdminCrmPassage status={status} />
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <AdminDashboard />
    </Suspense>
  );
}

function AdminDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const session = useAdminSession();
  const { authenticated, expire } = session;
  const stockViewPrefs = useAdminStockViewPrefs();
  const productsApi = useAdminProducts({ onUnauthorized: expire });
  const ordersApi = useAdminOrders({ onUnauthorized: expire });
  const lookbookApi = useAdminLookbook({ onUnauthorized: expire });
  const persoBannerApi = useAdminCatalogPersoBanner({ onUnauthorized: expire });
  const { load: loadProducts, reset: resetProducts } = productsApi;
  const { load: loadOrders, reset: resetOrders } = ordersApi;
  const { load: loadLookbook, reset: resetLookbook } = lookbookApi;
  const { load: loadPersoBanner, reset: resetPersoBanner } = persoBannerApi;

  const [tab, setTab] = useState<TabId>(() => parseTabParam(searchParams.get("tab")));
  const [categoryFilter, setCategoryFilter] = useState<AdminProductCategoryFilter>(() =>
    parseAdminCategoryParam(searchParams.get("cat")),
  );
  const [editor, setEditor] = useState<EditorState>(null);
  const [lookbookEditor, setLookbookEditor] = useState<LookbookEditorState>(null);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [visibleDraftIds, setVisibleDraftIds] = useState<string[]>([]);
  const loginNext = useMemo(
    () => sanitizeAdminLoginNext(searchParams.get("next")),
    [searchParams],
  );
  const wantsShopRedirect = loginNext !== "/admin";

  const onVisibleDraftIdsChange = useCallback((ids: string[]) => {
    setVisibleDraftIds(ids);
  }, []);

  const existingProductSkus = useMemo(
    () => productsApi.products.map((p) => p.sku),
    [productsApi.products],
  );

  const gridLocked = productsApi.gridValidated && !productsApi.orderDirty;
  const workflowPhase = productsApi.orderDirty
    ? ("ordering" as const)
    : productsApi.gridValidated && visibleDraftIds.length > 0
      ? ("publish" as const)
      : null;
  const showWorkflowBanner =
    workflowPhase !== null && (tab === "produits" || tab === "brouillons");

  useEffect(() => {
    if (productsApi.gridValidated && !productsApi.orderDirty && visibleDraftIds.length === 0) {
      productsApi.clearGridValidated();
    }
  }, [
    productsApi.gridValidated,
    productsApi.orderDirty,
    visibleDraftIds.length,
    productsApi.clearGridValidated,
  ]);

  useEffect(() => {
    setTab(parseTabParam(searchParams.get("tab")));
    setCategoryFilter(parseAdminCategoryParam(searchParams.get("cat")));
  }, [searchParams]);

  const replaceAdminQuery = useCallback(
    (patch: { tab?: TabId; cat?: AdminProductCategoryFilter; product?: string | null }) => {
      const params = new URLSearchParams(searchParams.toString());
      if (patch.tab !== undefined) {
        if (patch.tab === "produits") params.delete("tab");
        else params.set("tab", patch.tab);
      }
      if (patch.cat !== undefined) {
        const catValue = adminCategoryQueryValue(patch.cat);
        if (catValue) params.set("cat", catValue);
        else params.delete("cat");
      }
      if (patch.product !== undefined) {
        if (patch.product) params.set("product", patch.product);
        else params.delete("product");
      }
      const query = params.toString();
      router.replace(query ? `/admin?${query}` : "/admin", { scroll: false });
    },
    [router, searchParams],
  );

  const persistListScroll = useCallback(() => {
    if (editor) return;
    if (tab !== "produits" && tab !== "brouillons") return;
    saveAdminScrollSnapshot({ y: window.scrollY, tab, cat: categoryFilter });
  }, [categoryFilter, editor, tab]);

  useEffect(() => {
    if (!loaded || editor) return;
    if (tab !== "produits" && tab !== "brouillons") return;
    const snap = readAdminScrollSnapshot();
    if (!snap || snap.tab !== tab || snap.cat !== categoryFilter) return;
    const id = window.requestAnimationFrame(() => {
      window.scrollTo({ top: snap.y, left: 0, behavior: "auto" });
    });
    return () => window.cancelAnimationFrame(id);
  }, [loaded, editor, tab, categoryFilter]);

  useEffect(() => {
    if (!loaded || editor) return;
    if (tab !== "produits" && tab !== "brouillons") return;
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        persistListScroll();
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [loaded, editor, tab, persistListScroll]);

  useEffect(() => {
    if (!loaded) return;
    const productParam = parseAdminProductParam(searchParams.get("product"));
    if (!productParam) {
      setEditor(null);
      return;
    }
    if (productParam === "new") {
      setEditor({ product: null });
      return;
    }
    const product = productsApi.products.find((item) => item.id === productParam);
    if (product) {
      setEditor((prev) => (prev?.product?.id === product.id ? prev : { product }));
    } else {
      setEditor(null);
    }
  }, [loaded, searchParams, productsApi.products]);

  useEffect(() => {
    if (!authenticated || session.backupCodes || !wantsShopRedirect) return;
    router.replace(loginNext);
  }, [authenticated, session.backupCodes, wantsShopRedirect, loginNext, router]);

  function dismissBackupThenRedirect() {
    session.dismissBackupCodes();
    if (wantsShopRedirect) router.replace(loginNext);
  }

  function selectTab(next: TabId) {
    setTab(next);
    persistListScroll();
    replaceAdminQuery({ tab: next });
  }

  function selectCategory(next: AdminProductCategoryFilter) {
    setCategoryFilter(next);
    saveAdminScrollSnapshot({ y: window.scrollY, tab, cat: next });
    replaceAdminQuery({ cat: next });
  }

  function closeProductEditor() {
    setEditor(null);
    replaceAdminQuery({ product: null });
    const snap = readAdminScrollSnapshot();
    if (snap) {
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: snap.y, left: 0, behavior: "auto" });
      });
    }
  }

  // Session valide → chargement du tableau de bord. 401 → retour au login.
  useEffect(() => {
    if (!authenticated || wantsShopRedirect) {
      setLoaded(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      setLoadError("");
      const [productsResult, ordersResult, lookbookResult, bannerResult] = await Promise.all([
        loadProducts(),
        loadOrders(),
        loadLookbook(),
        loadPersoBanner(),
      ]);
      if (cancelled) return;
      if (
        productsResult === "unauthorized" ||
        ordersResult === "unauthorized" ||
        lookbookResult === "unauthorized" ||
        bannerResult === "unauthorized"
      ) {
        expire();
        return;
      }
      if (
        productsResult !== "ok" ||
        ordersResult !== "ok" ||
        lookbookResult !== "ok" ||
        bannerResult !== "ok"
      ) {
        setLoadError("Impossible de charger le CRM.");
      }
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [authenticated, wantsShopRedirect, loadProducts, loadOrders, loadLookbook, loadPersoBanner, expire]);

  const paypalOrders = useMemo(() => selectPaypalOrders(ordersApi.orders), [ordersApi.orders]);
  const pendingOrders = useMemo(() => countPendingShipments(paypalOrders), [paypalOrders]);
  const stockPendingCount = useMemo(() => countStockPending(ordersApi.orders), [ordersApi.orders]);
  const lowStockCount = useMemo(() => countLowStock(productsApi.products), [productsApi.products]);
  const totalStock = useMemo(() => sumProductStock(productsApi.products), [productsApi.products]);

  function openNew() {
    persistListScroll();
    replaceAdminQuery({ product: "new" });
    setEditor({ product: null });
  }

  function openEdit(product: AdminProduct) {
    persistListScroll();
    replaceAdminQuery({ product: product.id });
    setEditor({ product });
  }

  async function handleDelete(product: AdminProduct): Promise<boolean> {
    const confirmed = window.confirm(
      `Supprimer « ${product.name} » de Dingry collection et son image${product.blobUrl ? " Vercel Blob" : ""} ?`,
    );
    if (!confirmed) return false;
    const error = await productsApi.remove(product);
    if (error) {
      window.alert(error);
      return false;
    }
    return true;
  }

  async function handleLogout() {
    await session.logout();
    resetProducts();
    resetOrders();
    resetLookbook();
    resetPersoBanner();
    setEditor(null);
    setLookbookEditor(null);
  }

  async function handleDeleteLookbookSlide(slide: AdminLookbookSlideView): Promise<boolean> {
    const confirmed = window.confirm(`Supprimer la slide « ${slide.title} » ?`);
    if (!confirmed) return false;
    const error = await lookbookApi.remove(slide);
    if (error) {
      lookbookApi.setError(error);
      window.alert(error);
      return false;
    }
    return true;
  }

  if (authenticated && wantsShopRedirect && session.backupCodes) {
    return (
      <div className="dingry-admin min-h-screen bg-black text-white">
        <BackupCodesBanner codes={session.backupCodes} onDismiss={dismissBackupThenRedirect} />
      </div>
    );
  }

  if (authenticated && wantsShopRedirect && !session.backupCodes) {
    return <LoadingScreen status="Ouverture boutique…" />;
  }

  if (session.booting || session.loginLoading || (authenticated && !loaded)) {
    const status = session.loginLoading
      ? "CRM · authenticator"
      : session.booting
        ? "CRM · session"
        : "CRM · données";
    return <LoadingScreen status={status} />;
  }

  if (!authenticated) {
    return (
      <AuthGate
        code={session.totpCode}
        onCodeChange={session.setTotpCode}
        onSubmit={() => void session.login()}
        enrollment={session.totpEnrollment}
        qr={session.totpQr}
        error={session.loginError}
        loading={session.loginLoading}
      />
    );
  }

  if (editor) {
    return (
      <ProductEditorModal
        key={editor.product?.id ?? "new"}
        initial={editor.product}
        makerTemplates={productsApi.makerTemplates}
        onMakerTemplatesChange={() => void productsApi.refreshMakerTemplates()}
        existingSkus={existingProductSkus}
        busyProductId={productsApi.busyProductId}
        onClose={closeProductEditor}
        onStartNewProduct={() => {
          replaceAdminQuery({ product: "new" });
          setEditor({ product: null });
        }}
        onProductPersisted={(product) => {
          replaceAdminQuery({ product: product.id });
          setEditor({ product });
        }}
        onSubmit={productsApi.save}
        onDelete={handleDelete}
      />
    );
  }

  return (
    <div className="dingry-admin min-h-screen bg-[#070b14]">
      {session.backupCodes ? (
        <BackupCodesBanner codes={session.backupCodes} onDismiss={session.dismissBackupCodes} />
      ) : null}
      <AdminHeader
        pendingOrders={pendingOrders}
        stockPendingCount={stockPendingCount}
        lowStockCount={lowStockCount}
        totalStock={totalStock}
        onLogout={() => void handleLogout()}
      />
      <ReleaseBanner />

      <div className={`dingry-admin px-6 py-4 md:px-10 md:py-6${showWorkflowBanner ? " pb-28" : ""}`}>
        <AdminCrmTabRow
          tab={tab}
          onChange={selectTab}
          hideStockTabsOnNarrow={tab === "produits" || tab === "brouillons"}
          trailing={
            tab === "produits" || tab === "brouillons" ? (
              <div className="flex w-full items-center justify-end gap-2.5 md:hidden">
                <AdminStockPreviewToggle
                  active={stockViewPrefs.storefrontPreview}
                  onChange={stockViewPrefs.setStorefrontPreview}
                />
                {!stockViewPrefs.storefrontPreview ? (
                  <AdminStockViewToggle
                    mode={stockViewPrefs.viewMode}
                    onChange={stockViewPrefs.setViewMode}
                  />
                ) : null}
              </div>
            ) : undefined
          }
        />

        {loadError ? <p className="mb-6 text-sm text-red-400">{loadError}</p> : null}

        {lookbookEditor ? (
          <LookbookEditorModal
            key={lookbookEditor.slide?.id ?? "new-lookbook"}
            initial={lookbookEditor.slide}
            busySlideId={lookbookApi.busySlideId}
            onClose={() => setLookbookEditor(null)}
            onSubmit={lookbookApi.save}
            onDelete={handleDeleteLookbookSlide}
          />
        ) : null}

        {tab === "produits" || tab === "brouillons" ? (
          <>
            <AdminActionToast toast={productsApi.stockToast} onDismiss={productsApi.dismissStockToast} />
          <StockTab
            products={productsApi.products}
            busyProductId={productsApi.busyProductId}
            error={productsApi.stockError}
            publishFilter={tab === "brouillons" ? "draft" : "live"}
            gridLocked={gridLocked}
            productEditorOpen={Boolean(editor)}
            stockAutosaveStatus={productsApi.stockAutosaveStatus}
            onVisibleDraftIdsChange={onVisibleDraftIdsChange}
            onChangeStock={(product, delta) => productsApi.changeStock(product, delta)}
            onSetStock={(product, next) => productsApi.setStock(product, next)}
            onEdit={openEdit}
            onNew={openNew}
            onTogglePin={(product) => void productsApi.togglePin(product)}
            onDelete={(product) => {
              void productsApi.remove(product).then((error) => {
                if (error) window.alert(error);
              });
            }}
            onReorderProducts={productsApi.reorderProductsLocal}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={selectCategory}
            onUnauthorized={expire}
            viewMode={stockViewPrefs.viewMode}
            onViewModeChange={stockViewPrefs.setViewMode}
            storefrontPreview={stockViewPrefs.storefrontPreview}
            onStorefrontPreviewChange={stockViewPrefs.setStorefrontPreview}
            mobileContextSlot={
              <AdminStockMobileContextSelect
                tab={tab}
                categoryFilter={categoryFilter}
                onTabChange={selectTab}
                onCategoryChange={selectCategory}
              />
            }
            desktopToolbarSlot={
              <>
                <AdminStockPreviewToggle
                  active={stockViewPrefs.storefrontPreview}
                  onChange={stockViewPrefs.setStorefrontPreview}
                />
                {!stockViewPrefs.storefrontPreview ? (
                  <AdminStockViewToggle
                    mode={stockViewPrefs.viewMode}
                    onChange={stockViewPrefs.setViewMode}
                  />
                ) : null}
              </>
            }
          />
          </>
        ) : tab === "banniere" ? (
          <>
            <AdminActionToast toast={persoBannerApi.toast} onDismiss={persoBannerApi.dismissToast} />
          <CatalogPersoBannerTab
            banner={persoBannerApi.banner}
            customized={persoBannerApi.customized}
            saving={persoBannerApi.saving}
            error={persoBannerApi.error}
            onSave={persoBannerApi.save}
          />
          </>
        ) : tab === "lookbook" ? (
          <>
            <AdminActionToast toast={lookbookApi.toast} onDismiss={lookbookApi.dismissToast} />
          <LookbookTab
            slides={lookbookApi.slides}
            busySlideId={lookbookApi.busySlideId}
            error={lookbookApi.error}
            onNew={() => setLookbookEditor({ slide: null })}
            onEdit={(slide) => setLookbookEditor({ slide })}
            onReorder={(slide, direction) => {
              void lookbookApi.reorder(slide, direction).then((err) => {
                if (err) lookbookApi.setError(err);
              });
            }}
            onDelete={(slide) => {
              void handleDeleteLookbookSlide(slide);
            }}
          />
          </>
        ) : (
          <OrdersTab
            orders={paypalOrders}
            busyOrderId={ordersApi.busyOrderId}
            error={ordersApi.orderError}
            onCycleStatus={(order) => void ordersApi.cycleStatus(order)}
            onResolveReview={(order, reason) => void ordersApi.resolveReview(order, reason)}
          />
        )}
      </div>
      {showWorkflowBanner && workflowPhase ? (
        <AdminGridWorkflowBanner
          phase={workflowPhase}
          orderSaving={productsApi.orderSaving}
          publishSaving={productsApi.publishSaving}
          draftCount={visibleDraftIds.length}
          orderError={productsApi.stockError}
          onReset={productsApi.discardProductOrder}
          onValidateGrid={() => void productsApi.saveProductOrder()}
          onPublishSelection={() => void productsApi.publishSelectionLive(visibleDraftIds)}
        />
      ) : null}
    </div>
  );
}
