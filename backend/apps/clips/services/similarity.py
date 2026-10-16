"""
Similarity & Related Clips Search Service.
pgvector and vector embeddings have been replaced with fast, in-database text and tag similarity matching.
"""
import logging
import re
from typing import Any, Dict, List, Optional, Tuple
from django.db.models import Q
from apps.clips.models import Clip

logger = logging.getLogger(__name__)


class VectorSimilarityEngine:
    """
    Search & Similarity Engine using fast relational keyword and token matching.
    Zero external AI or vector database dependencies.
    """

    @classmethod
    def search_similar_clips(
        cls,
        user,
        query_vector: Optional[List[float]] = None,
        query_text: str = '',
        threshold: float = 0.5,
        limit: int = 5,
    ) -> List[Dict[str, Any]]:
        """
        Finds matching clips for a user based on text content, title, and tags.
        """
        search_str = (query_text or '').strip()
        if not search_str and not query_vector:
            return []

        # If only query_vector was passed without text (e.g. from legacy tests), return empty
        if not search_str:
            return []

        # Extract search tokens
        clean = re.sub(r'[^\w\s]', ' ', search_str.lower())
        tokens = [t for t in clean.split() if len(t) >= 3][:8]
        if not tokens:
            tokens = [search_str.lower()[:50]]

        # Build OR filter
        q_filter = Q()
        for token in tokens:
            q_filter |= (
                Q(title__icontains=token)
                | Q(summary__icontains=token)
                | Q(tags__icontains=token)
            )

        clips_qs = (
            Clip.objects.filter(user=user)
            .filter(q_filter)
            .order_by('-created_at')[:limit]
            .values('id', 'title', 'summary', 'content_type', 'url')
        )

        results = []
        for c in clips_qs:
            results.append({
                'id': str(c['id']),
                'title': c['title'] or '',
                'summary': c['summary'] or '',
                'content_type': c['content_type'] or 'webpage',
                'url': c['url'] or '',
                'similarity_score': 0.85,
            })
        return results

    @classmethod
    def find_best_match(
        cls,
        user,
        query_vector: Optional[List[float]] = None,
        query_text: str = '',
        threshold: float = 0.5,
    ) -> Tuple[Optional[Dict[str, Any]], float]:
        results = cls.search_similar_clips(user, query_vector=query_vector, query_text=query_text, threshold=threshold, limit=1)
        if results:
            return results[0], results[0]['similarity_score']
        return None, 0.0
