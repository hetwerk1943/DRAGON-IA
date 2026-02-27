import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: 'Dragon AI - Advanced AI Assistant Platform',
  description: 'Next-generation modular AI assistant with reasoning, memory, and tool usage',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex">{children}</main>
      </body>
    </html>
  );
}
