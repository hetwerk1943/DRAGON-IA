const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('dragon_token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    const data = await response.json();
    if (!response.ok) {
      return { error: data.error || 'Request failed' };
    }
    return { data };
  } catch {
    return { error: 'Network error' };
  }
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    register: (email: string, password: string) =>
      request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) }),
  },
  chat: {
    send: (message: string, conversationId?: string, model?: string) =>
      request('/chat', {
        method: 'POST',
        body: JSON.stringify({ message, conversationId, model }),
      }),
    getModels: () => request('/chat/models'),
    getConversations: () => request('/chat/conversations'),
    getHistory: (conversationId: string) => request(`/chat/conversations/${conversationId}/history`),
    deleteConversation: (conversationId: string) =>
      request(`/chat/conversations/${conversationId}`, { method: 'DELETE' }),
  },
  tools: {
    list: () => request('/tools'),
    execute: (name: string, params: Record<string, unknown>) =>
      request('/tools/execute', { method: 'POST', body: JSON.stringify({ name, params }) }),
  },
  admin: {
    getStats: () => request('/admin/stats'),
    getAuditLog: (limit?: number) => request(`/admin/audit-log?limit=${limit || 100}`),
  },
};
