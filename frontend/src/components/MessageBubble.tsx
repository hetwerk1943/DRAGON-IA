interface MessageBubbleProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  timestamp?: string;
}

export default function MessageBubble({ role, content, model, timestamp }: MessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-3 ${
          isUser
            ? 'bg-dragon-accent/20 border border-dragon-accent/30'
            : 'bg-dragon-card border border-dragon-border'
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-dragon-heading">
            {isUser ? 'You' : '🐉 Dragon AI'}
          </span>
          {model && (
            <span className="text-xs text-gray-500">({model})</span>
          )}
        </div>
        <div className="text-sm text-gray-200 whitespace-pre-wrap">{content}</div>
        {timestamp && (
          <div className="text-xs text-gray-500 mt-1 text-right">
            {new Date(timestamp).toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
}
