'use client';

import { useState } from 'react';

interface Conversation {
  id: string;
  title?: string;
}

interface SidebarProps {
  conversations: Conversation[];
  activeConversation?: string;
  onSelect: (id: string) => void;
  onNew: () => void;
}

export default function Sidebar({ conversations, activeConversation, onSelect, onNew }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (isCollapsed) {
    return (
      <div className="w-12 bg-dragon-card border-r border-dragon-border flex flex-col items-center py-4">
        <button
          onClick={() => setIsCollapsed(false)}
          className="text-gray-400 hover:text-white mb-4"
          title="Expand sidebar"
        >
          ☰
        </button>
        <button
          onClick={onNew}
          className="text-dragon-accent hover:text-dragon-heading"
          title="New conversation"
        >
          +
        </button>
      </div>
    );
  }

  return (
    <div className="w-64 bg-dragon-card border-r border-dragon-border flex flex-col">
      <div className="p-4 flex items-center justify-between border-b border-dragon-border">
        <h2 className="text-sm font-semibold text-gray-300">Conversations</h2>
        <div className="flex gap-2">
          <button
            onClick={onNew}
            className="text-dragon-accent hover:text-dragon-heading text-lg"
            title="New conversation"
          >
            +
          </button>
          <button
            onClick={() => setIsCollapsed(true)}
            className="text-gray-400 hover:text-white"
            title="Collapse sidebar"
          >
            ←
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {conversations.length === 0 ? (
          <p className="text-gray-500 text-sm text-center mt-4">No conversations yet</p>
        ) : (
          conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={`w-full text-left px-3 py-2 rounded text-sm truncate mb-1 transition-colors ${
                activeConversation === conv.id
                  ? 'bg-dragon-accent/20 text-dragon-heading'
                  : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
              }`}
            >
              {conv.title || `Conversation ${conv.id.slice(0, 8)}`}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
