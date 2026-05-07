"""Tiny persistent Redis-compatible job store.

Render runs this app as a single web container, so a lightweight JSON-backed
store is enough for job polling. The important part is that the file path is
absolute and writes are atomic; otherwise long downloads can finish while the UI
starts getting intermittent "Job not found" responses.
"""

from __future__ import annotations

import json
import os
import tempfile
import threading
from pathlib import Path
from typing import Any

BASE_DIR = Path(__file__).resolve().parents[1]
STORAGE_FILE = Path(os.environ.get("JOB_STORAGE_FILE", BASE_DIR / "job_storage.json")).resolve()


class DummyRedis:
    def __init__(self) -> None:
        self.data: dict[str, dict[str, str]] = {}
        self.lock = threading.RLock()
        self._load()

    def _load(self) -> None:
        with self.lock:
            if not STORAGE_FILE.exists():
                self.data = {}
                return

            try:
                with STORAGE_FILE.open("r", encoding="utf-8") as f:
                    raw_data = json.load(f)
                self.data = {
                    str(name): {str(k): str(v) for k, v in values.items()}
                    for name, values in raw_data.items()
                    if isinstance(values, dict)
                }
            except (OSError, json.JSONDecodeError):
                self.data = {}

    def _save(self) -> None:
        try:
            STORAGE_FILE.parent.mkdir(parents=True, exist_ok=True)
            with tempfile.NamedTemporaryFile(
                "w",
                encoding="utf-8",
                dir=STORAGE_FILE.parent,
                delete=False,
            ) as f:
                json.dump(self.data, f)
                temp_name = f.name
            os.replace(temp_name, STORAGE_FILE)
        except OSError as exc:
            print(f"[job-store] save failed: {exc}")

    def hset(
        self,
        name: str,
        key: str | None = None,
        value: Any | None = None,
        mapping: dict[str, Any] | None = None,
    ) -> None:
        with self.lock:
            if name not in self.data:
                self.data[name] = {}

            if mapping:
                for k, v in mapping.items():
                    self.data[name][str(k)] = str(v)
            elif key is not None and value is not None:
                self.data[name][str(key)] = str(value)

            self._save()

    def hgetall(self, name: str) -> dict[bytes, bytes]:
        with self.lock:
            # Reload before each read so status polling survives module reloads or
            # another worker/thread updating the JSON file.
            self._load()
            res = self.data.get(name, {})
            return {k.encode("utf-8"): v.encode("utf-8") for k, v in res.items()}


redis_client = DummyRedis()
