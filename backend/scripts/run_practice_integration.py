#!/usr/bin/env python3
import argparse
import os
import socket
import subprocess
import sys
import time
from pathlib import Path


DEFAULT_MONGODB_URI = "mongodb://127.0.0.1:27018"
DEFAULT_MONGODB_DB_NAME = "toan_truc_quan_practice_test"
DEFAULT_CONTAINER_NAME = "c2-practice-test-mongo"
DEFAULT_MONGO_IMAGE = "mongo:7"


def wait_for_mongo(uri: str, timeout_seconds: int) -> None:
    host_port = uri.rsplit("://", maxsplit=1)[-1].split("/", maxsplit=1)[0]
    host, port_text = host_port.split(":", maxsplit=1)
    port = int(port_text)
    deadline = time.time() + timeout_seconds
    last_error: Exception | None = None

    while time.time() < deadline:
        try:
            with socket.create_connection((host, port), timeout=2):
                return
        except OSError as exc:
            last_error = exc
            time.sleep(1)
            continue

    raise RuntimeError(f"Mongo test container was not ready in time: {last_error}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Run /practice integration tests against a disposable Mongo container")
    parser.add_argument("--keep-up", action="store_true", help="Keep the Mongo test container running after tests")
    parser.add_argument(
        "--timeout-seconds",
        type=int,
        default=60,
        help="How long to wait for Mongo test to become ready",
    )
    args = parser.parse_args()

    backend_dir = Path(__file__).resolve().parents[1]
    env = os.environ.copy()
    env.setdefault("PRACTICE_TEST_MONGODB_URI", DEFAULT_MONGODB_URI)
    env.setdefault("PRACTICE_TEST_MONGODB_DB_NAME", DEFAULT_MONGODB_DB_NAME)

    cleanup_cmd = ["docker", "rm", "-f", DEFAULT_CONTAINER_NAME]
    run_cmd = [
        "docker",
        "run",
        "-d",
        "--name",
        DEFAULT_CONTAINER_NAME,
        "-p",
        "27018:27017",
        DEFAULT_MONGO_IMAGE,
    ]
    test_cmd = ["pytest", "tests/integration/test_practice_api.py", "-q"]

    subprocess.run(cleanup_cmd, cwd=backend_dir, env=env, check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    subprocess.run(run_cmd, cwd=backend_dir, env=env, check=True)
    wait_for_mongo(env["PRACTICE_TEST_MONGODB_URI"], args.timeout_seconds)

    try:
        result = subprocess.run(test_cmd, cwd=backend_dir, env=env)
        return result.returncode
    finally:
        if not args.keep_up:
            subprocess.run(cleanup_cmd, cwd=backend_dir, env=env, check=False)


if __name__ == "__main__":
    sys.exit(main())
