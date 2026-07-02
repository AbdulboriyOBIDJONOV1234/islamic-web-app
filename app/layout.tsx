import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Namoz Tracker | Zikr & Salovat",
  description: "Kunlik namoz, zikr va salovotlarni kuzatib boring",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
