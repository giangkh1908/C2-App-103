#!/usr/bin/env python3
import argparse
import json
from pathlib import Path
import sys
from time import sleep
from typing import Any

import requests

ROWS_API_URL = "https://datasets-server.huggingface.co/rows"
DEFAULT_OUTPUT_PATH = (
    Path(__file__).resolve().parents[1] / "data" / "practice" / "vi_grade_school_math_mcq_full.json"
)
DEFAULT_DATASET = "hllj/vi_grade_school_math_mcq"
DEFAULT_CONFIG = "default"
DEFAULT_SPLIT = "train"


def fetch_page(
    dataset: str, config: str, split: str, offset: int, length: int, timeout: float
) -> dict[str, Any]:
    response = requests.get(
        ROWS_API_URL,
        params={
            "dataset": dataset,
            "config": config,
            "split": split,
            "offset": offset,
            "length": length,
        },
        timeout=timeout,
    )
    response.raise_for_status()
    payload = response.json()
    if not isinstance(payload, dict):
        raise ValueError("Unexpected rows API response shape")
    return payload


def extract_rows(payload: dict[str, Any]) -> list[dict[str, Any]]:
    rows = payload.get("rows") or []
    normalized_rows: list[dict[str, Any]] = []
    for item in rows:
        if isinstance(item, dict) and isinstance(item.get("row"), dict):
            normalized_rows.append(item["row"])
    return normalized_rows


def fetch_all_rows(
    dataset: str, config: str, split: str, page_size: int, timeout: float, pause_ms: int
) -> list[dict[str, Any]]:
    offset = 0
    all_rows: list[dict[str, Any]] = []

    while True:
        payload = fetch_page(dataset, config, split, offset, page_size, timeout)
        page_rows = extract_rows(payload)
        if not page_rows:
            break
        all_rows.extend(page_rows)

        total_rows = payload.get("num_rows_total")
        if isinstance(total_rows, int) and len(all_rows) >= total_rows:
            break
        if len(page_rows) < page_size:
            break

        offset += len(page_rows)
        if pause_ms > 0:
            sleep(pause_ms / 1000)

    return all_rows


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Fetch the full practice dataset snapshot from Hugging Face"
    )
    parser.add_argument("--dataset", default=DEFAULT_DATASET, help="Hugging Face dataset repo id")
    parser.add_argument("--config", default=DEFAULT_CONFIG, help="Dataset config name")
    parser.add_argument("--split", default=DEFAULT_SPLIT, help="Dataset split name")
    parser.add_argument("--page-size", type=int, default=100, help="Rows API page size")
    parser.add_argument("--timeout", type=float, default=30.0, help="HTTP timeout in seconds")
    parser.add_argument(
        "--pause-ms", type=int, default=150, help="Pause between page requests in milliseconds"
    )
    parser.add_argument(
        "--output-path", type=Path, default=DEFAULT_OUTPUT_PATH, help="Output JSON file path"
    )
    args = parser.parse_args()

    rows = fetch_all_rows(
        dataset=args.dataset,
        config=args.config,
        split=args.split,
        page_size=args.page_size,
        timeout=args.timeout,
        pause_ms=args.pause_ms,
    )

    args.output_path.parent.mkdir(parents=True, exist_ok=True)
    snapshot = {
        "dataset": args.dataset,
        "config": args.config,
        "split": args.split,
        "row_count": len(rows),
        "rows": rows,
    }
    with open(args.output_path, "w", encoding="utf-8") as file:
        json.dump(snapshot, file, ensure_ascii=False, indent=2)
        file.write("\n")

    safe_output_path = str(args.output_path).encode("ascii", "ignore").decode("ascii")
    print({"output_path": safe_output_path, "row_count": len(rows)})


if __name__ == "__main__":
    try:
        main()
    except requests.HTTPError as exc:
        print({"error": "http_error", "status_code": exc.response.status_code, "detail": str(exc)})
        sys.exit(1)
    except Exception as exc:  # noqa: BLE001
        print({"error": "fetch_failed", "detail": str(exc)})
        sys.exit(1)
