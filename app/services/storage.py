from pathlib import Path
from uuid import uuid4

from core.config import get_settings


class LocalStorageGateway:
    def __init__(self) -> None:
        self.root = Path(get_settings().storage_root)
        self.root.mkdir(parents=True, exist_ok=True)

    def save(self, filename: str, content: bytes) -> str:
        file_id = f"{uuid4()}{Path(filename).suffix}"
        (self.root / file_id).write_bytes(content)
        return file_id

    def resolve(self, file_id: str) -> Path:
        return self.root / file_id
