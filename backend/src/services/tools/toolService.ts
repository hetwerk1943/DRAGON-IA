import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger';

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  parameters: Record<string, { type: string; description: string; required?: boolean }>;
  handler: (params: Record<string, unknown>) => Promise<unknown>;
}

export interface ToolResult {
  toolId: string;
  toolName: string;
  result: unknown;
  executionTime: number;
  success: boolean;
  error?: string;
}

export class ToolService {
  private tools: Map<string, ToolDefinition> = new Map();

  constructor() {
    this.registerBuiltinTools();
  }

  private registerBuiltinTools(): void {
    this.registerTool({
      id: uuidv4(),
      name: 'get_current_time',
      description: 'Get the current date and time',
      parameters: {},
      handler: async () => ({
        timestamp: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }),
    });

    this.registerTool({
      id: uuidv4(),
      name: 'calculate',
      description: 'Perform a mathematical calculation',
      parameters: {
        expression: { type: 'string', description: 'Mathematical expression to evaluate', required: true },
      },
      handler: async (params) => {
        const expression = String(params.expression);
        // Only allow digits, arithmetic operators, parentheses, decimal points, and whitespace
        if (!/^[\d+\-*/().%\s]+$/.test(expression)) {
          throw new Error('Invalid mathematical expression');
        }
        if (expression.length > 100) {
          throw new Error('Expression too long');
        }
        // Evaluate using indirect eval restricted to numeric expression
        const result = Number(new Function(`"use strict"; return (${expression})`)());
        if (!isFinite(result)) {
          throw new Error('Expression result is not a finite number');
        }
        return { expression, result };
      },
    });

    this.registerTool({
      id: uuidv4(),
      name: 'json_formatter',
      description: 'Format and validate JSON data',
      parameters: {
        data: { type: 'string', description: 'JSON string to format', required: true },
      },
      handler: async (params) => {
        const parsed = JSON.parse(String(params.data));
        return { formatted: JSON.stringify(parsed, null, 2), valid: true };
      },
    });
  }

  registerTool(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
    logger.info(`Tool registered: ${tool.name}`);
  }

  unregisterTool(name: string): boolean {
    const deleted = this.tools.delete(name);
    if (deleted) logger.info(`Tool unregistered: ${name}`);
    return deleted;
  }

  getAvailableTools(): Omit<ToolDefinition, 'handler'>[] {
    return Array.from(this.tools.values()).map(({ handler, ...rest }) => rest);
  }

  async executeTool(name: string, params: Record<string, unknown>): Promise<ToolResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      return {
        toolId: '',
        toolName: name,
        result: null,
        executionTime: 0,
        success: false,
        error: `Tool '${name}' not found`,
      };
    }

    const startTime = Date.now();
    try {
      const result = await tool.handler(params);
      const executionTime = Date.now() - startTime;
      logger.debug(`Tool ${name} executed in ${executionTime}ms`);
      return {
        toolId: tool.id,
        toolName: name,
        result,
        executionTime,
        success: true,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Tool ${name} failed: ${errorMessage}`);
      return {
        toolId: tool.id,
        toolName: name,
        result: null,
        executionTime,
        success: false,
        error: errorMessage,
      };
    }
  }
}
