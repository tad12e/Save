"""
Smart Auto-Clustering Service for Save Clipper.
Clusters clips into natural semantic groups using:
1. Vector Embedding Cosine Distance (Local Math, 0 API cost)
2. Keyword & Domain Jaccard Overlap (Offline Fallback, 0 AI cost)

Generates cluster names using:
1. Gemini Generative AI (if API key configured)
2. Frequency & Noun N-Gram Extraction (Zero-AI Fallback, 0 API cost)
"""

import json
import logging
import math
import os
import re
import urllib.request
from collections import Counter
from typing import Any, Dict, List, Optional
from django.conf import settings
from apps.clips.models import Clip

logger = logging.getLogger(__name__)

STOPWORDS = {
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
    'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
    'to', 'was', 'were', 'will', 'with', 'the', 'this', 'but', 'they',
    'have', 'had', 'what', 'when', 'where', 'who', 'which', 'why', 'how',
    'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some',
    'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too',
    'very', 'can', 'just', 'should', 'now', 'video', 'post', 'clip', 'page',
}


class ClipClusterEngine:
    @classmethod
    def discover_clusters_for_user(
        cls,
        user,
        similarity_threshold: float = 0.72,
        min_cluster_size: int = 2
    ) -> List[Dict[str, Any]]:
        """
        Main entry point: Discovers semantic clusters for a user's clips.
        Uses vector embeddings if available, falls back to keyword overlap otherwise.
        """
        clips_qs = (
            Clip.objects.filter(user=user)
            .order_by('-created_at')[:80]
            .values('id', 'title', 'summary', 'content_type', 'intent', 'url', 'embedding', 'created_at')
        )
        clips_list = list(clips_qs)
        if len(clips_list) < min_cluster_size:
            return []

        # 1. Try Vector Clustering first (Fast, Local Math)
        clusters = cls._cluster_by_vector_embeddings(clips_list, similarity_threshold, min_cluster_size)

        # 2. Fallback: If clips lack embeddings, cluster by keyword & domain overlap
        if not clusters:
            clusters = cls._cluster_by_keyword_overlap(clips_list, min_cluster_size)

        # 3. Generate human-readable names for each cluster in a single batch call
        cluster_names = cls._generate_cluster_names_batch(clusters)
        results = []
        for idx, cluster_clips in enumerate(clusters):
            cluster_name = cluster_names.get(idx) or cls._fallback_ngram_cluster_name(
                [c.get('title') or '' for c in cluster_clips if c.get('title')],
                cluster_clips
            )
            intents = [c.get('intent') for c in cluster_clips if c.get('intent')]
            intent_summary = dict(Counter(intents))
            results.append({
                'cluster_id': f"cluster_{idx + 1}",
                'name': cluster_name,
                'count': len(cluster_clips),
                'clip_ids': [str(c['id']) for c in cluster_clips],
                'intent_summary': intent_summary,
                'preview_clips': [
                    {
                        'id': str(c['id']),
                        'title': c.get('title') or 'Untitled Clip',
                        'content_type': c.get('content_type') or 'webpage',
                        'intent': c.get('intent') or 'learn',
                        'url': c.get('url') or '',
                    }
                    for c in cluster_clips[:4]
                ],
            })

        return results

    # =========================================================================
    # 1. VECTOR CLUSTERING (Vectorized Matrix Math: ~2ms, 0 API Calls)
    # =========================================================================
    @classmethod
    def _cluster_by_vector_embeddings(
        cls,
        clips_list: List[Dict],
        threshold: float,
        min_size: int
    ) -> List[List[Dict]]:
        """
        Greedy centroid clustering based on Cosine Similarity.
        Uses NumPy BLAS vectorization for sub-millisecond execution.
        """
        valid_clips = [
            c for c in clips_list
            if isinstance(c.get('embedding'), list) and len(c['embedding']) >= 64
        ]
        if len(valid_clips) < min_size:
            return []

        try:
            import numpy as np

            # 1. Convert to float32 matrix: Shape (N, 768)
            matrix = np.array([c['embedding'] for c in valid_clips], dtype=np.float32)

            # 2. Normalize all vectors ONCE upfront
            norms = np.linalg.norm(matrix, axis=1, keepdims=True)
            norms[norms == 0] = 1e-10
            normalized = matrix / norms

            # 3. Compute all pairwise cosine similarities in 1 single C/SIMD operation
            sim_matrix = np.dot(normalized, normalized.T)

            # 4. Form clusters from precomputed matrix
            visited = set()
            clusters: List[List[Dict]] = []

            for i, clip_a in enumerate(valid_clips):
                if i in visited:
                    continue

                current_cluster = [clip_a]
                visited.add(i)

                # Find all neighbors where similarity >= threshold in microseconds
                matching_indices = np.where(sim_matrix[i] >= threshold)[0]
                for j in matching_indices:
                    if j not in visited and i != j:
                        current_cluster.append(valid_clips[j])
                        visited.add(j)

                if len(current_cluster) >= min_size:
                    clusters.append(current_cluster)

            return clusters

        except ImportError:
            # Fallback if numpy is not installed
            visited = set()
            clusters = []
            for i, clip_a in enumerate(valid_clips):
                cid = clip_a['id']
                if cid in visited:
                    continue
                current_cluster = [clip_a]
                visited.add(cid)
                vec_a = clip_a['embedding']
                for j, clip_b in enumerate(valid_clips):
                    c_bid = clip_b['id']
                    if c_bid in visited or i == j:
                        continue
                    if cls._cosine_similarity(vec_a, clip_b['embedding']) >= threshold:
                        current_cluster.append(clip_b)
                        visited.add(c_bid)
                if len(current_cluster) >= min_size:
                    clusters.append(current_cluster)
            return clusters

    @staticmethod
    def _cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
        if len(vec_a) != len(vec_b):
            return 0.0
        dot = sum(a * b for a, b in zip(vec_a, vec_b))
        mag_a = math.sqrt(sum(a * a for a in vec_a))
        mag_b = math.sqrt(sum(b * b for b in vec_b))
        if mag_a == 0 or mag_b == 0:
            return 0.0
        return dot / (mag_a * mag_b)

    # =========================================================================
    # 2. KEYWORD OVERLAP CLUSTERING (Offline Zero-Embedding Fallback)
    # =========================================================================
    @classmethod
    def _cluster_by_keyword_overlap(
        cls,
        clips_list: List[Dict],
        min_size: int
    ) -> List[List[Dict]]:
        """
        Clusters clips using Jaccard token similarity when embeddings do not exist.
        """
        tokenized_clips = []
        for c in clips_list:
            text = f"{c.get('title', '')} {c.get('summary', '')}".lower()
            tokens = set(re.findall(r'[a-z]{3,}', text)) - STOPWORDS
            tokenized_clips.append((c, tokens))

        visited = set()
        clusters: List[List[Dict]] = []

        for i, (clip_a, tokens_a) in enumerate(tokenized_clips):
            cid = clip_a['id']
            if cid in visited or not tokens_a:
                continue

            current_cluster = [clip_a]
            visited.add(cid)

            for j, (clip_b, tokens_b) in enumerate(tokenized_clips):
                c_bid = clip_b['id']
                if c_bid in visited or i == j or not tokens_b:
                    continue

                intersection = len(tokens_a & tokens_b)
                union = len(tokens_a | tokens_b)
                jaccard = (intersection / union) if union > 0 else 0.0

                if jaccard >= 0.25:  # Shared core vocabulary
                    current_cluster.append(clip_b)
                    visited.add(c_bid)

            if len(current_cluster) >= min_size:
                clusters.append(current_cluster)

        return clusters

    # =========================================================================
    # 3. CLUSTER NAMING (Gemini AI with Zero-AI Fallback)
    # =========================================================================
    @classmethod
    def _generate_cluster_names_batch(cls, clusters: List[List[Dict]]) -> Dict[int, str]:
        """
        Names all clusters in a single batch request to Gemini (O(1) network round-trip).
        Falls back to pure Python frequency analysis for any missing clusters.
        """
        results: Dict[int, str] = {}
        api_key = os.getenv('GEMINI_API_KEY') or getattr(settings, 'GEMINI_API_KEY', '')

        # Gather titles per cluster
        cluster_data: Dict[int, tuple[List[str], List[Dict]]] = {}
        for idx, cluster_clips in enumerate(clusters):
            titles = [c.get('title') or '' for c in cluster_clips if c.get('title')]
            cluster_data[idx] = (titles, cluster_clips)

        if api_key and cluster_data:
            try:
                # Prepare a single prompt with all clusters
                cluster_prompt_blocks = []
                for idx, (titles, _) in cluster_data.items():
                    sample = titles[:5]
                    if sample:
                        titles_str = '\n'.join(f"  - {t}" for t in sample)
                        cluster_prompt_blocks.append(f"Cluster {idx}:\n{titles_str}")

                if cluster_prompt_blocks:
                    prompt = (
                        "Here are clusters of saved bookmarks:\n\n"
                        + "\n\n".join(cluster_prompt_blocks)
                        + "\n\nTask: For each cluster, produce a concise 2-4 word category name (e.g., 'Remote Tech Jobs', 'Machine Learning', 'Productivity Tools').\n"
                        "Respond ONLY with a valid JSON object mapping the numeric cluster index string to its category name, like: {\"0\": \"AI News\", \"1\": \"Frontend Tools\"}"
                    )
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
                    body = json.dumps({
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": {"temperature": 0.2, "responseMimeType": "application/json"}
                    }).encode('utf-8')
                    req = urllib.request.Request(url, data=body, headers={'Content-Type': 'application/json'})
                    with urllib.request.urlopen(req, timeout=5) as response:
                        res_json = json.loads(response.read().decode('utf-8'))
                        candidate = res_json.get('candidates', [{}])[0]
                        raw_text = candidate.get('content', {}).get('parts', [{}])[0].get('text', '').strip()
                        if raw_text:
                            parsed_map = json.loads(raw_text)
                            if isinstance(parsed_map, dict):
                                for k, name in parsed_map.items():
                                    try:
                                        k_int = int(k)
                                        clean_name = re.sub(r'["\'.]', '', str(name)).strip()
                                        if 2 <= len(clean_name) <= 40:
                                            results[k_int] = clean_name
                                    except (ValueError, TypeError) as parse_err:
                                        logger.warning("Batch cluster naming: skipping invalid key/name pair (%r: %r): %s", k, name, parse_err)
                                        continue
            except Exception as exc:
                logger.info("Batch Gemini cluster naming fallback triggered: %s", exc)

        # Fall back to instant local N-Gram analysis for any missing clusters
        for idx, (titles, cluster_clips) in cluster_data.items():
            if idx not in results:
                results[idx] = cls._fallback_ngram_cluster_name(titles, cluster_clips)

        return results

    @classmethod
    def _generate_cluster_name(cls, cluster_clips: List[Dict]) -> str:
        """Single cluster naming wrapper for backwards compatibility."""
        batch_res = cls._generate_cluster_names_batch([cluster_clips])
        return batch_res.get(0, 'Saved Collection')

    @classmethod
    def _fallback_ngram_cluster_name(cls, titles: List[str], cluster_clips: List[Dict]) -> str:
        """
        Pure frequency extraction without any AI:
        Finds the most frequent meaningful 2-word or 3-word phrase across titles.
        """
        words_list = []
        for t in titles:
            cleaned = re.sub(r'[^a-zA-Z\s]', ' ', t.lower())
            tokens = [w for w in cleaned.split() if w not in STOPWORDS and len(w) > 2]
            words_list.extend(tokens)

        # 1. Check bigrams (2-word pairs)
        bigrams = []
        for t in titles:
            cleaned = re.sub(r'[^a-zA-Z\s]', ' ', t.lower())
            tokens = [w for w in cleaned.split() if w not in STOPWORDS and len(w) > 2]
            for i in range(len(tokens) - 1):
                bigrams.append(f"{tokens[i]} {tokens[i+1]}")

        if bigrams:
            bigram_counts = Counter(bigrams)
            most_common_bigram, count = bigram_counts.most_common(1)[0]
            if count >= 2:
                return most_common_bigram.title()

        # 2. Check top unigrams
        word_counts = Counter(words_list)
        if word_counts:
            top_words = [w.capitalize() for w, _ in word_counts.most_common(2)]
            content_type = cluster_clips[0].get('content_type', 'Items').capitalize()
            return f"{' '.join(top_words)} {content_type}"

        # 3. Final default
        return "Saved Collection"
