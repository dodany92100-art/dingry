import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#0a0a0a] text-white">
      <div className="mx-auto max-w-2xl px-6 py-10">{children}</div>
    </div>
  );
}
