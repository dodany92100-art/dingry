export type FlyTarget = "cart" | "favorites";

export function queryFlyTargetRect(target: FlyTarget): DOMRect | null {
  const node = document.querySelector(`[data-fly-target="${target}"]`);
  return node?.getBoundingClientRect() ?? null;
}
