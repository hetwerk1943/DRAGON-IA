'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import ChatWindow from '@/components/ChatWindow';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  createdAt: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<{ id: string; title?: string }[]>([]);
  const [activeConversation, setActiveConversation] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (message: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Simulate response for demo (replace with actual API call)
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I'm Dragon AI 🐉 I received your message: "${message}"\n\nThis is a demo response. Connect the backend API to enable full AI capabilities.`,
        model: 'gpt-4',
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const handleNewConversation = () => {
    const newId = Date.now().toString();
    setConversations((prev) => [{ id: newId, title: 'New Chat' }, ...prev]);
    setActiveConversation(newId);
    setMessages([]);
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversation(id);
    setMessages([]);
  };

  return (
    <div className="flex-1 flex h-[calc(100vh-52px)]">
      <Sidebar
        conversations={conversations}
        activeConversation={activeConversation}
        onSelect={handleSelectConversation}
        onNew={handleNewConversation}
      />
      <div className="flex-1">
        <ChatWindow messages={messages} onSend={handleSend} isLoading={isLoading} />
      </div>
    </div>
  );
}
