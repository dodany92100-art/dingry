"use client";

import { useState } from "react";
import type { AdminStockViewMode } from "@/components/organisms/admin/admin-stock-view-toggle";

export function useAdminStockViewPrefs() {
  const [viewMode, setViewMode] = useState<AdminStockViewMode>("grid");
  const [storefrontPreview, setStorefrontPreview] = useState(false);
  return { viewMode, setViewMode, storefrontPreview, setStorefrontPreview };
}
