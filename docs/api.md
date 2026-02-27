# API Documentation

## Base URL

```
http://localhost:8000/api/v1
```

## Authentication

All protected endpoints require a Bearer token (JWT or API key):

```
Authorization: Bearer <token>
```

### Register

```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "full_name": "John Doe"
}
```

### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

Response:
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer"
}
```

## AI Chat

### Send Message

```http
POST /ai/chat
Authorization: Bearer <token>
Content-Type: application/json

{
  "messages": [
    {"role": "user", "content": "Hello, explain quantum computing"}
  ],
  "model": "gpt-4",
  "temperature": 0.7,
  "stream": false
}
```

Response:
```json
{
  "id": "chatcmpl-abc123",
  "model": "gpt-4",
  "choices": [{
    "index": 0,
    "message": {"role": "assistant", "content": "..."},
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 15,
    "completion_tokens": 200,
    "total_tokens": 215
  }
}
```

### Stream Response (SSE)

```http
POST /ai/chat/stream
Authorization: Bearer <token>
Content-Type: application/json

{
  "messages": [{"role": "user", "content": "Hello"}],
  "model": "gpt-3.5-turbo",
  "stream": true
}
```

### List Models

```http
GET /ai/models
```

## Memory

### Store Memory

```http
POST /memory/store
Authorization: Bearer <token>

{"content": "Important fact to remember", "source": "manual"}
```

### Search Memory

```http
POST /memory/search
Authorization: Bearer <token>

{"query": "important fact", "limit": 5}
```

## Tools

### List Tools

```http
GET /tools/
```

### Execute Tool

```http
POST /tools/execute
Authorization: Bearer <token>

{"tool_name": "web_search", "arguments": {"query": "latest AI news"}}
```

## Billing

### Get Usage

```http
GET /billing/usage
Authorization: Bearer <token>
```

### Get Subscription

```http
GET /billing/subscription
Authorization: Bearer <token>
```

### Get Invoice

```http
GET /billing/invoice
Authorization: Bearer <token>
```

## Health Check

```http
GET /health
```

Response:
```json
{"status": "healthy", "service": "DRAGON AI", "version": "1.0.0"}
```
