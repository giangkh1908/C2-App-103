#!/usr/bin/env python3
"""CLI tool for prompt version management.

Usage:
    python scripts/prompt_cli.py list
    python scripts/prompt_cli.py show <prompt_id> [--version <v>]
    python scripts/prompt_cli.py diff <prompt_id> <v1> <v2>
"""

import argparse
import json
import sys
from pathlib import Path

# Ensure backend/ is on sys.path so we can import from src
_HERE = Path(__file__).resolve().parent
_BACKEND = _HERE.parent
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))


def cmd_list() -> None:
    from src.llm.prompt_registry import get_prompt_registry

    prompts = get_prompt_registry().list_prompts()
    if not prompts:
        print("No prompt versions found.")
        return

    print(f"{'Prompt ID':<20} {'Version':<10}")
    print("-" * 30)
    for p in prompts:
        print(f"{p['prompt_id']:<20} {p['version']:<10}")


def cmd_show(prompt_id: str, version: str | None) -> None:
    from src.llm.prompt_registry import get_prompt_registry

    try:
        prompt = get_prompt_registry().get_prompt(prompt_id, version)
    except LookupError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        sys.exit(1)

    used_version = version or prompt.get("version", "?")
    print(f"Prompt ID : {prompt.get('prompt_id', prompt_id)}")
    print(f"Version   : {used_version}")
    print(f"Description: {prompt.get('description', '')}")
    print(f"Created   : {prompt.get('created_at', '')}")
    print()

    segments = prompt.get("segments", {})
    for key in ("base", "tool_use", "clarification"):
        val = segments.get(key, "")
        print(f"─── {key} ───")
        print(val[:500] + ("..." if len(val) > 500 else ""))
        print()

    levels = segments.get("levels", {})
    if levels:
        print(f"─── levels ({', '.join(levels.keys())}) ───")
        for lvl, text in levels.items():
            print(f"  {lvl}: {text[:120]}" + ("..." if len(text) > 120 else ""))


def cmd_diff(prompt_id: str, v1: str, v2: str) -> None:
    from difflib import unified_diff

    from src.llm.prompt_registry import get_prompt_registry

    reg = get_prompt_registry()
    try:
        p1 = reg.get_prompt(prompt_id, v1)
        p2 = reg.get_prompt(prompt_id, v2)
    except LookupError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        sys.exit(1)

    segs1 = p1.get("segments", {})
    segs2 = p2.get("segments", {})

    all_keys = sorted(set(segs1.keys()) | set(segs2.keys()))
    for key in all_keys:
        text1 = str(segs1.get(key, ""))
        text2 = str(segs2.get(key, ""))
        if text1 == text2:
            continue
        print(f"─── {key} ───")
        for line in unified_diff(
            text1.splitlines(keepends=True),
            text2.splitlines(keepends=True),
            fromfile=f"{v1}/{key}",
            tofile=f"{v2}/{key}",
        ):
            print(line.rstrip())
        print()


def main() -> None:
    parser = argparse.ArgumentParser(description="Prompt version management CLI")
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("list", help="List all prompt versions")

    show_p = sub.add_parser("show", help="Show a prompt version")
    show_p.add_argument("prompt_id", help="Prompt identifier (e.g. tutor_system)")
    show_p.add_argument("--version", "-v", default=None, help="Version (default: active)")

    diff_p = sub.add_parser("diff", help="Diff two prompt versions")
    diff_p.add_argument("prompt_id", help="Prompt identifier")
    diff_p.add_argument("v1", help="First version")
    diff_p.add_argument("v2", help="Second version")

    args = parser.parse_args()

    if args.command == "list":
        cmd_list()
    elif args.command == "show":
        cmd_show(args.prompt_id, args.version)
    elif args.command == "diff":
        cmd_diff(args.prompt_id, args.v1, args.v2)


if __name__ == "__main__":
    main()
