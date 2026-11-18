"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CRM_ADMIN_MEMO_UPDATED_EVENT,
  isCrmAdminMemoHidden,
  persistCrmAdminMemoHidden,
  readCrmAdminMemo,
  writeCrmAdminMemo,
} from "@/lib/admin/crm-admin-memo";
import { cn } from "@/lib/utils";

const DEFAULT_PLACEHOLDER = "Note rapide — commandes, visuels, rappels…";
const DOCK_PEEK_PX = 14;
const DOCK_DRAG_PX = 10;

export function CrmAdminMemoPostit() {
  const [ready, setReady] = useState(false);
  const [hidden, setHidden] = useState(true);
  const [text, setText] = useState("");
  const [editing, setEditing] = useState(false);
  const [swaying, setSwaying] = useState(false);
  const [dockPeek, setDockPeek] = useState(false);
  const swayedRef = useRef(false);
  const dockPointerRef = useRef<{ x: number; dragged: boolean } | null>(null);

  useEffect(() => {
    const sync = () => {
      setText(readCrmAdminMemo());
      setHidden(isCrmAdminMemoHidden());
    };
    sync();
    setReady(true);
    window.addEventListener(CRM_ADMIN_MEMO_UPDATED_EVENT, sync);
    return () => window.removeEventListener(CRM_ADMIN_MEMO_UPDATED_EVENT, sync);
  }, []);

  const persist = useCallback((value: string) => {
    writeCrmAdminMemo(value);
    setText(value);
  }, []);

  const close = useCallback(() => {
    persistCrmAdminMemoHidden(true);
    setHidden(true);
    setEditing(false);
    setDockPeek(false);
    swayedRef.current = false;
    setSwaying(false);
  }, []);

  const reopen = useCallback(() => {
    persistCrmAdminMemoHidden(false);
    setHidden(false);
    swayedRef.current = false;
  }, []);

  const triggerSway = useCallback(() => {
    if (swayedRef.current || editing) return;
    swayedRef.current = true;
    setSwaying(true);
  }, [editing]);

  if (!ready) return null;

  if (hidden) {
    return (
      <div
        className={cn(
          "dingry-memo-dock fixed bottom-24 left-0 z-40 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          dockPeek ? "translate-x-0" : "translate-x-[calc(-100%+var(--dingry-memo-dock-peek,14px))]",
        )}
        style={{ ["--dingry-memo-dock-peek" as string]: `${DOCK_PEEK_PX}px` }}
        onPointerEnter={() => setDockPeek(true)}
        onPointerLeave={() => {
          if (!dockPointerRef.current) setDockPeek(false);
        }}
      >
        <button
          type="button"
          className="flex touch-none items-stretch rounded-r-md border border-l-0 border-[#e8d87a]/45 bg-[#fff9c4]/72 py-2 pl-0 pr-3 text-[10px] font-medium uppercase tracking-[0.18em] text-[#5c4a12] shadow-[4px_6px_18px_rgba(0,0,0,0.32)] backdrop-blur-sm transition hover:bg-[#fff9c4]/88"
          aria-label={dockPeek ? "Ouvrir le mémo CRM" : "Tirer ou survoler pour afficher le mémo"}
          aria-expanded={dockPeek}
          onPointerDown={(event) => {
            dockPointerRef.current = { x: event.clientX, dragged: false };
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            const ref = dockPointerRef.current;
            if (!ref) return;
            const dx = event.clientX - ref.x;
            if (dx > DOCK_DRAG_PX) {
              ref.dragged = true;
              setDockPeek(true);
            } else if (dx < -DOCK_DRAG_PX) {
              ref.dragged = true;
              setDockPeek(false);
            }
          }}
          onPointerUp={(event) => {
            const ref = dockPointerRef.current;
            dockPointerRef.current = null;
            try {
              event.currentTarget.releasePointerCapture(event.pointerId);
            } catch {
              /* ignore */
            }
            if (ref?.dragged) return;
            setDockPeek((peek) => {
              if (peek) reopen();
              return true;
            });
          }}
          onPointerCancel={() => {
            dockPointerRef.current = null;
          }}
        >
          <span
            className="flex w-3.5 shrink-0 flex-col items-center justify-center gap-0.5 rounded-l-sm bg-[#e8d87a]/35 py-1"
            aria-hidden
          >
            <span className="h-px w-1.5 rounded-full bg-[#5c4a12]/45" />
            <span className="h-px w-1.5 rounded-full bg-[#5c4a12]/45" />
            <span className="h-px w-1.5 rounded-full bg-[#5c4a12]/45" />
          </span>
          <span className="flex items-center px-2.5">Mémo</span>
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "dingry-memo-postit-wrap fixed bottom-24 left-4 z-40 w-[min(17rem,calc(100vw-5.5rem))] md:left-7",
        swaying && "dingry-memo-postit-wrap--sway",
      )}
      style={{ fontFamily: "var(--font-dingry-memo, ui-rounded, 'Segoe Print', 'Comic Sans MS', cursive)" }}
      onPointerEnter={triggerSway}
      onPointerDown={triggerSway}
      onAnimationEnd={() => setSwaying(false)}
    >
      <div className="relative rounded-sm border border-[#e0c96a]/70 bg-gradient-to-br from-[#fffef0]/82 via-[#fff9c4]/78 to-[#f5e6a8]/75 px-4 pb-4 pt-5 shadow-[6px_10px_24px_rgba(0,0,0,0.35)] backdrop-blur-[3px]">
        <span
          className="pointer-events-none absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rounded-full bg-[#c9a85c]/85 shadow-[inset_0_1px_2px_rgba(255,255,255,0.5)]"
          aria-hidden
        />
        <div className="mb-2 flex items-start justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7a6518]">À ne pas oublier</p>
          <button
            type="button"
            onClick={close}
            className="shrink-0 text-[18px] leading-none text-[#7a6518]/70 hover:text-[#5c4a12]"
            aria-label="Masquer le mémo"
          >
            ×
          </button>
        </div>
        {editing ? (
          <textarea
            autoFocus
            value={text}
            placeholder={DEFAULT_PLACEHOLDER}
            rows={5}
            onChange={(event) => setText(event.target.value)}
            onBlur={() => {
              persist(text);
              setEditing(false);
            }}
            className="w-full resize-y border border-[#d4bc5c]/55 bg-[#fffef5]/70 px-2 py-1.5 text-[13px] leading-snug text-[#3d3210] outline-none focus:border-[#b8983a]"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="w-full text-left text-[13px] leading-snug text-[#3d3210]"
          >
            {text.trim() ? text : <span className="text-[#7a6518]/65">{DEFAULT_PLACEHOLDER}</span>}
          </button>
        )}
        <p className="mt-2 text-[9px] text-[#7a6518]/55">Cliquer pour éditer · enregistré sur cet appareil</p>
      </div>
    </div>
  );
}