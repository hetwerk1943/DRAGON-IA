'use client';

import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-dragon-card border-b border-dragon-border px-6 py-3 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2">
        <span className="text-2xl">🐉</span>
        <h1 className="text-xl font-bold text-dragon-heading">Dragon AI</h1>
      </Link>
      <nav className="flex items-center gap-4">
        <Link href="/chat" className="text-gray-300 hover:text-dragon-heading transition-colors">
          Chat
        </Link>
        <Link href="/agents" className="text-gray-300 hover:text-dragon-heading transition-colors">
          Agents
        </Link>
        <Link href="/settings" className="text-gray-300 hover:text-dragon-heading transition-colors">
          Settings
        </Link>
      </nav>
    </header>
  );
}
