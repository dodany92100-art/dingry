"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

const LONG_PRESS_MS = 340;
const SCROLL_CANCEL_PX = 12;

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest("button, input, textarea, select, a, label, [data-admin-no-reorder]"),
  );
}

const ADMIN_DROP_HINT_EVENT = "dingry-admin-drop-hint";

function publishDropHint(index: number | null): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<number | null>(ADMIN_DROP_HINT_EVENT, { detail: index }));
}

function dragIndexAt(clientY: number): number | null {
  const nodes = document.querySelectorAll<HTMLElement>("[data-admin-drag-index]");
  for (const node of nodes) {
    const rect = node.getBoundingClientRect();
    if (clientY < rect.top || clientY > rect.bottom) continue;
    const index = Number(node.dataset.adminDragIndex);
    if (Number.isInteger(index)) return index;
  }
  return null;
}

type AdminReorderSurfaceProps = {
  dragIndex: number;
  disabled?: boolean;
  busy?: boolean;
  onDrop: (fromIndex: number, toIndex: number) => void;
  className?: string;
  children: ReactNode;
};

/** Carte / ligne entière draggable — HTML5 (desktop) · appui long puis glisser (mobile, scroll préservé). */
export function AdminReorderSurface({
  dragIndex,
  disabled = false,
  busy = false,
  onDrop,
  className = "",
  children,
}: AdminReorderSurfaceProps) {
  const [touchDragging, setTouchDragging] = useState(false);
  const [dropHintIndex, setDropHintIndex] = useState<number | null>(null);
  const armTimerRef = useRef<number | null>(null);
  const pointerRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    armed: boolean;
  } | null>(null);

  const reorderDisabled = disabled || busy;

  const clearArmTimer = useCallback(() => {
    if (armTimerRef.current !== null) {
      window.clearTimeout(armTimerRef.current);
      armTimerRef.current = null;
    }
  }, []);

  const resetPointer = useCallback(() => {
    clearArmTimer();
    pointerRef.current = null;
    setTouchDragging(false);
    publishDropHint(null);
    document.body.style.touchAction = "";
  }, [clearArmTimer]);

  useEffect(() => {
    const onHint = (event: Event) => {
      const detail = (event as CustomEvent<number | null>).detail;
      setDropHintIndex(detail ?? null);
    };
    window.addEventListener(ADMIN_DROP_HINT_EVENT, onHint);
    return () => window.removeEventListener(ADMIN_DROP_HINT_EVENT, onHint);
  }, []);

  const setHint = useCallback((index: number | null) => {
    publishDropHint(index);
  }, []);

  const onDragStart = (event: DragEvent<HTMLDivElement>) => {
    if (reorderDisabled) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(dragIndex));
  };

  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (reorderDisabled) return;
    event.preventDefault();
  };

  const onDragDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (reorderDisabled) return;
    const from = Number(event.dataTransfer.getData("text/plain"));
    if (!Number.isInteger(from) || from === dragIndex) return;
    onDrop(from, dragIndex);
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (reorderDisabled || isInteractiveTarget(event.target)) return;
    if (event.pointerType === "mouse") return;

    clearArmTimer();
    pointerRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      armed: false,
    };

    armTimerRef.current = window.setTimeout(() => {
      const current = pointerRef.current;
      if (!current || current.pointerId !== event.pointerId) return;
      current.armed = true;
      setTouchDragging(true);
      document.body.style.touchAction = "none";
      event.currentTarget.setPointerCapture(event.pointerId);
    }, LONG_PRESS_MS);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const current = pointerRef.current;
    if (!current || current.pointerId !== event.pointerId) return;

    const dx = Math.abs(event.clientX - current.startX);
    const dy = Math.abs(event.clientY - current.startY);

    if (!current.armed) {
      if (dx > SCROLL_CANCEL_PX || dy > SCROLL_CANCEL_PX) {
        resetPointer();
      }
      return;
    }

    event.preventDefault();
    setHint(dragIndexAt(event.clientY));
  };

  const finishPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    const current = pointerRef.current;
    if (!current || current.pointerId !== event.pointerId) {
      resetPointer();
      return;
    }

    if (current.armed) {
      const toIndex = dragIndexAt(event.clientY);
      if (toIndex !== null && toIndex !== dragIndex) {
        onDrop(dragIndex, toIndex);
      }
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        // ignore
      }
    }

    resetPointer();
  };

  const isDropTarget = dropHintIndex === dragIndex;

  return (
    <div
      data-admin-drag-index={dragIndex}
      draggable={!reorderDisabled}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDragDrop}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finishPointer}
      onPointerCancel={finishPointer}
      className={`${className}${reorderDisabled ? "" : " touch-pan-y"}${touchDragging ? " cursor-grabbing" : reorderDisabled ? "" : " cursor-grab"}${isDropTarget ? " ring-2 ring-[#0066FF]/50" : ""}`}
      aria-grabbed={touchDragging || undefined}
      aria-label={reorderDisabled ? undefined : `Glisser ${dragIndex + 1} pour réordonner`}
    >
      {children}
    </div>
  );
}
