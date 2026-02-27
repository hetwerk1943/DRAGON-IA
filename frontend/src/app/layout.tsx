import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DRAGON AI',
  description: 'AI Orchestration Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-dragon-dark text-white">
        <nav className="border-b border-dragon-border bg-dragon-card px-6 py-4">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <h1 className="text-2xl font-bold text-dragon-orange">🐉 DRAGON AI</h1>
            <div className="flex gap-4">
              <a href="/" className="text-gray-300 hover:text-dragon-orange">Chat</a>
              <a href="/models" className="text-gray-300 hover:text-dragon-orange">Models</a>
              <a href="/tools" className="text-gray-300 hover:text-dragon-orange">Tools</a>
            </div>
          </div>
        </nav>
        <main className="mx-auto max-w-7xl p-6">
          {children}
        </main>
      </body>
    </html>
  )
}
