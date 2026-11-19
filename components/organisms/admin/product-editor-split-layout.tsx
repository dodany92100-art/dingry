"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

export const PRODUCT_EDITOR_SPLIT_STORAGE_KEY = "dingry-product-editor-split-left-pct";
export const PRODUCT_EDITOR_SPLIT_DEFAULT_PCT = 100 / 3;
const MIN_LEFT_PCT = 26;
const MAX_LEFT_PCT = 48;
/** Aligné sur les classes `min-[960px]:` (2 colonnes éditeur). */
const SPLIT_DESKTOP_MQ = "(min-width: 960px)";

export function readProductEditorSplitPct(): number {
  if (typeof window === "undefined") return PRODUCT_EDITOR_SPLIT_DEFAULT_PCT;
  try {
    const raw = window.localStorage.getItem(PRODUCT_EDITOR_SPLIT_STORAGE_KEY);
    const value = raw ? Number(raw) : Number.NaN;
    if (!Number.isFinite(value)) return PRODUCT_EDITOR_SPLIT_DEFAULT_PCT;
    return Math.min(MAX_LEFT_PCT, Math.max(MIN_LEFT_PCT, value));
  } catch {
    return PRODUCT_EDITOR_SPLIT_DEFAULT_PCT;
  }
}

export function persistProductEditorSplitPct(pct: number): void {
  try {
    const clamped = Math.min(MAX_LEFT_PCT, Math.max(MIN_LEFT_PCT, pct));
    window.localStorage.setItem(PRODUCT_EDITOR_SPLIT_STORAGE_KEY, String(Math.round(clamped * 100) / 100));
  } catch {
    /* quota / private mode */
  }
}

type ProductEditorSplitLayoutProps = {
  preview: ReactNode;
  editor: ReactNode;
  /** Onglet Produit : formulaire au-dessus de l’aperçu sur mobile. */
  previewAfterEditorOnMobile?: boolean;
  /** Partagé entre onglets Produit / Description (évite un reset au changement d’onglet). */
  committedLeftPct?: number;
  onCommitLeftPct?: (pct: number) => void;
};

export function ProductEditorSplitLayout({
  preview,
  editor,
  previewAfterEditorOnMobile = false,
  committedLeftPct,
  onCommitLeftPct,
}: ProductEditorSplitLayoutProps) {
  const [leftPct, setLeftPct] = useState(() => committedLeftPct ?? readProductEditorSplitPct());
  const containerRef = useRef<HTMLDivElement>(null);
  const previewPaneRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const leftPctRef = useRef(leftPct);

  useEffect(() => {
    if (committedLeftPct == null) return;
    setLeftPct(committedLeftPct);
    leftPctRef.current = committedLeftPct;
  }, [committedLeftPct]);

  useEffect(() => {
    leftPctRef.current = leftPct;
  }, [leftPct]);

  useEffect(() => {
    const el = previewPaneRef.current;
    if (!el) return;
    const mq = window.matchMedia(SPLIT_DESKTOP_MQ);
    const apply = () => {
      if (mq.matches) {
        el.style.width = `clamp(220px, ${leftPct}%, 48%)`;
      } else {
        el.style.width = "";
      }
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [leftPct]);

  const commitPct = useCallback(
    (pct: number) => {
      const clamped = Math.min(MAX_LEFT_PCT, Math.max(MIN_LEFT_PCT, pct));
      persistProductEditorSplitPct(clamped);
      onCommitLeftPct?.(clamped);
    },
    [onCommitLeftPct],
  );

  const clampPct = useCallback((raw: number) => Math.min(MAX_LEFT_PCT, Math.max(MIN_LEFT_PCT, raw)), []);

  const stopDrag = useCallback(() => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
    commitPct(leftPctRef.current);
  }, [commitPct]);

  useEffect(() => {
    return () => {
      if (draggingRef.current) {
        commitPct(leftPctRef.current);
      }
    };
  }, [commitPct]);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      if (!draggingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const next = clampPct(((event.clientX - rect.left) / rect.width) * 100);
      leftPctRef.current = next;
      setLeftPct(next);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", stopDrag);
    window.addEventListener("pointercancel", stopDrag);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", stopDrag);
      window.removeEventListener("pointercancel", stopDrag);
    };
  }, [clampPct, stopDrag]);

  const onSeparatorPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    draggingRef.current = true;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onSeparatorDoubleClick = () => {
    setLeftPct(PRODUCT_EDITOR_SPLIT_DEFAULT_PCT);
    leftPctRef.current = PRODUCT_EDITOR_SPLIT_DEFAULT_PCT;
    commitPct(PRODUCT_EDITOR_SPLIT_DEFAULT_PCT);
  };

  const onSeparatorPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    stopDrag();
  };

  const editorOrder = previewAfterEditorOnMobile ? "order-1" : "order-2";
  const previewOrder = previewAfterEditorOnMobile ? "order-2" : "order-1";

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-stretch gap-5 min-[960px]:flex-row min-[960px]:items-stretch min-[960px]:gap-0"
    >
      <div
        ref={previewPaneRef}
        className={`min-w-0 shrink-0 min-[960px]:sticky min-[960px]:top-[4.5rem] min-[960px]:max-w-[48%] min-[960px]:self-start ${previewOrder} min-[960px]:order-1`}
      >
        <div className="min-w-0 space-y-4 min-[960px]:max-w-full min-[960px]:space-y-3 min-[960px]:pr-2">{preview}</div>
      </div>

      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Redimensionner colonnes éditeur"
        aria-valuemin={MIN_LEFT_PCT}
        aria-valuemax={MAX_LEFT_PCT}
        aria-valuenow={Math.round(leftPct)}
        title="Glisser pour ajuster · double-clic pour réinitialiser"
        onPointerDown={onSeparatorPointerDown}
        onPointerUp={onSeparatorPointerUp}
        onLostPointerCapture={stopDrag}
        onDoubleClick={onSeparatorDoubleClick}
        className="group relative mx-auto hidden w-3 shrink-0 cursor-col-resize touch-none select-none min-[960px]:order-2 min-[960px]:mx-0 min-[960px]:flex min-[960px]:self-stretch min-[960px]:flex-col min-[960px]:items-center min-[960px]:justify-stretch min-[960px]:px-0"
      >
        <span className="pointer-events-none relative my-3 flex min-h-[120px] flex-1 flex-col items-center">
          <span className="absolute inset-y-0 w-px rounded-full bg-white/[0.14] transition group-hover:bg-white/28 group-active:bg-white/40" />
          <span
            className="relative top-1/2 z-[1] flex -translate-y-1/2 flex-col items-center gap-0.5 rounded border border-white/12 bg-black/50 px-[3px] py-1.5 opacity-75 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] transition group-hover:border-white/22 group-hover:bg-black/70 group-hover:opacity-100"
            aria-hidden
            title=""
          >
            <span className="flex h-4 w-[7px] flex-row items-stretch justify-between">
              <span className="w-px rounded-full bg-white/60" />
              <span className="w-px rounded-full bg-white/60" />
            </span>
          </span>
        </span>
      </div>

      <div
        className={`min-w-0 flex-1 space-y-2.5 min-[960px]:order-3 min-[960px]:min-w-[280px] min-[960px]:max-w-none min-[960px]:space-y-2.5 min-[960px]:pl-2 ${editorOrder}`}
      >
        {editor}
      </div>
    </div>
  );
}