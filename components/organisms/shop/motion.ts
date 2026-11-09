export const MODAL_OVERLAY_EASE = [0.16, 1, 0.3, 1] as const;
export const MODAL_OVERLAY_TRANSITION = { duration: 0.14, ease: MODAL_OVERLAY_EASE } as const;
/** Ouverture GPU-only (opacity + scale), sans spring ni translation. */
export const MODAL_PANEL_SPRING = {
  duration: 0.15,
  ease: MODAL_OVERLAY_EASE,
} as const;
export const DRAWER_PANEL_SPRING = { type: "spring" as const, stiffness: 380, damping: 36, mass: 0.9 };
