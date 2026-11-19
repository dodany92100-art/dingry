"use client";

import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";

export const SECTION_CARD =
  "dingry-admin-editor-card relative rounded-2xl px-4 py-4 sm:rounded-3xl sm:px-6 sm:py-5";
export const SECTION_CARD_COMPACT =
  "dingry-admin-editor-card relative rounded-xl px-3 py-3 sm:rounded-2xl sm:px-4 sm:py-3.5";
export const SECTION_DIRTY =
  "border-l border-l-white/50 pl-[1.125rem] sm:pl-[1.25rem] before:pointer-events-none before:absolute before:left-2 before:top-[1.125rem] before:h-1.5 before:w-1.5 before:rounded-full before:bg-white before:content-[''] sm:before:top-5";

export const FIELD_LABEL = "block text-[13px] font-medium tracking-tight text-white/55";
/** Libellés principaux (catégorie, SKU, nom). */
export const FIELD_LABEL_EMPHASIS =
  "block text-[14px] font-semibold tracking-tight text-white/75 sm:text-[15px]";
export const FIELD_LABEL_COMPACT = "block text-[12px] font-medium tracking-tight text-white/60";
export const FIELD_INPUT =
  "mt-1.5 h-11 w-full rounded-xl border border-white/[0.1] bg-[#141414] px-3.5 text-[15px] text-white outline-none transition placeholder:text-white/30 focus:border-white/18 focus:bg-[#181818] focus:ring-1 focus:ring-white/10";
export const FIELD_INPUT_COMPACT = `${FIELD_INPUT.replace("mt-1.5 h-11", "mt-1 h-9")} px-3 text-[14px] rounded-lg`;
export const FIELD_SELECT = `${FIELD_INPUT} appearance-none cursor-pointer`;
export const ADMIN_BTN =
  "rounded-full border border-white/[0.1] bg-[#161616] px-3.5 py-2 text-[13px] font-medium text-white/65 transition hover:border-white/16 hover:bg-[#1c1c1c] hover:text-white";
export const ADMIN_BTN_ACTIVE =
  "rounded-full border border-white/20 bg-[#1c1c1c] px-3.5 py-2 text-[13px] font-medium text-white ring-1 ring-white/10";
export const ADMIN_BTN_SMART_ON =
  "rounded-full border border-white/18 bg-[#1a1a1a] px-3.5 py-2 text-[13px] font-medium text-white ring-1 ring-white/12";
export const ADMIN_BTN_SMART_OFF = `${ADMIN_BTN} hover:border-white/14 hover:text-white/90`;

/** Détecter famille & prix — dorure sobre. */
export const ADMIN_BTN_GOLD_DETECT =
  "rounded-full border border-[#c9a227]/55 bg-[linear-gradient(145deg,rgba(201,162,39,0.2)_0%,rgba(80,64,18,0.14)_100%)] px-3.5 py-2 text-[13px] font-semibold text-[#f3e5b5] shadow-[0_0_14px_rgba(201,162,39,0.14),inset_0_1px_0_rgba(255,240,200,0.1)] transition hover:border-[#e0c04a]/75 hover:text-[#fff8e7] disabled:opacity-40";

/** Smart collage — violet électrique. */
export const ADMIN_BTN_VIOLET_SMART_OFF =
  "rounded-full border border-[#a855f7]/42 bg-[#140f1f] px-3.5 py-2 text-[13px] font-medium text-[#d8b4fe] shadow-[0_0_12px_rgba(168,85,247,0.1)] transition hover:border-[#c084fc]/58 hover:bg-[#1c1430] hover:text-[#f3e8ff] disabled:opacity-40";
export const ADMIN_BTN_VIOLET_SMART_ON =
  "rounded-full border border-[#c084fc]/65 bg-[#221433] px-3.5 py-2 text-[13px] font-semibold text-[#f5e8ff] shadow-[0_0_16px_rgba(192,132,252,0.22)] ring-1 ring-[#a855f7]/35 disabled:opacity-40";

/** Smart Description — bleu type Gemini. */
export const ADMIN_BTN_GEMINI_DESCRIPTION =
  "rounded-full border border-[#5b9cf5]/48 bg-[#0c1528] px-3.5 py-2 text-[13px] font-medium text-[#93c5fd] shadow-[0_0_12px_rgba(91,156,245,0.12)] transition hover:border-[#60a5fa]/62 hover:bg-[#101e36] hover:text-[#dbeafe] disabled:opacity-40";

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
          <span key={`mk-${index}`} className="font-bold text-white/75">
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
                  ? "font-medium text-white/55"
                  : "text-white/28"
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
  density?: "default" | "compact";
  className?: string;
  children: ReactNode;
};

export function AdminEditorAccordion({
  sectionId,
  title,
  subtitle,
  dirty = false,
  defaultOpen = false,
  density = "default",
  className = "",
  children,
}: AdminEditorAccordionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const compact = density === "compact";
  return (
    <section
      id={sectionId}
      className={`${compact ? SECTION_CARD_COMPACT : SECTION_CARD} ${dirty ? SECTION_DIRTY : ""} ${className}`.trim()}
    >
      <button
        type="button"
        className={`group flex w-full justify-between rounded-lg border border-transparent text-left transition hover:border-white/[0.08] hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/15 ${
          compact ? "items-center gap-2 py-0" : "items-start gap-3 py-0.5"
        }`}
        aria-expanded={open}
        aria-label={open ? `Replier · ${title}` : `Déplier · ${title}`}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="min-w-0 flex-1 pr-1">
          <span
            className={`block font-semibold tracking-tight text-zinc-200 group-hover:text-white ${
              compact ? "text-[13px]" : "text-sm"
            }`}
          >
            {title}
          </span>
          {subtitle ? (
            <span
              className={`mt-px block font-normal leading-snug text-white/42 ${
                compact ? "text-[9px] tracking-wide" : "mt-0.5 text-[10px] sm:text-[11px]"
              }`}
            >
              {subtitle}
            </span>
          ) : null}
        </span>
        <span className={`flex shrink-0 items-center ${compact ? "gap-1" : "mt-0.5 flex-col gap-0.5"}`}>
          <span
            className={`flex items-center justify-center rounded-full border border-white/[0.1] bg-[#101010] text-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition group-hover:border-white/18 group-hover:text-white ${
              compact ? "h-7 w-7" : "h-8 w-8"
            }`}
            aria-hidden
          >
            <ChevronDown
              size={compact ? 14 : 16}
              strokeWidth={2}
              className={`transition-transform duration-200 ${open ? "" : "-rotate-90"}`}
            />
          </span>
          {!compact ? (
            <span className="hidden text-[9px] font-medium uppercase tracking-[0.08em] text-white/40 sm:block">
              {open ? "Replier" : "Ouvrir"}
            </span>
          ) : null}
        </span>
      </button>
      {open ? (
        <div className={`min-w-0 ${compact ? "mt-2 space-y-2" : "mt-3 space-y-3 sm:space-y-4"}`}>{children}</div>
      ) : null}
    </section>
  );
}