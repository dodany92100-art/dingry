"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { AuthGate } from "@/components/admin/auth-gate";
import { BackupCodesBanner } from "@/components/admin/backup-codes-banner";
import { useAdminOrders } from "@/components/admin/hooks/use-admin-orders";
import { useAdminProducts } from "@/components/admin/hooks/use-admin-products";
import { useAdminSession } from "@/components/admin/hooks/use-admin-session";
import { OrdersTab } from "@/components/admin/orders-tab";
import { ProductEditorModal } from "@/components/admin/product-editor-modal";
import { ReleaseBanner } from "@/components/admin/release-banner";
import { StockTab } from "@/components/admin/stock-tab";
import { TabNav, type TabId } from "@/components/admin/tab-nav";
import {
  countLowStock,
  countPendingShipments,
  countStockPending,
  selectPaypalOrders,
} from "@/lib/admin/order-view";
import type { AdminProduct } from "@/lib/admin/types";

/** null = fermé ; { product: null } = création ; { product } = modification. */
type EditorState = { product: AdminProduct | null } | null;

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-[11px] uppercase tracking-[0.35em] text-white/40">DINGRY</p>
    </div>
  );
}

export default function AdminPage() {
  const session = useAdminSession();
  const { authenticated, expire } = session;
  const productsApi = useAdminProducts({ onUnauthorized: expire });
  const ordersApi = useAdminOrders({ onUnauthorized: expire });
  const { load: loadProducts, reset: resetProducts } = productsApi;
  const { load: loadOrders, reset: resetOrders } = ordersApi;

  const [tab, setTab] = useState<TabId>("commandes");
  const [editor, setEditor] = useState<EditorState>(null);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState("");

  // Session valide → chargement du tableau de bord. 401 → retour au login.
  useEffect(() => {
    if (!authenticated) {
      setLoaded(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      setLoadError("");
      const [productsResult, ordersResult] = await Promise.all([loadProducts(), loadOrders()]);
      if (cancelled) return;
      if (productsResult === "unauthorized" || ordersResult === "unauthorized") {
        expire();
        return;
      }
      if (productsResult !== "ok" || ordersResult !== "ok") {
        setLoadError("Impossible de charger le CRM.");
      }
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [authenticated, loadProducts, loadOrders, expire]);

  const paypalOrders = useMemo(() => selectPaypalOrders(ordersApi.orders), [ordersApi.orders]);
  const pendingOrders = useMemo(() => countPendingShipments(paypalOrders), [paypalOrders]);
  const stockPendingCount = useMemo(() => countStockPending(ordersApi.orders), [ordersApi.orders]);
  const lowStockCount = useMemo(() => countLowStock(productsApi.products), [productsApi.products]);

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
    setEditor(null);
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

  return (
    <div className="min-h-screen">
      {session.backupCodes ? (
        <BackupCodesBanner codes={session.backupCodes} onDismiss={session.dismissBackupCodes} />
      ) : null}
      <AdminHeader
        pendingOrders={pendingOrders}
        stockPendingCount={stockPendingCount}
        lowStockCount={lowStockCount}
        onLogout={() => void handleLogout()}
      />
      <ReleaseBanner />

      <div className="px-6 py-6 md:px-10">
        <TabNav tab={tab} onChange={setTab} />

        {loadError ? <p className="mb-6 text-sm text-red-400">{loadError}</p> : null}

        {editor ? (
          <ProductEditorModal
            key={editor.product?.id ?? "new"}
            initial={editor.product}
            busyProductId={productsApi.busyProductId}
            onClose={() => setEditor(null)}
            onSubmit={productsApi.save}
            onDelete={handleDelete}
          />
        ) : null}

        {tab === "produits" ? (
          <StockTab
            products={productsApi.products}
            busyProductId={productsApi.busyProductId}
            error={productsApi.stockError}
            onChangeStock={(product, delta) => void productsApi.changeStock(product, delta)}
            onEdit={openEdit}
            onNew={openNew}
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
    </div>
  );
}
