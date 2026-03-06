import type { Metadata } from "next";
import type { ReactNode } from "react";
import AdminGate from "@/components/admin/AdminGate";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      "max-image-preview": "none",
      "max-snippet": 0,
      "max-video-preview": 0,
    },
  },
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return <AdminGate>{children}</AdminGate>;
}
