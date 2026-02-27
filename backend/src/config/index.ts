import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    url: process.env.DATABASE_URL || 'postgresql://dragon:dragon@localhost:5432/dragonai',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  jwt: {
    secret: (() => {
      const secret = process.env.JWT_SECRET;
      if (!secret && process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET must be set in production');
      }
      return secret || 'dev-secret-change-me';
    })(),
    expiresIn: '24h',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    defaultModel: process.env.DEFAULT_MODEL || 'gpt-4',
  },
  vectorDb: {
    url: process.env.VECTOR_DB_URL || 'http://localhost:6333',
  },
};
