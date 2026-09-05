from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any


@dataclass
class ParsedBookmark:
    url: str
    title: str = ""
    tags: list[str] = field(default_factory=list)
    source_platform: str = "web"
    source_author: str = ""
    created_at: str | None = None
    selected_text: str = ""
    extra_metadata: dict[str, Any] = field(default_factory=dict)


class BaseImporter(ABC):
    @abstractmethod
    def parse(self, content: str | bytes) -> list[ParsedBookmark]:
        """
        Parses the raw file content or text and returns a list of ParsedBookmark objects.
        """
        pass
