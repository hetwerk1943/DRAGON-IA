"""Vector database client for long-term memory embeddings."""
from typing import Optional

from app.config import settings


def get_vector_client() -> Optional[object]:
    """Get a Qdrant vector database client."""
    try:
        from qdrant_client import QdrantClient
        client = QdrantClient(host=settings.QDRANT_HOST, port=settings.QDRANT_PORT)
        return client
    except Exception:
        return None
