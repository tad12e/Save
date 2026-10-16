"""
Embedding generation service (DISABLED).
Vector embeddings and pgvector have been removed to eliminate AI costs and dependencies.
"""
import logging

logger = logging.getLogger(__name__)


def generate_embedding(text: str) -> list[float] | None:
    """Vector embeddings are disabled."""
    return None
