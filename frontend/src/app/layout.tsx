import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DRAGON-IA – The Autonomous Intelligence Platform",
  description: "Enterprise-grade AI orchestration platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
