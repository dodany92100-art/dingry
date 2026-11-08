import Link from "next/link";
import { DingryLogo } from "@/components/atoms/dingry-logo";

export default function CheckoutCancelPage() {
  return (
    <main className="dingry-checkout-page min-h-screen bg-[#f6f6f4] text-[#4b5563]">
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col px-4 py-8 md:px-6 md:py-14">
        <Link href="/" aria-label="Retour à la boutique DINGRY">
          <DingryLogo animate={false} className="h-8 md:h-10" />
        </Link>

        <section className="dingry-checkout-pay-surface mt-10 border p-4 md:p-8" role="status">
          <p className="dingry-checkout-pay-eyebrow">Paiement</p>
          <h1 className="dingry-checkout-pay-title mt-4">Paiement annulé</h1>
          <p className="dingry-checkout-pay-lead mt-3">
            Aucun débit n’a été effectué. Votre panier DINGRY est intact.
          </p>
          <Link
            href="/checkout"
            className="mt-8 block w-full bg-[#0066FF] py-4 text-center text-[11px] font-medium tracking-[0.28em] text-white uppercase transition-colors hover:bg-[#0052cc]"
          >
            Reprendre le paiement
          </Link>
          <Link
            href="/"
            className="dingry-checkout-pay-secondary mt-4 block w-full border py-3 text-center text-[10px] tracking-[0.22em] uppercase"
          >
            Retour à la boutique
          </Link>
        </section>
      </div>
    </main>
  );
}
