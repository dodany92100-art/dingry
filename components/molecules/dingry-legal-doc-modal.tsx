"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { LegalDocId } from "@/lib/legal-placeholders";
import {
  DINGRY_MODAL_PANEL_TRANSITION,
  DINGRY_NATIVE_DIALOG_CLASS,
  isDialogBackdropDismissTarget,
  supportsNativeModalDialog,
} from "@/components/molecules/dingry-native-dialog";

export type LegalDocumentView = {
  title: string;
  subtitle: string;
  sections: Array<{ heading: string; body: string }>;
};

type DingryLegalDocModalProps = {
  open: boolean;
  legalDocId: LegalDocId | null;
  document: LegalDocumentView | null;
  legalModalEyebrow: string;
  closeAriaLabel: string;
  showLegalClosing: boolean;
  legalClosing: string;
  onClose: () => void;
};

function LegalDocPanel({
  document,
  legalModalEyebrow,
  closeAriaLabel,
  showLegalClosing,
  legalClosing,
  onRequestClose,
}: {
  document: LegalDocumentView;
  legalModalEyebrow: string;
  closeAriaLabel: string;
  showLegalClosing: boolean;
  legalClosing: string;
  onRequestClose: () => void;
}) {
  return (
    <div className="dingry-legal-panel relative z-10 flex max-h-[88vh] w-full max-w-2xl flex-col border border-white/[0.08] bg-[#0a0a0a]">
      <div className="flex shrink-0 items-start justify-between gap-4 border-b border-white/[0.06] p-6 md:p-8">
        <div>
          <p className="dingry-section-eyebrow">{legalModalEyebrow}</p>
          <h2 id="legal-modal-title" className="mt-2 text-xl font-bold uppercase tracking-wide md:text-2xl">
            {document.title}
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-white/40">{document.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={onRequestClose}
          className="flex h-11 w-11 shrink-0 items-center justify-center text-white/40 transition-colors hover:text-white"
          aria-label={closeAriaLabel}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-6 md:p-8">
        <div className="space-y-6">
          {document.sections.map((section) => (
            <section key={section.heading}>
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-white/80">{section.heading}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/45">{section.body}</p>
            </section>
          ))}
        </div>
        {showLegalClosing ? (
          <p className="dingry-gold-rule-top relative mt-8 block pt-4 text-sm tracking-normal text-white/90 normal-case">
            {legalClosing}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function LegacyLegalDocModal({
  open,
  onClose,
  legalDocId,
  document,
  legalModalEyebrow,
  closeAriaLabel,
  showLegalClosing,
  legalClosing,
}: DingryLegalDocModalProps & { document: LegalDocumentView }) {
  if (!open) return null;

  return (
    <div
      key={legalDocId ? `legal-${legalDocId}` : "legal"}
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 md:p-8"
    >
      <div className="dingry-legal-overlay absolute inset-0 bg-[#050505]/92" onClick={onClose} aria-hidden />
      <div
        className="relative z-10 w-full max-w-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-modal-title"
      >
        <LegalDocPanel
          document={document}
          legalModalEyebrow={legalModalEyebrow}
          closeAriaLabel={closeAriaLabel}
          showLegalClosing={showLegalClosing}
          legalClosing={legalClosing}
          onRequestClose={onClose}
        />
      </div>
    </div>
  );
}

export function DingryLegalDocModal({
  open,
  legalDocId,
  document,
  legalModalEyebrow,
  closeAriaLabel,
  showLegalClosing,
  legalClosing,
  onClose,
}: DingryLegalDocModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const nativeModal = supportsNativeModalDialog();

  useEffect(() => {
    if (!nativeModal) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const onDialogClose = () => {
      onClose();
    };

    const onDialogClick = (event: MouseEvent) => {
      if (isDialogBackdropDismissTarget(event.target, dialog)) {
        dialog.close();
      }
    };

    dialog.addEventListener("close", onDialogClose);
    dialog.addEventListener("click", onDialogClick);
    return () => {
      dialog.removeEventListener("close", onDialogClose);
      dialog.removeEventListener("click", onDialogClick);
    };
  }, [nativeModal, onClose]);

  useEffect(() => {
    if (!nativeModal) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open, nativeModal]);

  const requestClose = () => {
    if (nativeModal) {
      dialogRef.current?.close();
      return;
    }
    onClose();
  };

  if (!document) return null;

  if (!nativeModal) {
    return (
      <LegacyLegalDocModal
        open={open}
        legalDocId={legalDocId}
        document={document}
        legalModalEyebrow={legalModalEyebrow}
        closeAriaLabel={closeAriaLabel}
        showLegalClosing={showLegalClosing}
        legalClosing={legalClosing}
        onClose={onClose}
      />
    );
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="legal-modal-title"
      className={DINGRY_NATIVE_DIALOG_CLASS}
      style={{ overscrollBehavior: "contain" }}
    >
      <AnimatePresence>
        {open ? (
          <motion.div
            key={legalDocId ? `legal-${legalDocId}` : "legal-panel"}
            initial={{ opacity: 0, scale: 0.96, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            transition={DINGRY_MODAL_PANEL_TRANSITION}
            className="w-full max-w-2xl"
          >
            <LegalDocPanel
              document={document}
              legalModalEyebrow={legalModalEyebrow}
              closeAriaLabel={closeAriaLabel}
              showLegalClosing={showLegalClosing}
              legalClosing={legalClosing}
              onRequestClose={requestClose}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </dialog>
  );
}