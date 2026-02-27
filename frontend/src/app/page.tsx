import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center max-w-2xl px-4">
        <div className="text-8xl mb-6">🐉</div>
        <h1 className="text-4xl font-bold text-dragon-heading mb-4">
          Welcome to Dragon AI
        </h1>
        <p className="text-lg text-gray-400 mb-8">
          A next-generation modular AI assistant platform with advanced reasoning,
          memory, tool usage, and scalable architecture.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-dragon-card border border-dragon-border rounded-lg p-4">
            <div className="text-2xl mb-2">🧠</div>
            <h3 className="font-semibold text-dragon-heading mb-1">Multi-Model</h3>
            <p className="text-sm text-gray-400">Dynamic model selection with fallback</p>
          </div>
          <div className="bg-dragon-card border border-dragon-border rounded-lg p-4">
            <div className="text-2xl mb-2">💾</div>
            <h3 className="font-semibold text-dragon-heading mb-1">Memory</h3>
            <p className="text-sm text-gray-400">Long-term context and conversation history</p>
          </div>
          <div className="bg-dragon-card border border-dragon-border rounded-lg p-4">
            <div className="text-2xl mb-2">🔧</div>
            <h3 className="font-semibold text-dragon-heading mb-1">Tools</h3>
            <p className="text-sm text-gray-400">Extensible plugin and tool system</p>
          </div>
        </div>
        <Link
          href="/chat"
          className="inline-block bg-dragon-accent hover:bg-dragon-accent/80 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
        >
          Start Chatting →
        </Link>
      </div>
    </div>
  );
}
