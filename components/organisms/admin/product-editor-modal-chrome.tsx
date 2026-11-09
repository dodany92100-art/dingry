"use client";

import { useState, type ReactNode } from "react";

export const SECTION_CARD =
  "dingry-admin-glass relative rounded-3xl px-5 py-6 sm:px-7 sm:py-7";
export const SECTION_DIRTY =
  "border-l border-l-white/50 pl-[1.125rem] sm:pl-[1.25rem] before:pointer-events-none before:absolute before:left-2 before:top-5 before:h-1.5 before:w-1.5 before:rounded-full before:bg-white before:content-['']";

export const FIELD_LABEL = "block text-[13px] font-medium tracking-tight text-white/55";
export const FIELD_INPUT =
  "mt-1.5 h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3.5 text-[15px] text-white outline-none transition placeholder:text-white/30 backdrop-blur-md focus:border-white/25 focus:bg-white/[0.08] focus:ring-2 focus:ring-white/10";
export const FIELD_SELECT = `${FIELD_INPUT} appearance-none cursor-pointer`;
export const ADMIN_BTN =
  "rounded-full border border-white/12 bg-[#0e1628] px-3.5 py-2 text-[13px] font-medium text-white/65 transition hover:border-white/22 hover:bg-[#121c30] hover:text-white";
export const ADMIN_BTN_ACTIVE =
  "rounded-full border border-white/25 bg-[#121c30] px-3.5 py-2 text-[13px] font-medium text-white ring-1 ring-white/12";
export const ADMIN_BTN_SMART_ON =
  "dingry-admin-smart-toggle rounded-full border border-violet-400/50 bg-gradient-to-r from-violet-950/90 via-[#121c30] to-cyan-950/40 px-3.5 py-2 text-[13px] font-medium text-white ring-1 ring-violet-400/35";
export const ADMIN_BTN_SMART_OFF = `${ADMIN_BTN} hover:border-violet-400/30 hover:text-violet-100`;

const SMART_COLLAGE_SKELETON_LINES = [
  "ref :",
  "argu :",
  "",
  "fin d' argu @",
  "mat :",
  "fin de matiere #",
  "couleur :",
  "T :",
  "prix :",
  "qte :",
] as const;

const SMART_COLLAGE_SKELETON_STOP = new Set<string>(["fin d' argu @", "fin de matiere #"]);

function SmartCollageSkeletonMarkers({ text }: { text: string }) {
  const chunks = text.split(/([:@#])/g);
  return (
    <>
      {chunks.map((chunk, index) =>
        chunk === ":" || chunk === "@" || chunk === "#" ? (
          <span key={`mk-${index}`} className="font-bold text-white">
            {chunk}
          </span>
        ) : (
          <span key={`txt-${index}`}>{chunk}</span>
        ),
      )}
    </>
  );
}

export function SmartCollageSkeletonGuide() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-0 px-3.5 py-3 font-mono text-[13px] leading-relaxed select-none"
      aria-hidden
    >
      <div>
        {SMART_COLLAGE_SKELETON_LINES.map((line, index) =>
          line === "" ? (
            <div key={`gap-${index}`} className="h-[1.625rem]" aria-hidden />
          ) : (
            <div
              key={`${line}-${index}`}
              className={
                SMART_COLLAGE_SKELETON_STOP.has(line)
                  ? "font-medium text-violet-100/72"
                  : "text-violet-200/36"
              }
            >
              <SmartCollageSkeletonMarkers text={line} />
            </div>
          ),
        )}
      </div>
    </div>
  );
}

type AdminEditorAccordionProps = {
  sectionId?: string;
  title: string;
  subtitle?: string;
  dirty?: boolean;
  defaultOpen?: boolean;
  className?: string;
  children: ReactNode;
};

export function AdminEditorAccordion({
  sectionId,
  title,
  subtitle,
  dirty = false,
  defaultOpen = true,
  className = "",
  children,
}: AdminEditorAccordionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section
      id={sectionId}
      className={`${SECTION_CARD} ${dirty ? SECTION_DIRTY : ""} ${className}`.trim()}
    >
      <button
        type="button"
        className="flex w-full items-start justify-between gap-3 text-left"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-zinc-300">{title}</span>
          {subtitle ? (
            <span className="mt-0.5 block text-[12px] font-normal leading-relaxed text-white/45">
              {subtitle}
            </span>
          ) : null}
        </span>
        <span
          className="mt-0.5 shrink-0 text-[15px] font-medium leading-none text-white/45"
          aria-hidden
        >
          {open ? "▾" : "▸"}
        </span>
      </button>
      {open ? <div className="mt-4 min-w-0 space-y-5">{children}</div> : null}
    </section>
  );
}
