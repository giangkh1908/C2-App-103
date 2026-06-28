#!/usr/bin/env python3
import argparse
import os
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.core.config import settings  # noqa: E402

DEFAULT_ACCEPTANCE_DB_NAME = os.getenv(
    "PRACTICE_ACCEPTANCE_MONGODB_DB_NAME", "toan_truc_quan_practice_acceptance"
)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Run backend against a dedicated /practice acceptance database"
    )
    parser.add_argument(
        "--mongodb-uri", default=settings.mongodb_uri, help="MongoDB URI for the acceptance backend"
    )
    parser.add_argument(
        "--mongodb-db-name",
        default=DEFAULT_ACCEPTANCE_DB_NAME,
        help="Acceptance MongoDB database name",
    )
    parser.add_argument(
        "--frontend-url", default=settings.frontend_url, help="Frontend URL allowed by CORS"
    )
    parser.add_argument("--host", default=settings.api_host, help="Backend host")
    parser.add_argument("--port", default=str(settings.api_port), help="Backend port")
    parser.add_argument("--reload", action="store_true", help="Run uvicorn with --reload")
    args = parser.parse_args()

    env = os.environ.copy()
    env["MONGODB_URI"] = args.mongodb_uri
    env["MONGODB_DB_NAME"] = args.mongodb_db_name
    env["FRONTEND_URL"] = args.frontend_url

    command = ["uvicorn", "src.main:app", "--host", args.host, "--port", str(args.port)]
    if args.reload:
        command.append("--reload")

    result = subprocess.run(command, cwd=Path(__file__).resolve().parents[1], env=env)
    return result.returncode


if __name__ == "__main__":
    raise SystemExit(main())
