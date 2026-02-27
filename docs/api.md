# Dragon AI - API Documentation

Base URL: `http://localhost:4000/api`

## Health Check

### GET /health
Returns service status.

**Response:**
```json
{
  "status": "ok",
  "service": "dragon-ai-gateway",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Authentication

### POST /api/auth/register
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response (201):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "user",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "jwt-token"
}
```

### POST /api/auth/login
Authenticate a user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response (200):**
```json
{
  "user": { "id": "uuid", "email": "user@example.com", "role": "user" },
  "token": "jwt-token"
}
```

## Chat

All chat endpoints require `Authorization: Bearer <token>` header.

### POST /api/chat
Send a message and receive an AI response.

**Request Body:**
```json
{
  "message": "Hello, Dragon AI!",
  "conversationId": "optional-uuid",
  "model": "gpt-4",
  "useMemory": true,
  "useTools": true
}
```

**Response (200):**
```json
{
  "content": "Hello! I'm Dragon AI...",
  "model": "gpt-4",
  "conversationId": "uuid",
  "usage": {
    "promptTokens": 50,
    "completionTokens": 100,
    "totalTokens": 150
  }
}
```

### GET /api/chat/models
List available AI models.

**Response (200):**
```json
[
  { "id": "gpt-4", "name": "GPT-4", "provider": "openai", "maxTokens": 8192, "isDefault": true },
  { "id": "gpt-4-turbo", "name": "GPT-4 Turbo", "provider": "openai", "maxTokens": 128000, "isDefault": false },
  { "id": "gpt-3.5-turbo", "name": "GPT-3.5 Turbo", "provider": "openai", "maxTokens": 16385, "isDefault": false }
]
```

### GET /api/chat/conversations
List user's conversations.

### GET /api/chat/conversations/:id/history
Get conversation message history.

### DELETE /api/chat/conversations/:id
Delete a conversation.

## Tools

### GET /api/tools
List available tools.

**Response (200):**
```json
[
  {
    "id": "uuid",
    "name": "get_current_time",
    "description": "Get the current date and time",
    "parameters": {}
  }
]
```

### POST /api/tools/execute
Execute a tool.

**Request Body:**
```json
{
  "name": "calculate",
  "params": { "expression": "2 + 2" }
}
```

**Response (200):**
```json
{
  "toolId": "uuid",
  "toolName": "calculate",
  "result": { "expression": "2 + 2", "result": 4 },
  "executionTime": 1,
  "success": true
}
```

## Admin

Admin endpoints require admin role.

### GET /api/admin/stats
Get system statistics.

### GET /api/admin/audit-log
Get audit log entries.

**Query Parameters:**
- `limit` (number, default: 100)
- `offset` (number, default: 0)
