import { useEffect } from "react";

/** Empêche fermeture / rechargement navigateur pendant upload ou save CRM. */
export function useAdminUploadGuard(busy: boolean): void {
  useEffect(() => {
    if (!busy) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [busy]);
}
