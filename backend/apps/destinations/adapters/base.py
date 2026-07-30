from dataclasses import dataclass


@dataclass
class ExportResult:
    success: bool
    external_url: str = ''
    external_id: str = ''
    error: str = ''


class BaseDestinationAdapter:
    provider: str = ''

    def export_clip(self, clip, destination) -> ExportResult:
        raise NotImplementedError
