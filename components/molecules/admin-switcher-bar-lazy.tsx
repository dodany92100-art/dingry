"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

const AdminSwitcherBar = dynamic(
  () =>
    import("@/components/molecules/admin-switcher-bar").then((m) => ({
      default: m.AdminSwitcherBar,
    })),
  { ssr: false },
);

/** Chargé globalement ; le widget ne s’affiche qu’après session admin valide (`AdminSwitcherBar`). */
export function AdminSwitcherBarLazy() {
  return (
    <Suspense fallback={null}>
      <AdminSwitcherBar />
    </Suspense>
  );
}
