import json
import logging
import sys
from typing import Any, Optional

try:
    from mcp.server.mcpserver import MCPServer as FastMCP
except ImportError:
    try:
        from mcp.server.fastmcp import FastMCP
    except ImportError:
        from fastmcp import FastMCP

from .client import SaveApiClient, SaveApiError

logger = logging.getLogger(__name__)

# Initialize MCP application
mcp = FastMCP(
    "Save",
    instructions="""
    Save is your personal AI knowledge vault and bookmark catalog.
    Use this server to:
    - Search through bookmarks, research links, and notes by semantic meaning or keyword.
    - List and filter clips by Action Intent ('apply', 'learn', 'buy', 'attend', 'hire', 'track', 'other') or source platform.
    - Read full extracted article/page text with 'read_clip_content' for in-depth analysis.
    - Save new links and ideas to your vault with 'save_clip'.
    - Update tags and notes with 'update_clip'.
    """,
)


def _get_client() -> SaveApiClient:
    return SaveApiClient()


@mcp.tool()
def search_clips(
    query: str,
    intent: Optional[str] = None,
    platform: Optional[str] = None,
    limit: int = 10,
) -> str:
    """
    Search saved clips and bookmarks by semantic meaning or keyword.

    Args:
        query: The search query, concept, question, or keyword to match against clips.
        intent: Optional action intent filter ('apply', 'learn', 'buy', 'attend', 'hire', 'track', 'other').
        platform: Optional platform filter ('web', 'x_twitter', 'reddit', 'youtube', 'github', 'linkedin').
        limit: Maximum number of results to return (default 10).
    """
    try:
        client = _get_client()
        results = client.search_clips(query=query, intent=intent, platform=platform, limit=limit)
        if not results:
            return f"No clips found matching '{query}'."

        formatted = []
        for c in results:
            extra = c.get('extra_metadata') or {}
            c_intent = extra.get('intent') or extra.get('category_name') or 'other'
            formatted.append({
                "id": c.get("id"),
                "title": c.get("title") or c.get("url"),
                "url": c.get("url"),
                "intent": c_intent,
                "platform": c.get("source_platform"),
                "author": c.get("source_author"),
                "tags": c.get("tags", []),
                "summary": c.get("summary") or "No summary available.",
                "deadline": c.get("deadline_date"),
            })
        return json.dumps(formatted, indent=2)
    except SaveApiError as e:
        return f"Error connecting to Save: {str(e)}"


@mcp.tool()
def list_clips(
    intent: Optional[str] = None,
    platform: Optional[str] = None,
    tag: Optional[str] = None,
    limit: int = 20,
) -> str:
    """
    List recent clips from the user's catalog with optional filters.

    Args:
        intent: Optional intent filter ('apply', 'learn', 'buy', 'attend', 'hire', 'track', 'other').
        platform: Optional platform filter ('web', 'x_twitter', 'reddit', 'youtube', 'github', 'linkedin').
        tag: Optional single tag filter (e.g. 'ai', 'python', 'design').
        limit: Number of clips to return (default 20, max 50).
    """
    try:
        client = _get_client()
        clips = client.list_clips(intent=intent, platform=platform, tag=tag, limit=limit)
        if not clips:
            filter_desc = []
            if intent:
                filter_desc.append(f"intent={intent}")
            if platform:
                filter_desc.append(f"platform={platform}")
            if tag:
                filter_desc.append(f"tag={tag}")
            suffix = f" with {', '.join(filter_desc)}" if filter_desc else ""
            return f"No clips found in your Save catalog{suffix}."

        simplified = [
            {
                "id": c.get("id"),
                "title": c.get("title") or c.get("url"),
                "url": c.get("url"),
                "platform": c.get("source_platform"),
                "tags": c.get("tags", []),
                "summary": (c.get("summary") or "")[:200] + ("..." if len(c.get("summary") or "") > 200 else ""),
                "created_at": c.get("created_at"),
            }
            for c in clips
        ]
        return json.dumps(simplified, indent=2)
    except SaveApiError as e:
        return f"Error connecting to Save: {str(e)}"


@mcp.tool()
def get_clip(clip_id: str) -> str:
    """
    Get detailed metadata, tags, and summary for a specific clip by its UUID.

    Args:
        clip_id: The UUID of the clip to retrieve.
    """
    try:
        client = _get_client()
        clip = client.get_clip(clip_id)
        return json.dumps(clip, indent=2)
    except SaveApiError as e:
        return f"Error retrieving clip {clip_id}: {str(e)}"


@mcp.tool()
def read_clip_content(clip_id: str) -> str:
    """
    Retrieve the full extracted text/content of a saved webpage or article.
    Use this when you need to read the complete article, examine source code, or synthesize deep analysis.

    Args:
        clip_id: The UUID of the clip to read.
    """
    try:
        client = _get_client()
        data = client.read_clip_content(clip_id)
        content = data.get("content") or data.get("summary") or "No readable text content available for this clip."
        header = f"# {data.get('title')}\nSource: {data.get('url')}\nAuthor: {data.get('author') or 'Unknown'}\nTags: {', '.join(data.get('tags', []))}\n\n---\n\n"
        return header + content
    except SaveApiError as e:
        return f"Error reading content for clip {clip_id}: {str(e)}"


@mcp.tool()
def save_clip(
    url: str,
    selected_text: str = "",
    tags: Optional[list[str]] = None,
    note: str = "",
    intent: Optional[str] = None,
) -> str:
    """
    Save a new URL, article, tweet, or excerpt to the user's Save catalog.
    The backend will automatically parse metadata, trigger AI summarization, and index it for search.

    Args:
        url: The web URL to save.
        selected_text: Optional highlighted text, quote, or excerpt.
        tags: Optional list of tags to categorize the clip.
        note: Optional personal note or reminder about why this was saved.
        intent: Optional intent label ('apply', 'learn', 'buy', 'attend', 'hire', 'track', 'other').
    """
    try:
        client = _get_client()
        result = client.save_clip(
            url=url,
            selected_text=selected_text,
            tags=tags or [],
            note=note,
            intent=intent,
        )
        return f"Successfully saved clip! ID: {result.get('id')}\nTitle: {result.get('title') or url}"
    except SaveApiError as e:
        return f"Error saving clip: {str(e)}"


@mcp.tool()
def update_clip(
    clip_id: str,
    tags: Optional[list[str]] = None,
    title: Optional[str] = None,
    intent: Optional[str] = None,
    note: Optional[str] = None,
) -> str:
    """
    Update tags, title, intent, or notes for an existing clip in the catalog.

    Args:
        clip_id: The UUID of the clip to update.
        tags: Updated list of tags (replaces existing tags).
        title: Updated title string.
        intent: Updated intent ('apply', 'learn', 'buy', 'attend', 'hire', 'track', 'other').
        note: Updated user note.
    """
    try:
        client = _get_client()
        result = client.update_clip(
            clip_id=clip_id,
            tags=tags,
            title=title,
            intent=intent,
            note=note,
        )
        return f"Successfully updated clip {clip_id}."
    except SaveApiError as e:
        return f"Error updating clip {clip_id}: {str(e)}"


def main():
    """Main entrypoint running FastMCP over stdio transport."""
    mcp.run(transport="stdio")


if __name__ == "__main__":
    main()
