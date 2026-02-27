"""Redis client for caching and short-term memory."""
import redis
from typing import Optional

from app.config import settings


def get_redis_client() -> Optional[redis.Redis]:
    """Get a Redis client connection."""
    try:
        client = redis.from_url(settings.REDIS_URL, decode_responses=False)
        client.ping()
        return client
    except (redis.ConnectionError, redis.RedisError):
        return None
