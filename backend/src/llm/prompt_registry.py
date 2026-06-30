"""PromptRegistry — version-controlled prompt management.

Loads prompt segments from ``backend/prompts/<prompt_id>/<version>.json``
and provides helpers to build the full system prompt at runtime.

Design:
- JSON files are loaded on first access and cached in memory.
- The active version is resolved via ``settings.prompt_version``,
  making it easy to switch versions through environment variables.
- If a prompt file is missing, the registry falls back to the
  hardcoded defaults in ``src.agents.prompts`` (backward compat).
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from src.core.config import settings
from src.core.logging import get_logger

logger = get_logger("toan_truc_quan.llm.prompt_registry")

# Root directory for prompt files
_PROMPTS_DIR = Path(__file__).resolve().parents[2] / "prompts"


class PromptNotFoundError(LookupError):
    """Raised when a prompt file or version does not exist."""


class PromptRegistry:
    """Thread-safe (read-only after init) prompt registry.

    Caches loaded prompts in memory so repeated lookups avoid I/O.
    """

    def __init__(self) -> None:
        self._cache: dict[str, dict[str, Any]] = {}

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def get_prompt(self, prompt_id: str, version: str | None = None) -> dict[str, Any]:
        """Load a prompt version from disk or cache.

        Args:
            prompt_id: Identifier (e.g. ``"tutor_system"``).
            version: Semantic version (e.g. ``"v1"``).  Falls back to
                ``settings.prompt_version`` when ``None``.

        Returns:
            The parsed JSON content.

        Raises:
            PromptNotFoundError: If neither the requested file nor a
                fallback exists.
        """
        version = version or settings.prompt_version
        cache_key = f"{prompt_id}/{version}"

        if cache_key in self._cache:
            return self._cache[cache_key]

        file_path = _PROMPTS_DIR / prompt_id / f"{version}.json"
        if not file_path.is_file():
            raise PromptNotFoundError(
                f"Prompt file not found: {file_path} (prompt_id={prompt_id!r}, version={version!r})"
            )

        try:
            with open(file_path, encoding="utf-8") as f:
                data: dict[str, Any] = json.load(f)
        except (json.JSONDecodeError, OSError) as exc:
            raise PromptNotFoundError(f"Failed to load prompt file {file_path}: {exc}") from exc

        self._cache[cache_key] = data
        return data

    def get_active_version(self, prompt_id: str) -> str:
        """Return the currently active version string for *prompt_id*.

        This reads ``settings.prompt_version``.  The setting can be
        overridden via the ``PROMPT_VERSION`` environment variable.
        """
        return settings.prompt_version

    def list_prompts(self) -> list[dict[str, str]]:
        """List all available prompt versions on disk.

        Returns a list of ``{"prompt_id": …, "version": …}`` metadata
        dicts sorted by (prompt_id, version).
        """
        results: list[dict[str, str]] = []
        if not _PROMPTS_DIR.is_dir():
            return results

        for prompt_dir in sorted(_PROMPTS_DIR.iterdir()):
            if not prompt_dir.is_dir():
                continue
            pid = prompt_dir.name
            for fpath in sorted(prompt_dir.iterdir()):
                if fpath.suffix == ".json":
                    results.append({"prompt_id": pid, "version": fpath.stem})
        return results

    def build_system_prompt(
        self,
        prompt_id: str,
        version: str | None,
        level: str,
    ) -> str:
        """Assemble the full system prompt from segments.

        Builds::

            {base}

            {tool_use}

            {clarification}

            {levels[level]}

        Args:
            prompt_id: Prompt identifier.
            version: Version string; ``None`` → use active version.
            level: Tutor level (``"L1"`` … ``"L5"``).

        Returns:
            The joined system prompt string.
        """
        prompt = self.get_prompt(prompt_id, version)
        segments = prompt["segments"]

        parts = [
            segments["base"],
            segments["tool_use"],
            segments["clarification"],
            segments["levels"].get(level, segments["levels"]["L3"]),
        ]
        return "\n\n".join(parts)


# Singleton instance for the whole app
_registry: PromptRegistry | None = None


def get_prompt_registry() -> PromptRegistry:
    """Return the global PromptRegistry singleton."""
    global _registry  # noqa: PLW0603
    if _registry is None:
        _registry = PromptRegistry()
    return _registry
