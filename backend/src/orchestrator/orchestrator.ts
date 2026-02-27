import { LLMService, LLMMessage, LLMResponse } from '../services/llm/llmService';
import { MemoryService } from '../services/memory/memoryService';
import { ToolService, ToolResult } from '../services/tools/toolService';
import { AdminService } from '../services/admin/adminService';
import { logger } from '../utils/logger';

export interface OrchestratorRequest {
  userId: string;
  conversationId: string;
  message: string;
  model?: string;
  useMemory?: boolean;
  useTools?: boolean;
}

export interface OrchestratorResponse {
  content: string;
  model: string;
  conversationId: string;
  toolResults?: ToolResult[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

const SYSTEM_PROMPT = `You are Dragon AI, an advanced AI assistant with powerful reasoning capabilities.
You have access to tools and long-term memory. Be helpful, precise, and thorough.
When you need to use a tool, describe which tool you need and why.`;

export class Orchestrator {
  private llmService: LLMService;
  private memoryService: MemoryService;
  private toolService: ToolService;
  private adminService: AdminService;

  constructor() {
    this.llmService = new LLMService();
    this.memoryService = new MemoryService();
    this.toolService = new ToolService();
    this.adminService = new AdminService();
  }

  async process(request: OrchestratorRequest): Promise<OrchestratorResponse> {
    const { userId, conversationId, message, model, useMemory = true, useTools = true } = request;

    logger.info(`Processing request for user ${userId} in conversation ${conversationId}`);

    // Store user message
    await this.memoryService.storeMessage(userId, conversationId, message, 'user');

    // Build context
    const messages: LLMMessage[] = [{ role: 'system', content: SYSTEM_PROMPT }];

    if (useMemory) {
      const context = await this.memoryService.getContext(userId, conversationId, message);
      
      // Add relevant memories as context
      if (context.relevantMemories.length > 0) {
        const memoryContext = context.relevantMemories
          .map(m => `[Memory] ${m.content}`)
          .join('\n');
        messages.push({ role: 'system', content: `Relevant context from memory:\n${memoryContext}` });
      }

      // Add conversation history
      for (const msg of context.messages.slice(-10)) {
        messages.push({ role: msg.role as 'user' | 'assistant', content: msg.content });
      }
    } else {
      messages.push({ role: 'user', content: message });
    }

    // Add tool descriptions if enabled
    let toolResults: ToolResult[] | undefined;
    if (useTools) {
      const tools = this.toolService.getAvailableTools();
      if (tools.length > 0) {
        const toolDesc = tools.map(t => `- ${t.name}: ${t.description}`).join('\n');
        messages.push({ 
          role: 'system', 
          content: `Available tools:\n${toolDesc}\nTo use a tool, mention it in your response.` 
        });
      }
    }

    // Call LLM
    const response = await this.llmService.chat(messages, model);

    // Store assistant response
    await this.memoryService.storeMessage(userId, conversationId, response.content, 'assistant');

    // Log action
    await this.adminService.logAction(userId, 'chat', 'orchestrator', {
      conversationId,
      model: response.model,
      tokens: response.usage.totalTokens,
    });

    return {
      content: response.content,
      model: response.model,
      conversationId,
      toolResults,
      usage: response.usage,
    };
  }

  getAvailableModels() {
    return this.llmService.getAvailableModels();
  }

  getAvailableTools() {
    return this.toolService.getAvailableTools();
  }

  getMemoryService() {
    return this.memoryService;
  }

  getAdminService() {
    return this.adminService;
  }

  getToolService() {
    return this.toolService;
  }
}
