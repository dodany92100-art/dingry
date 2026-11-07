"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminHeader } from "@/components/organisms/admin/admin-header";
import { AdminGridWorkflowBanner } from "@/components/organisms/admin/admin-grid-workflow-banner";
import { AuthGate } from "@/components/organisms/admin/auth-gate";
import { BackupCodesBanner } from "@/components/organisms/admin/backup-codes-banner";
import { useAdminLookbook } from "@/components/organisms/admin/hooks/use-admin-lookbook";
import { useAdminOrders } from "@/components/organisms/admin/hooks/use-admin-orders";
import { useAdminProducts } from "@/components/organisms/admin/hooks/use-admin-products";
import { useAdminSession } from "@/components/organisms/admin/hooks/use-admin-session";
import { LookbookEditorModal } from "@/components/organisms/admin/lookbook-editor-modal";
import { LookbookTab } from "@/components/organisms/admin/lookbook-tab";
import { OrdersTab } from "@/components/organisms/admin/orders-tab";
import { ProductEditorModal } from "@/components/organisms/admin/product-editor-modal";
import { ReleaseBanner } from "@/components/organisms/admin/release-banner";
import { StockTab } from "@/components/organisms/admin/stock-tab";
import { TabNav, type TabId } from "@/components/organisms/admin/tab-nav";
import {
  countLowStock,
  countPendingShipments,
  countStockPending,
  selectPaypalOrders,
  sumProductStock,
} from "@/lib/admin/order-view";
import type { AdminLookbookSlide, AdminProduct } from "@/lib/admin/types";

/** null = fermé ; { product: null } = création ; { product } = modification. */
type EditorState = { product: AdminProduct | null } | null;
type LookbookEditorState = { slide: AdminLookbookSlide | null } | null;

function parseTabParam(value: string | null): TabId {
  if (value === "produits" || value === "brouillons" || value === "commandes" || value === "lookbook") {
    return value;
  }
  return "commandes";
}

function LoadingScreen() {
  return (
    <div className="dingry-admin flex min-h-screen items-center justify-center">
      <p className="text-[11px] uppercase tracking-[0.35em] text-white/40">DINGRY</p>
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
  const productsApi = useAdminProducts({ onUnauthorized: expire });
  const ordersApi = useAdminOrders({ onUnauthorized: expire });
  const lookbookApi = useAdminLookbook({ onUnauthorized: expire });
  const { load: loadProducts, reset: resetProducts } = productsApi;
  const { load: loadOrders, reset: resetOrders } = ordersApi;
  const { load: loadLookbook, reset: resetLookbook } = lookbookApi;

  const [tab, setTab] = useState<TabId>(() => parseTabParam(searchParams.get("tab")));
  const [editor, setEditor] = useState<EditorState>(null);
  const [lookbookEditor, setLookbookEditor] = useState<LookbookEditorState>(null);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [visibleDraftIds, setVisibleDraftIds] = useState<string[]>([]);

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
  const showWorkflowBanner = workflowPhase !== null;

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
  }, [searchParams]);

  function selectTab(next: TabId) {
    setTab(next);
    const params = new URLSearchParams(searchParams.toString());
    if (next === "commandes") params.delete("tab");
    else params.set("tab", next);
    const query = params.toString();
    router.replace(query ? `/admin?${query}` : "/admin", { scroll: false });
  }

  // Session valide → chargement du tableau de bord. 401 → retour au login.
  useEffect(() => {
    if (!authenticated) {
      setLoaded(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      setLoadError("");
      const [productsResult, ordersResult, lookbookResult] = await Promise.all([
        loadProducts(),
        loadOrders(),
        loadLookbook(),
      ]);
      if (cancelled) return;
      if (
        productsResult === "unauthorized" ||
        ordersResult === "unauthorized" ||
        lookbookResult === "unauthorized"
      ) {
        expire();
        return;
      }
      if (productsResult !== "ok" || ordersResult !== "ok" || lookbookResult !== "ok") {
        setLoadError("Impossible de charger le CRM.");
      }
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [authenticated, loadProducts, loadOrders, loadLookbook, expire]);

  const paypalOrders = useMemo(() => selectPaypalOrders(ordersApi.orders), [ordersApi.orders]);
  const pendingOrders = useMemo(() => countPendingShipments(paypalOrders), [paypalOrders]);
  const stockPendingCount = useMemo(() => countStockPending(ordersApi.orders), [ordersApi.orders]);
  const lowStockCount = useMemo(() => countLowStock(productsApi.products), [productsApi.products]);
  const totalStock = useMemo(() => sumProductStock(productsApi.products), [productsApi.products]);

  function openNew() {
    setEditor({ product: null });
  }

  function openEdit(product: AdminProduct) {
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    setEditor(null);
    setLookbookEditor(null);
  }

  async function handleDeleteLookbookSlide(slide: AdminLookbookSlide): Promise<boolean> {
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

  if (session.booting || (authenticated && !loaded)) return <LoadingScreen />;

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
        existingSkus={existingProductSkus}
        busyProductId={productsApi.busyProductId}
        onClose={() => setEditor(null)}
        onSubmit={productsApi.save}
        onDelete={handleDelete}
      />
    );
  }

  return (
    <div className="min-h-screen">
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

      <div className={`px-6 py-6 md:px-10${showWorkflowBanner ? " pb-28" : ""}`}>
        <TabNav tab={tab} onChange={selectTab} />

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
          <StockTab
            products={productsApi.products}
            busyProductId={productsApi.busyProductId}
            error={productsApi.stockError}
            publishFilter={tab === "brouillons" ? "draft" : "live"}
            gridLocked={gridLocked}
            productEditorOpen={false}
            onVisibleDraftIdsChange={onVisibleDraftIdsChange}
            onChangeStock={(product, delta) => void productsApi.changeStock(product, delta)}
            onSetStock={(product, next) => void productsApi.setStock(product, next)}
            onEdit={openEdit}
            onNew={openNew}
            onTogglePin={(product) => void productsApi.togglePin(product)}
            onDelete={(product) => {
              void productsApi.remove(product).then((error) => {
                if (error) window.alert(error);
              });
            }}
            onReorderProducts={productsApi.reorderProductsLocal}
          />
        ) : tab === "lookbook" ? (
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
          />
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
          onReset={productsApi.discardProductOrder}
          onValidateGrid={() => void productsApi.saveProductOrder()}
          onPublishSelection={() => void productsApi.publishSelectionLive(visibleDraftIds)}
        />
      ) : null}
    </div>
  );
}
