import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Paiement — DINGRY",
  robots: { index: false, follow: false },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
