import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger';

export interface MemoryEntry {
  id: string;
  userId: string;
  conversationId: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  embedding?: number[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface ConversationContext {
  conversationId: string;
  messages: MemoryEntry[];
  relevantMemories: MemoryEntry[];
}

// In-memory store for demo; replace with vector DB in production
const memoryStore: Map<string, MemoryEntry[]> = new Map();

export class MemoryService {
  async storeMessage(userId: string, conversationId: string, content: string, role: 'user' | 'assistant' | 'system'): Promise<MemoryEntry> {
    const entry: MemoryEntry = {
      id: uuidv4(),
      userId,
      conversationId,
      content,
      role,
      createdAt: new Date(),
    };

    const key = `${userId}:${conversationId}`;
    const existing = memoryStore.get(key) || [];
    existing.push(entry);
    memoryStore.set(key, existing);

    logger.debug(`Stored memory entry for user ${userId}, conversation ${conversationId}`);
    return entry;
  }

  async getConversationHistory(userId: string, conversationId: string, limit = 50): Promise<MemoryEntry[]> {
    const key = `${userId}:${conversationId}`;
    const entries = memoryStore.get(key) || [];
    return entries.slice(-limit);
  }

  async searchMemories(userId: string, query: string, limit = 5): Promise<MemoryEntry[]> {
    // Simple keyword search; replace with vector similarity search in production
    const allEntries: MemoryEntry[] = [];
    for (const [key, entries] of memoryStore) {
      if (key.startsWith(`${userId}:`)) {
        allEntries.push(...entries);
      }
    }

    const queryLower = query.toLowerCase();
    const scored = allEntries
      .map(entry => ({
        entry,
        score: entry.content.toLowerCase().includes(queryLower) ? 1 : 0,
      }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scored.map(item => item.entry);
  }

  async getContext(userId: string, conversationId: string, query: string): Promise<ConversationContext> {
    const messages = await this.getConversationHistory(userId, conversationId);
    const relevantMemories = await this.searchMemories(userId, query);

    return {
      conversationId,
      messages,
      relevantMemories,
    };
  }

  async clearConversation(userId: string, conversationId: string): Promise<void> {
    const key = `${userId}:${conversationId}`;
    memoryStore.delete(key);
    logger.info(`Cleared conversation ${conversationId} for user ${userId}`);
  }

  async getUserConversations(userId: string): Promise<string[]> {
    const conversations: string[] = [];
    for (const key of memoryStore.keys()) {
      if (key.startsWith(`${userId}:`)) {
        conversations.push(key.split(':')[1]);
      }
    }
    return conversations;
  }
}
