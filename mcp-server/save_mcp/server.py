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
    - Save new links and ideas to your vault with 'save_clip', optionally into a custom page (e.g. 'Books').
    - Organize clips into custom pages and workspaces (e.g. 'Books', 'AI Research') with 'list_pages', 'add_clip_to_page', and 'create_custom_page'.
    - Update tags, notes, and custom space assignments with 'update_clip'.
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
    page: Optional[str] = None,
) -> str:
    """
    Save a new URL, article, tweet, book, or excerpt to the user's Save catalog.
    The backend will automatically parse metadata, trigger AI summarization, and index it for search.
    If 'page' is provided (e.g. 'Books'), it will be saved directly into that custom space.

    Args:
        url: The web URL to save.
        selected_text: Optional highlighted text, quote, or excerpt.
        tags: Optional list of tags to categorize the clip.
        note: Optional personal note or reminder about why this was saved.
        intent: Optional intent label ('apply', 'learn', 'buy', 'attend', 'hire', 'track', 'other').
        page: Optional custom page name, slug, or UUID to file the clip under (e.g. 'Books').
    """
    try:
        client = _get_client()
        page_id = None
        if page:
            pages = client.list_pages()
            target_key = page.strip().lower()
            for p in pages:
                if str(p.get("id")) == page or p.get("slug", "").lower() == target_key or p.get("name", "").lower() == target_key:
                    page_id = str(p.get("id"))
                    break
            if not page_id:
                new_p = client.create_page(name=page.title())
                page_id = str(new_p.get("id"))

        result = client.save_clip(
            url=url,
            selected_text=selected_text,
            tags=tags or [],
            note=note,
            intent=intent,
            custom_page_id=page_id,
        )
        page_suffix = f" (Filed in page: '{page}')" if page else ""
        return f"Successfully saved clip! ID: {result.get('id')}\nTitle: {result.get('title') or url}{page_suffix}"
    except SaveApiError as e:
        return f"Error saving clip: {str(e)}"


@mcp.tool()
def update_clip(
    clip_id: str,
    tags: Optional[list[str]] = None,
    title: Optional[str] = None,
    intent: Optional[str] = None,
    note: Optional[str] = None,
    page: Optional[str] = None,
) -> str:
    """
    Update tags, title, intent, notes, or assigned custom page for an existing clip.

    Args:
        clip_id: The UUID of the clip to update.
        tags: Updated list of tags (replaces existing tags).
        title: Updated title string.
        intent: Updated intent ('apply', 'learn', 'buy', 'attend', 'hire', 'track', 'other').
        note: Updated user note.
        page: Optional custom page name or UUID to assign this clip to (e.g. 'Books').
    """
    try:
        client = _get_client()
        page_id = None
        if page:
            pages = client.list_pages()
            target_key = page.strip().lower()
            for p in pages:
                if str(p.get("id")) == page or p.get("slug", "").lower() == target_key or p.get("name", "").lower() == target_key:
                    page_id = str(p.get("id"))
                    break
            if not page_id:
                new_p = client.create_page(name=page.title())
                page_id = str(new_p.get("id"))

        result = client.update_clip(
            clip_id=clip_id,
            tags=tags,
            title=title,
            intent=intent,
            note=note,
            custom_page_id=page_id,
        )
        return f"Successfully updated clip {clip_id}."
    except SaveApiError as e:
        return f"Error updating clip {clip_id}: {str(e)}"


@mcp.tool()
def list_pages() -> str:
    """
    List all custom workspaces and pages created by the user (e.g. 'Books', 'AI Research', 'Jobs').
    Shows page names, IDs, slugs, descriptions, and current clip counts.
    """
    try:
        client = _get_client()
        pages = client.list_pages()
        if not pages:
            return "No custom pages found. You can create one using 'create_custom_page'."
        
        formatted = [
            {
                "id": p.get("id"),
                "name": p.get("name"),
                "slug": p.get("slug"),
                "description": p.get("description"),
                "clip_count": p.get("clip_count", 0),
                "ai_goal_prompt": p.get("ai_goal_prompt", ""),
            }
            for p in pages
        ]
        return json.dumps(formatted, indent=2)
    except SaveApiError as e:
        return f"Error listing custom pages: {str(e)}"


@mcp.tool()
def create_custom_page(
    name: str,
    description: str = "",
    ai_goal_prompt: str = "",
) -> str:
    """
    Create a new custom workspace/page with custom identity and AI Goal summarization rules.

    Args:
        name: Name of the page (e.g. 'Books', 'AI Research Papers', 'Startups').
        description: Brief description of what is collected here.
        ai_goal_prompt: Custom rule for the AI summarizer (e.g. 'Extract author, main thesis, key arguments, and reading difficulty').
    """
    try:
        client = _get_client()
        page = client.create_page(
            name=name,
            description=description,
            ai_goal_prompt=ai_goal_prompt,
        )
        return f"Successfully created page '{name}' (ID: {page.get('id')})!"
    except SaveApiError as e:
        return f"Error creating page: {str(e)}"


@mcp.tool()
def add_clip_to_page(
    clip_id: str,
    page: str,
) -> str:
    """
    Move or file an existing clip into a custom page (e.g. 'Books').
    If the page does not exist yet, it will automatically be created.

    Args:
        clip_id: The UUID of the clip to move/assign.
        page: The name, slug, or UUID of the custom page (e.g. 'Books').
    """
    try:
        client = _get_client()
        res = client.add_clip_to_page(clip_id=clip_id, page_name_or_id=page)
        return res.get("message", f"Assigned clip {clip_id} to page '{page}'.")
    except SaveApiError as e:
        return f"Error assigning clip to page: {str(e)}"


@mcp.tool()
def get_clusters(
    threshold: float = 0.72,
    min_size: int = 2,
    refresh: bool = False,
) -> str:
    """
    Retrieve auto-discovered semantic clusters/collections of clips from the user's vault.
    Uses vector cosine similarity with AI-generated category titles.

    Args:
        threshold: Vector similarity threshold (default 0.72). Higher values make tighter clusters.
        min_size: Minimum number of clips per cluster (default 2).
        refresh: Force recomputing clusters instead of reading from 5-minute cache (default False).
    """
    try:
        client = _get_client()
        result = client.get_clusters(threshold=threshold, min_size=min_size, refresh=refresh)
        clusters = result.get("clusters", [])
        if not clusters:
            return "No natural semantic clusters found among current clips (need more related items)."
        return json.dumps(result, indent=2)
    except SaveApiError as e:
        return f"Error discovering clusters: {str(e)}"


def main():
    """Main entrypoint running FastMCP over stdio transport."""
    mcp.run(transport="stdio")


if __name__ == "__main__":
    main()
