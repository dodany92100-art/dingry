"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { prepareProductImage } from "@/lib/client/prepare-product-image";
import {
  ORDER_STATUSES,
  PRODUCT_CATEGORIES,
  PRODUCT_SIZES,
  type AdminOrder,
  type AdminProduct,
  type OrderStatus,
  type ProductCategory,
  type ProductSize,
} from "@/lib/admin/types";

type TabId = "produits" | "commandes";

const EMPTY_FORM = {
  sku: "DINGRY-",
  name: "",
  variant: "",
  description: "",
  category: "Tee" as ProductCategory,
  price: "119",
  stock: "10",
  sizes: ["S", "M", "L", "XL"] as ProductSize[],
};

function formatPrice(value: number): string {
  return `${value.toLocaleString("fr-FR")}€`;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusClass(status: OrderStatus): string {
  if (status === "Expédié") return "border-[#0066FF]/40 bg-[#0066FF]/15 text-[#7EB3FF]";
  if (status === "Livré") return "border-white/20 bg-white/10 text-white";
  return "border-white/10 bg-white/[0.04] text-white/55";
}

export default function AdminPage() {
  const [booting, setBooting] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [blobEnabled, setBlobEnabled] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [totpQr, setTotpQr] = useState("");
  const [totpEnrollment, setTotpEnrollment] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [tab, setTab] = useState<TabId>("produits");
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [sku, setSku] = useState(EMPTY_FORM.sku);
  const [name, setName] = useState(EMPTY_FORM.name);
  const [variant, setVariant] = useState(EMPTY_FORM.variant);
  const [description, setDescription] = useState(EMPTY_FORM.description);
  const [category, setCategory] = useState<ProductCategory>(EMPTY_FORM.category);
  const [price, setPrice] = useState(EMPTY_FORM.price);
  const [stock, setStock] = useState(EMPTY_FORM.stock);
  const [sizes, setSizes] = useState<ProductSize[]>(EMPTY_FORM.sizes);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [convertingImage, setConvertingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [busyProductId, setBusyProductId] = useState<string | null>(null);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);

  const lowStockCount = useMemo(
    () => products.filter((product) => product.stock <= 3).length,
    [products],
  );

  const pendingOrders = useMemo(
    () => orders.filter((order) => order.status === "En attente").length,
    [orders],
  );

  const previewPrice = Number(price);
  const previewImage = imagePreview || products.find((item) => item.id === editingId)?.imageUrl || "";

  const resetForm = useCallback(() => {
    setEditingId(null);
    setSku(EMPTY_FORM.sku);
    setName(EMPTY_FORM.name);
    setVariant(EMPTY_FORM.variant);
    setDescription(EMPTY_FORM.description);
    setCategory(EMPTY_FORM.category);
    setPrice(EMPTY_FORM.price);
    setStock(EMPTY_FORM.stock);
    setSizes([...EMPTY_FORM.sizes]);
    setImageFile(null);
    setImagePreview("");
    setFormError("");
    setFormSuccess("");
  }, []);

  function fillForm(product: AdminProduct) {
    setEditingId(product.id);
    setSku(product.sku);
    setName(product.name);
    setVariant(product.variant);
    setDescription(product.description);
    setCategory(product.category);
    setPrice(String(product.price));
    setStock(String(product.stock));
    setSizes([...product.sizes]);
    setImageFile(null);
    setImagePreview("");
    setFormError("");
    setFormSuccess("");
  }

  const loadDashboard = useCallback(async () => {
    setLoadError("");
    const [productsRes, ordersRes] = await Promise.all([
      fetch("/api/admin/products", { cache: "no-store" }),
      fetch("/api/admin/orders", { cache: "no-store" }),
    ]);

    if (productsRes.status === 401 || ordersRes.status === 401) {
      setAuthenticated(false);
      return;
    }

    if (!productsRes.ok || !ordersRes.ok) {
      setLoadError("Impossible de charger le CRM.");
      return;
    }

    const productsData = (await productsRes.json()) as {
      products: AdminProduct[];
      blobEnabled?: boolean;
    };
    const ordersData = (await ordersRes.json()) as { orders: AdminOrder[] };
    setProducts(productsData.products);
    setOrders(ordersData.orders);
    if (typeof productsData.blobEnabled === "boolean") {
      setBlobEnabled(productsData.blobEnabled);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        const sessionRes = await fetch("/api/admin/session", { cache: "no-store" });
        if (cancelled) return;
        if (!sessionRes.ok) {
          setAuthenticated(false);
          return;
        }
        const session = (await sessionRes.json()) as {
          authenticated: boolean;
          blobEnabled?: boolean;
        };
        setAuthenticated(true);
        setBlobEnabled(Boolean(session.blobEnabled));
        await loadDashboard();
      } catch {
        if (!cancelled) setAuthenticated(false);
      } finally {
        if (!cancelled) setBooting(false);
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [loadDashboard]);

  useEffect(() => {
    if (!imageFile) return;
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  useEffect(() => {
    if (booting || authenticated) return;
    let cancelled = false;

    async function loadTotpQr() {
      try {
        const response = await fetch("/api/admin/totp", { cache: "no-store" });
        const data = (await response.json()) as { showEnrollment?: boolean; qrDataUrl?: string };
        if (cancelled) return;
        const show = Boolean(data.showEnrollment);
        setTotpEnrollment(show);
        setTotpQr(show && typeof data.qrDataUrl === "string" ? data.qrDataUrl : "");
      } catch {
        if (!cancelled) {
          setTotpQr("");
          setTotpEnrollment(false);
        }
      }
    }

    void loadTotpQr();
    return () => {
      cancelled = true;
    };
  }, [authenticated, booting]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: totpCode }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setLoginError(data.error || "Code incorrect ou expiré.");
        return;
      }
      setTotpCode("");
      setAuthenticated(true);
      setBooting(true);
      await loadDashboard();
    } catch {
      setLoginError("Connexion impossible.");
    } finally {
      setLoginLoading(false);
      setBooting(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthenticated(false);
    setProducts([]);
    setOrders([]);
    setTotpCode("");
    resetForm();
  }

  async function acceptProductImage(selected: File | null) {
    setFormError("");
    setFormSuccess("");
    if (!selected) {
      setImageFile(null);
      return;
    }
    setConvertingImage(true);
    try {
      setImageFile(await prepareProductImage(selected));
    } catch (error) {
      setImageFile(null);
      setFormError(error instanceof Error ? error.message : "Conversion impossible.");
    } finally {
      setConvertingImage(false);
    }
  }

  function toggleSize(size: ProductSize) {
    setSizes((current) =>
      current.includes(size)
        ? current.filter((item) => item !== size)
        : [...current, size],
    );
  }

  function appendProductFields(formData: FormData) {
    formData.set("sku", sku.trim());
    formData.set("name", name.trim());
    formData.set("variant", variant.trim());
    formData.set("description", description.trim());
    formData.set("category", category);
    formData.set("price", price);
    formData.set("stock", stock);
    formData.set("sizes", sizes.join(","));
    if (imageFile) formData.set("image", imageFile);
  }

  async function handleSubmitProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (convertingImage) {
      setFormError("Conversion de l'image en cours.");
      return;
    }
    if (!editingId && !imageFile) {
      setFormError("Ajoute une image produit.");
      return;
    }
    if (sizes.length === 0) {
      setFormError("Sélectionne au moins une taille.");
      return;
    }

    const formData = new FormData();
    appendProductFields(formData);
    setSaving(true);
    try {
      const response = await fetch(
        editingId ? `/api/admin/products/${editingId}` : "/api/admin/products",
        {
          method: editingId ? "PATCH" : "POST",
          body: formData,
        },
      );
      const data = (await response.json()) as { product?: AdminProduct; error?: string };
      if (!response.ok || !data.product) {
        setFormError(data.error || "Impossible d'enregistrer le produit.");
        return;
      }
      setProducts((current) => {
        if (editingId) {
          return current.map((item) => (item.id === editingId ? data.product as AdminProduct : item));
        }
        return [data.product as AdminProduct, ...current];
      });
      fillForm(data.product);
      setImageFile(null);
      setFormSuccess("Catalogue boutique mis à jour.");
    } catch {
      setFormError("Impossible d'enregistrer le produit.");
    } finally {
      setSaving(false);
    }
  }

  async function changeStock(product: AdminProduct, delta: number) {
    if (product.stock + delta < 0) return;
    setBusyProductId(product.id);
    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stockDelta: delta }),
      });
      const data = (await response.json()) as { product?: AdminProduct };
      if (response.ok && data.product) {
        setProducts((current) =>
          current.map((item) => (item.id === product.id ? data.product as AdminProduct : item)),
        );
        if (editingId === product.id) setStock(String(data.product.stock));
      }
    } finally {
      setBusyProductId(null);
    }
  }

  async function handleDeleteProduct(product: AdminProduct) {
    const confirmed = window.confirm(
      `Supprimer « ${product.name} » du catalogue et son image${product.blobUrl ? " Vercel Blob" : ""} ?`,
    );
    if (!confirmed) return;
    setBusyProductId(product.id);
    try {
      const response = await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
      if (response.ok) {
        setProducts((current) => current.filter((item) => item.id !== product.id));
        if (editingId === product.id) resetForm();
      }
    } finally {
      setBusyProductId(null);
    }
  }

  async function handleCycleOrderStatus(order: AdminOrder) {
    setBusyOrderId(order.id);
    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = (await response.json()) as { order?: AdminOrder };
      if (response.ok && data.order) {
        setOrders((current) =>
          current.map((item) => (item.id === order.id ? data.order as AdminOrder : item)),
        );
      }
    } finally {
      setBusyOrderId(null);
    }
  }

  if (booting) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-[11px] uppercase tracking-[0.35em] text-white/40">DINGRY</p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-md border border-white/10 bg-[#0a0a0a] p-8"
        >
          <p className="text-[11px] uppercase tracking-[0.4em] text-white/40">CRM</p>
          <h1 className="mt-3 text-2xl font-bold tracking-[0.28em]">DINGRY</h1>
          <p className="mt-2 text-sm text-white/45">Google Authenticator</p>
          {totpEnrollment ? (
            totpQr ? (
              <div className="mt-6 flex justify-center bg-white p-3">
                <img src={totpQr} alt="QR Google Authenticator DINGRY Admin" className="h-[280px] w-[280px]" />
              </div>
            ) : (
              <p className="mt-6 text-sm text-white/40">Chargement du QR…</p>
            )
          ) : null}
          <p className="mt-4 text-sm leading-relaxed text-white/45">
            {totpEnrollment
              ? "En local uniquement : scanne ce QR une fois dans Google Authenticator, puis entre le code à 6 chiffres."
              : "Entre le code à 6 chiffres affiché dans Google Authenticator pour le compte DINGRY Admin."}
          </p>
          <label className="mt-6 block text-[10px] uppercase tracking-[0.25em] text-white/40">
            Code à 6 chiffres
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={totpCode}
              onChange={(event) => setTotpCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              required
              className="mt-2 h-11 w-full border border-white/15 bg-black px-3 text-center text-lg tracking-[0.4em] text-white outline-none focus:border-white/50"
            />
          </label>
          {loginError ? <p className="mt-3 text-sm text-red-400">{loginError}</p> : null}
          <button
            type="submit"
            disabled={loginLoading}
            className="mt-6 h-11 w-full bg-white text-xs font-bold uppercase tracking-[0.25em] text-black transition hover:bg-white/90 disabled:opacity-50"
          >
            {loginLoading ? "Vérification…" : "Entrer"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-white/[0.08] px-6 py-5 md:px-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-white/40">Administration</p>
            <h1 className="mt-1 text-xl font-bold tracking-[0.28em]">DINGRY CRM</h1>
          </div>
          <div className="flex flex-wrap items-center gap-5 text-[11px] uppercase tracking-[0.2em] text-white/45">
            <span>{products.length} produits</span>
            <span>{pendingOrders} en attente</span>
            {lowStockCount > 0 ? <span className="text-[#7EB3FF]">{lowStockCount} stock bas</span> : null}
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="border border-white/15 px-3 py-2 text-white/80 transition hover:border-white/40 hover:text-white"
            >
              Aperçu du site
            </a>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="text-white/70 transition hover:text-white"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <div className="px-6 py-6 md:px-10">
        {!blobEnabled ? (
          <p className="mb-6 border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/55">
            Vercel Blob n&apos;est pas configuré. Les images sont stockées localement.
            Ajoute BLOB_READ_WRITE_TOKEN dans .env pour l&apos;upload et la suppression Blob.
          </p>
        ) : null}

        <div className="mb-8 flex gap-2">
          {([
            ["produits", "Produits & stock"],
            ["commandes", "Commandes"],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`h-10 px-4 text-[11px] uppercase tracking-[0.22em] transition ${
                tab === id
                  ? "bg-white text-black"
                  : "border border-white/10 text-white/50 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loadError ? <p className="mb-6 text-sm text-red-400">{loadError}</p> : null}

        {tab === "produits" ? (
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
            <form
              onSubmit={handleSubmitProduct}
              className="h-fit border border-white/10 bg-[#0a0a0a] p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xs uppercase tracking-[0.28em] text-white/70">
                  {editingId ? "Modifier le produit" : "Nouveau produit"}
                </h2>
                {editingId ? (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="text-[10px] uppercase tracking-[0.18em] text-white/40 hover:text-white"
                  >
                    Nouveau
                  </button>
                ) : null}
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="block text-[10px] uppercase tracking-[0.22em] text-white/40">
                  Référence (SKU)
                  <input
                    value={sku}
                    onChange={(event) => setSku(event.target.value)}
                    required
                    className="mt-2 h-10 w-full border border-white/12 bg-black px-3 text-sm text-white outline-none focus:border-white/40"
                  />
                </label>
                <label className="block text-[10px] uppercase tracking-[0.22em] text-white/40">
                  Catégorie
                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value as ProductCategory)}
                    className="mt-2 h-10 w-full border border-white/12 bg-black px-3 text-sm text-white outline-none focus:border-white/40"
                  >
                    {PRODUCT_CATEGORIES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="mt-4 block text-[10px] uppercase tracking-[0.22em] text-white/40">
                Nom / Titre
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  className="mt-2 h-10 w-full border border-white/12 bg-black px-3 text-sm text-white outline-none focus:border-white/40"
                />
              </label>
              <label className="mt-4 block text-[10px] uppercase tracking-[0.22em] text-white/40">
                Variante
                <input
                  value={variant}
                  onChange={(event) => setVariant(event.target.value)}
                  className="mt-2 h-10 w-full border border-white/12 bg-black px-3 text-sm text-white outline-none focus:border-white/40"
                />
              </label>
              <label className="mt-4 block text-[10px] uppercase tracking-[0.22em] text-white/40">
                Description
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={3}
                  className="mt-2 w-full border border-white/12 bg-black px-3 py-2 text-sm text-white outline-none focus:border-white/40"
                />
              </label>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <label className="block text-[10px] uppercase tracking-[0.22em] text-white/40">
                  Prix (€)
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={price}
                    onChange={(event) => setPrice(event.target.value)}
                    required
                    className="mt-2 h-10 w-full border border-white/12 bg-black px-3 text-sm text-white outline-none focus:border-white/40"
                  />
                </label>
                <label className="block text-[10px] uppercase tracking-[0.22em] text-white/40">
                  Stock
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={stock}
                    onChange={(event) => setStock(event.target.value)}
                    required
                    className="mt-2 h-10 w-full border border-white/12 bg-black px-3 text-sm text-white outline-none focus:border-white/40"
                  />
                </label>
              </div>
              <p className="mt-4 text-[10px] uppercase tracking-[0.22em] text-white/40">Tailles</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {PRODUCT_SIZES.map((size) => {
                  const active = sizes.includes(size);
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => toggleSize(size)}
                      className={`h-9 min-w-10 px-3 text-xs tracking-[0.15em] ${
                        active ? "bg-white text-black" : "border border-white/15 text-white/50"
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
              <label className="mt-5 block text-[10px] uppercase tracking-[0.22em] text-white/40">
                {editingId ? "Remplacer l'image" : "Image"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={convertingImage}
                  onChange={(event) => {
                    const selected = event.target.files?.[0] ?? null;
                    event.target.value = "";
                    void acceptProductImage(selected);
                  }}
                  className="mt-2 w-full text-sm text-white/70 file:mr-3 file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-bold file:uppercase file:tracking-[0.18em] file:text-black disabled:opacity-50"
                />
              </label>
              <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-white/35">
                {convertingImage
                  ? "Conversion WebP…"
                  : imageFile
                    ? `WebP prêt · ${Math.max(1, Math.round(imageFile.size / 1024))} Ko`
                    : "Jusqu'à 10 Mo · enregistré en WebP, 1 Mo maximum"}
              </p>
              {formError ? <p className="mt-3 text-sm text-red-400">{formError}</p> : null}
              {formSuccess ? <p className="mt-3 text-sm text-white/70">{formSuccess}</p> : null}
              <button
                type="submit"
                disabled={saving || convertingImage}
                className="mt-5 h-11 w-full bg-white text-[11px] font-bold uppercase tracking-[0.22em] text-black disabled:opacity-50"
              >
                {saving ? "Envoi…" : editingId ? "Mettre à jour le site" : "Ajouter au catalogue"}
              </button>
            </form>

            <div>
              <p className="mb-3 text-[10px] uppercase tracking-[0.22em] text-white/40">
                Aperçu données
              </p>
              {previewImage && name.trim() ? (
                <div className="border border-white/10 bg-[#0a0a0a] p-4">
                  <div className="overflow-hidden" style={{ aspectRatio: "3/4" }}>
                    <img src={previewImage} alt="" className="h-full w-full object-cover" />
                  </div>
                  <p className="mt-4 text-[10px] uppercase tracking-[0.22em] text-white/40">{name.trim()}</p>
                  <p className="mt-1 text-sm uppercase tracking-widest text-white/80">
                    {variant.trim() || sku.trim() || "VARIANTE"}
                  </p>
                  {description.trim() ? (
                    <p className="mt-2 text-sm text-white/45">{description.trim()}</p>
                  ) : null}
                  <p className="mt-4 text-sm font-bold">
                    {Number.isFinite(previewPrice) && previewPrice > 0 ? `${previewPrice}€` : "—"}
                  </p>
                </div>
              ) : (
                <div className="border border-dashed border-white/15 px-4 py-16 text-center text-sm text-white/35">
                  Saisis un nom et une image pour voir les données produit.
                </div>
              )}
            </div>
          </div>
        ) : null}

        {tab === "produits" ? (
          <div className="mt-8 overflow-x-auto border border-white/10">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-white/10 text-[10px] uppercase tracking-[0.22em] text-white/40">
                <tr>
                  <th className="px-4 py-3 font-medium">Produit</th>
                  <th className="px-4 py-3 font-medium">SKU</th>
                  <th className="px-4 py-3 font-medium">Prix</th>
                  <th className="px-4 py-3 font-medium">Tailles</th>
                  <th className="px-4 py-3 font-medium">Stock</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-white/40">
                      Aucun produit pour le moment.
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id} className="border-b border-white/[0.06]">
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => fillForm(product)}
                          className="flex items-center gap-3 text-left"
                        >
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="h-14 w-11 object-cover"
                          />
                          <div>
                            <p className="text-xs uppercase tracking-[0.12em] text-white/90">
                              {product.name}
                            </p>
                            <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-white/30">
                              {product.variant || "Sans variante"}
                            </p>
                          </div>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-white/55">{product.sku}</td>
                      <td className="px-4 py-3 font-medium">{formatPrice(product.price)}</td>
                      <td className="px-4 py-3 text-white/55">{product.sizes.join(" · ")}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={busyProductId === product.id || product.stock === 0}
                            onClick={() => void changeStock(product, -1)}
                            className="h-8 w-8 border border-white/15 text-white/70 hover:text-white disabled:opacity-30"
                          >
                            −
                          </button>
                          <span className={`min-w-8 text-center ${product.stock <= 3 ? "text-[#7EB3FF]" : ""}`}>
                            {product.stock}
                          </span>
                          <button
                            type="button"
                            disabled={busyProductId === product.id}
                            onClick={() => void changeStock(product, 1)}
                            className="h-8 w-8 border border-white/15 text-white/70 hover:text-white disabled:opacity-30"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => fillForm(product)}
                            className="text-[11px] uppercase tracking-[0.18em] text-white/60 hover:text-white"
                          >
                            Éditer
                          </button>
                          <button
                            type="button"
                            disabled={busyProductId === product.id}
                            onClick={() => void handleDeleteProduct(product)}
                            className="text-[11px] uppercase tracking-[0.18em] text-red-400 hover:text-red-300 disabled:opacity-40"
                          >
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="border border-white/10">
            <div className="hidden border-b border-white/10 px-4 py-3 text-[10px] uppercase tracking-[0.22em] text-white/40 lg:grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.2fr)_5.5rem_minmax(0,1.3fr)_9.5rem] lg:gap-4">
              <span>Client</span>
              <span>Email</span>
              <span>Montant</span>
              <span>Articles</span>
              <span>Statut</span>
            </div>
            {orders.length === 0 ? (
              <p className="px-4 py-10 text-sm text-white/40">Aucune commande récente.</p>
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="grid gap-3 border-b border-white/[0.06] px-4 py-4 last:border-b-0 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.2fr)_5.5rem_minmax(0,1.3fr)_9.5rem] lg:items-center lg:gap-4"
                >
                  <div>
                    <p className="text-sm text-white/90">{order.customerName}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-white/30">
                      {formatDate(order.createdAt)} · {order.source === "stripe" ? "Stripe" : "Démo"}
                    </p>
                  </div>
                  <p className="text-sm text-white/60">{order.email}</p>
                  <p className="text-sm font-medium">{formatPrice(order.total)}</p>
                  <div className="text-sm text-white/65">
                    {order.items.map((item) => (
                      <p key={item}>{item}</p>
                    ))}
                  </div>
                  <div>
                    <button
                      type="button"
                      disabled={busyOrderId === order.id}
                      onClick={() => void handleCycleOrderStatus(order)}
                      className={`h-9 px-3 text-[11px] uppercase tracking-[0.16em] border ${statusClass(order.status)} disabled:opacity-40`}
                    >
                      {order.status}
                    </button>
                    <p className="mt-2 text-[10px] uppercase tracking-[0.12em] text-white/25">
                      {ORDER_STATUSES.join(" → ")}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
