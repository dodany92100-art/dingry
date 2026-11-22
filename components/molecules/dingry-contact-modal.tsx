"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { DINGRY_CONTACT_EMAIL } from "@/lib/dingry-legal";

type DingryContactModalProps = {
  open: boolean;
  onClose: () => void;
};

const PANEL_TRANSITION = { duration: 0.28, ease: [0.16, 1, 0.3, 1] as const };

/** Exporté pour les tests unitaires (repère clic light dismiss sur le `<dialog>`). */
export function isDialogBackdropDismissTarget(
  target: EventTarget | null,
  dialog: HTMLDialogElement | null,
): boolean {
  return Boolean(dialog && target === dialog);
}

export function supportsNativeModalDialog(): boolean {
  if (typeof HTMLDialogElement === "undefined") return false;
  return typeof HTMLDialogElement.prototype.showModal === "function";
}

function ContactModalPanel({
  onRequestClose,
  name,
  setName,
  email,
  setEmail,
  message,
  setMessage,
}: {
  onRequestClose: () => void;
  name: string;
  setName: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  message: string;
  setMessage: (value: string) => void;
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const subject = encodeURIComponent(`Contact DINGRY — ${name.trim() || "Boutique"}`);
    const body = encodeURIComponent(
      `Nom : ${name.trim()}\nE-mail : ${email.trim()}\n\n${message.trim()}`,
    );
    window.location.href = `mailto:${DINGRY_CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  }

  return (
  <div className="dingry-legal-panel relative z-10 w-full max-w-md border border-white/[0.08] bg-[#0a0a0a] p-6 md:p-8">
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <p className="dingry-section-eyebrow">Contact</p>
        <h2 id="dingry-contact-modal-title" className="mt-2 text-lg font-bold uppercase tracking-wide text-white">
          Écris-nous
        </h2>
        <p className="mt-2 text-xs leading-relaxed tracking-[0.06em] text-white/45">
          Une question sur une commande ou une pièce ? Le formulaire ouvre votre messagerie.
        </p>
      </div>
      <button
        type="button"
        onClick={onRequestClose}
        className="flex h-11 w-11 shrink-0 items-center justify-center text-white/40 transition-colors hover:text-white"
        aria-label="Fermer"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
    <form onSubmit={handleSubmit} className="space-y-3">
      <label className="block">
        <span className="sr-only">Nom</span>
        <input
          type="text"
          name="name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom"
          className="dingry-contact-field w-full"
        />
      </label>
      <label className="block">
        <span className="sr-only">E-mail</span>
        <input
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-mail"
          required
          className="dingry-contact-field w-full"
        />
      </label>
      <label className="block">
        <span className="sr-only">Message</span>
        <textarea
          name="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Message"
          required
          rows={4}
          className="dingry-contact-field dingry-contact-field--area w-full resize-y"
        />
      </label>
      <button type="submit" className="dingry-contact-submit w-full">
        Envoyer
      </button>
    </form>
  </div>
  );
}

/** Repli Widely available : overlay `div` sans `showModal`. */
function LegacyContactModal({
  open,
  onClose,
  name,
  setName,
  email,
  setEmail,
  message,
  setMessage,
}: DingryContactModalProps & {
  name: string;
  setName: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  message: string;
  setMessage: (value: string) => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 md:p-8">
      <div
        className="dingry-legal-overlay absolute inset-0 bg-[#050505]/92"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="relative z-10 w-full max-w-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dingry-contact-modal-title"
      >
        <ContactModalPanel
          onRequestClose={onClose}
          name={name}
          setName={setName}
          email={email}
          setEmail={setEmail}
          message={message}
          setMessage={setMessage}
        />
      </div>
    </div>
  );
}

export function DingryContactModal({ open, onClose }: DingryContactModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const nativeModal = supportsNativeModalDialog();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

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

  if (!nativeModal) {
    return (
      <LegacyContactModal
        open={open}
        onClose={onClose}
        name={name}
        setName={setName}
        email={email}
        setEmail={setEmail}
        message={message}
        setMessage={setMessage}
      />
    );
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="dingry-contact-modal-title"
      className="dingry-contact-native-dialog fixed inset-0 z-[70] m-0 flex h-dvh max-h-dvh w-full max-w-none items-center justify-center border-0 bg-transparent p-4 open:flex md:p-8 [&::backdrop]:animate-[dingry-overlay-in_0.22s_cubic-bezier(0.16,1,0.3,1)_both] [&::backdrop]:bg-[#050505]/92 [&::backdrop]:overscroll-contain"
      style={{ overscrollBehavior: "contain" }}
    >
      <AnimatePresence>
        {open ? (
          <motion.div
            key="dingry-contact-panel"
            initial={{ opacity: 0, scale: 0.96, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            transition={PANEL_TRANSITION}
            className="w-full max-w-md"
          >
            <ContactModalPanel
              onRequestClose={requestClose}
              name={name}
              setName={setName}
              email={email}
              setEmail={setEmail}
              message={message}
              setMessage={setMessage}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </dialog>
  );
}