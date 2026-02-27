import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger';

export interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  resource: string;
  details?: Record<string, unknown>;
  createdAt: Date;
}

export interface SystemStats {
  totalUsers: number;
  totalConversations: number;
  totalMessages: number;
  activeModels: string[];
  registeredTools: number;
  uptime: number;
}

// In-memory audit log for demo
const auditLog: AuditLogEntry[] = [];
const startTime = Date.now();

export class AdminService {
  async logAction(userId: string, action: string, resource: string, details?: Record<string, unknown>): Promise<void> {
    const entry: AuditLogEntry = {
      id: uuidv4(),
      userId,
      action,
      resource,
      details,
      createdAt: new Date(),
    };
    auditLog.push(entry);
    logger.info(`Audit: ${action} on ${resource} by ${userId}`);
  }

  async getAuditLog(limit = 100, offset = 0): Promise<AuditLogEntry[]> {
    return auditLog.slice(offset, offset + limit).reverse();
  }

  async getSystemStats(): Promise<SystemStats> {
    return {
      totalUsers: 0,
      totalConversations: 0,
      totalMessages: 0,
      activeModels: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
      registeredTools: 3,
      uptime: Math.floor((Date.now() - startTime) / 1000),
    };
  }
}
