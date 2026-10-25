import os
from typing import Any, Optional
import httpx
from dotenv import load_dotenv

load_dotenv()


class SaveApiError(Exception):
    pass


class SaveApiClient:
    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None):
        self.api_key = api_key or os.getenv("SAVE_API_KEY", "").strip()
        raw_base_url = (base_url or os.getenv("SAVE_API_URL", "http://localhost:8000/api/v1")).rstrip("/")
        # Ensure base_url points to the api/v1 prefix
        if not raw_base_url.endswith("/api/v1") and not raw_base_url.endswith("/api"):
            self.base_url = f"{raw_base_url}/api/v1"
        else:
            self.base_url = raw_base_url

        if not self.api_key:
            raise SaveApiError(
                "Missing SAVE_API_KEY. Please set the SAVE_API_KEY environment variable with your Save API key."
            )

        self.headers = {
            "Authorization": f"Api-Key {self.api_key}",
            "Content-Type": "application/json",
            "User-Agent": "Save-MCP-Server/0.1.0",
        }

    def _request(self, method: str, path: str, **kwargs) -> Any:
        url = f"{self.base_url}{path}"
        try:
            with httpx.Client(timeout=30.0) as client:
                response = client.request(method, url, headers=self.headers, **kwargs)
        except httpx.ConnectError:
            raise SaveApiError(
                f"Failed to connect to Save backend at {self.base_url}. Ensure your Save backend server is running."
            )
        except Exception as e:
            raise SaveApiError(f"HTTP request error: {str(e)}")

        if response.status_code == 401:
            raise SaveApiError("Authentication failed. Invalid or revoked SAVE_API_KEY.")
        elif response.status_code == 403:
            raise SaveApiError("Access forbidden for this resource.")
        elif response.status_code == 404:
            raise SaveApiError(f"Resource not found at {path}.")
        elif response.status_code >= 400:
            error_detail = response.text
            try:
                error_detail = response.json().get("error", response.text)
            except Exception:
                pass
            raise SaveApiError(f"Backend returned error {response.status_code}: {error_detail}")

        if response.status_code == 204 or not response.content:
            return {}

        return response.json()

    def search_clips(
        self,
        query: str,
        intent: Optional[str] = None,
        platform: Optional[str] = None,
        limit: int = 10,
    ) -> list[dict]:
        """
        Search clips using vector similarity + keyword matching.
        """
        params: dict[str, Any] = {"q": query, "limit": limit}
        if intent:
            params["intent"] = intent
        if platform:
            params["platform"] = platform

        try:
            # Try semantic search first
            data = self._request("GET", "/clips/similar/", params=params)
            results = data.get("results", data) if isinstance(data, dict) else data
            if isinstance(results, list) and len(results) > 0:
                return results[:limit]
        except Exception:
            pass

        # Fallback to listing clips
        clips = self._request("GET", "/clips/")
        if not isinstance(clips, list):
            clips = clips.get("results", [])

        q_lower = query.lower()
        matched = []
        for c in clips:
            haystack = f"{c.get('title', '')} {c.get('summary', '')} {' '.join(c.get('tags', []))}".lower()
            if q_lower in haystack:
                if intent and (c.get('extra_metadata') or {}).get('intent') != intent:
                    continue
                if platform and c.get('source_platform') != platform:
                    continue
                matched.append(c)

        return matched[:limit] if matched else clips[:limit]

    def list_clips(
        self,
        intent: Optional[str] = None,
        platform: Optional[str] = None,
        tag: Optional[str] = None,
        limit: int = 20,
    ) -> list[dict]:
        """
        List saved clips with optional filters.
        """
        clips = self._request("GET", "/clips/")
        if not isinstance(clips, list):
            clips = clips.get("results", [])

        filtered = []
        for c in clips:
            if intent:
                clip_intent = (c.get("extra_metadata") or {}).get("intent") or (c.get("extra_metadata") or {}).get("category_name", "").lower()
                if clip_intent != intent.lower():
                    continue
            if platform and c.get("source_platform") != platform.lower():
                continue
            if tag:
                c_tags = [t.lower() for t in c.get("tags", [])]
                if tag.lower() not in c_tags:
                    continue
            filtered.append(c)

        return filtered[:limit]

    def get_clip(self, clip_id: str) -> dict:
        """
        Get structured metadata and summary for a single clip.
        """
        return self._request("GET", f"/clips/{clip_id}/")

    def read_clip_content(self, clip_id: str) -> dict:
        """
        Get full extracted page text / markdown content of a clip for deep reading.
        """
        return self._request("GET", f"/clips/{clip_id}/content/")

    def save_clip(
        self,
        url: str,
        selected_text: str = "",
        tags: Optional[list[str]] = None,
        note: str = "",
        intent: Optional[str] = None,
        custom_page_id: Optional[str] = None,
    ) -> dict:
        """
        Save a new URL or excerpt to the user's catalog.
        """
        payload: dict[str, Any] = {
            "url": url,
            "selected_text": selected_text,
            "tags": tags or [],
            "note": note,
        }
        if intent:
            payload["intent"] = intent
        if custom_page_id:
            payload["custom_page_id"] = custom_page_id
        return self._request("POST", "/clips/", json=payload)

    def update_clip(
        self,
        clip_id: str,
        tags: Optional[list[str]] = None,
        title: Optional[str] = None,
        intent: Optional[str] = None,
        note: Optional[str] = None,
        custom_page_id: Optional[str] = None,
    ) -> dict:
        """
        Update tags, title, intent, notes, or assigned custom page for an existing clip.
        """
        payload: dict[str, Any] = {}
        if tags is not None:
            payload["tags"] = tags
        if title is not None:
            payload["title"] = title
        if intent is not None:
            payload["intent"] = intent
        if note is not None:
            payload["note"] = note
        if custom_page_id is not None:
            payload["custom_page_id"] = custom_page_id

        return self._request("PATCH", f"/clips/{clip_id}/", json=payload)

    def list_pages(self) -> list[dict]:
        """
        List all custom workspaces/pages for the user with live clip counts.
        """
        data = self._request("GET", "/clips/pages/")
        return data if isinstance(data, list) else []

    def create_page(
        self,
        name: str,
        description: str = "",
        icon_name: str = "Bookmark",
        color: str = "#8B5CF6",
        ai_goal_prompt: str = "",
        content_types: Optional[list[str]] = None,
    ) -> dict:
        """
        Create a new custom workspace/page with custom theme and AI goal extraction rules.
        """
        payload = {
            "name": name,
            "description": description,
            "icon_name": icon_name,
            "color": color,
            "ai_goal_prompt": ai_goal_prompt,
            "content_types": content_types or ["general", "article"],
        }
        return self._request("POST", "/clips/pages/", json=payload)

    def add_clip_to_page(self, clip_id: str, page_name_or_id: str) -> dict:
        """
        Assigns an existing clip to a custom page by page name, slug, or UUID.
        """
        pages = self.list_pages()
        target_page = None
        target_key = page_name_or_id.strip().lower()

        for p in pages:
            if str(p.get("id")) == page_name_or_id or p.get("slug", "").lower() == target_key or p.get("name", "").lower() == target_key:
                target_page = p
                break

        if not target_page:
            # If page doesn't exist, automatically create it!
            target_page = self.create_page(name=page_name_or_id.title())

        updated = self.update_clip(clip_id=clip_id, custom_page_id=str(target_page["id"]))
        return {
            "clip": updated,
            "page": target_page,
            "message": f"Successfully added clip {clip_id} to page '{target_page.get('name')}'."
        }

    def get_clusters(
        self,
        threshold: float = 0.72,
        min_size: int = 2,
        refresh: bool = False,
    ) -> dict:
        """
        Discover auto-clustered semantic groups for the user's saved clips.
        """
        params: dict[str, Any] = {
            "threshold": threshold,
            "min_size": min_size,
        }
        if refresh:
            params["refresh"] = "true"
        return self._request("GET", "/clips/clusters/", params=params)
