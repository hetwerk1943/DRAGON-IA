import { config } from '../../config';
import { logger } from '../../utils/logger';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  maxTokens: number;
  isDefault: boolean;
}

const AVAILABLE_MODELS: ModelConfig[] = [
  { id: 'gpt-4', name: 'GPT-4', provider: 'openai', maxTokens: 8192, isDefault: true },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai', maxTokens: 128000, isDefault: false },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai', maxTokens: 16385, isDefault: false },
];

export class LLMService {
  private apiKey: string;
  private baseUrl: string;
  private defaultModel: string;

  constructor() {
    this.apiKey = config.openai.apiKey;
    this.baseUrl = config.openai.baseUrl;
    this.defaultModel = config.openai.defaultModel;
  }

  getAvailableModels(): ModelConfig[] {
    return AVAILABLE_MODELS;
  }

  selectModel(preferredModel?: string): string {
    if (preferredModel) {
      const model = AVAILABLE_MODELS.find(m => m.id === preferredModel);
      if (model) return model.id;
    }
    return this.defaultModel;
  }

  async chat(messages: LLMMessage[], model?: string): Promise<LLMResponse> {
    const selectedModel = this.selectModel(model);
    logger.debug(`LLM chat request with model: ${selectedModel}`);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: selectedModel,
          messages,
          temperature: 0.7,
          max_tokens: 2048,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`LLM API error (${response.status}): ${errorBody}`);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await response.json();
      return {
        content: data.choices[0]?.message?.content || '',
        model: selectedModel,
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
        },
      };
    } catch (error) {
      logger.error('LLM chat error:', error);
      // Fallback: try with a simpler model
      if (selectedModel !== 'gpt-3.5-turbo') {
        logger.info('Falling back to gpt-3.5-turbo');
        return this.chat(messages, 'gpt-3.5-turbo');
      }
      throw error;
    }
  }

  async *chatStream(messages: LLMMessage[], model?: string): AsyncGenerator<string> {
    const selectedModel = this.selectModel(model);
    logger.debug(`LLM stream request with model: ${selectedModel}`);

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: selectedModel,
        messages,
        temperature: 0.7,
        max_tokens: 2048,
        stream: true,
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error(`LLM stream error: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

        for (const line of lines) {
          const data = line.slice(6);
          if (data === '[DONE]') return;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content;
            if (content) yield content;
          } catch {
            // Skip malformed chunks
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
