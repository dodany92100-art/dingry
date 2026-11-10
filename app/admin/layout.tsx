import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DINGRY — Administration",
  description: "Tableau de bord CRM DINGRY.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="dingry-admin min-h-dvh text-[15px] antialiased">
      {children}
    </div>
  );
}
