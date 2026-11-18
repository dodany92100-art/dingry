"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { finishDingryRouteProgress, subscribeDingryRouteProgress } from "@/lib/dingry-route-progress";

function DingryRouteProgressBarInner() {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams.toString()}`;
  const initialKey = useRef(routeKey);
  const pendingNav = useRef(false);

  useEffect(() => subscribeDingryRouteProgress((v, on) => {
    setProgress(v);
    setVisible(on);
    if (on) pendingNav.current = true;
  }), []);

  useEffect(() => {
    if (routeKey === initialKey.current) return;
    initialKey.current = routeKey;
    if (pendingNav.current || visible) {
      finishDingryRouteProgress();
      pendingNav.current = false;
    }
  }, [routeKey, visible]);

  if (!visible && progress <= 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[9999] h-[3px] overflow-hidden"
      role="progressbar"
      aria-hidden={!visible}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
    >
      <div
        className="h-full w-full origin-left bg-gradient-to-r from-[#c9a85c] via-[#ff3d00] to-[#e8d5a8] shadow-[0_0_12px_rgba(255,61,0,0.45)] transition-[transform,opacity] duration-200 ease-out motion-reduce:transition-none"
        style={{
          transform: `scaleX(${Math.max(0.02, progress)})`,
          opacity: visible ? 1 : 0,
        }}
      />
    </div>
  );
}

export function DingryRouteProgressBar() {
  return (
    <Suspense fallback={null}>
      <DingryRouteProgressBarInner />
    </Suspense>
  );
}