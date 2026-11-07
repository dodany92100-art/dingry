import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DINGRY — Admin",
  description: "Tableau de bord CRM DINGRY.",
  robots: { index: false, follow: false },
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
