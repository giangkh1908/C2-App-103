.PHONY: run test lint format typecheck check clean install dev

# ──────────────────────────────────────────────
# Install
# ──────────────────────────────────────────────

install: ## Cài dependencies (production)
	pip install -e .

dev: ## Cài dependencies (development)
	pip install -e ".[dev]"

# ──────────────────────────────────────────────
# Run
# ──────────────────────────────────────────────

run: ## Chạy FastAPI server (development, auto-reload)
	uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8000

# ──────────────────────────────────────────────
# Code quality
# ──────────────────────────────────────────────

lint: ## Chạy linter (ruff check)
	ruff check src/ tests/

format: ## Format code (ruff format)
	ruff format src/ tests/

typecheck: ## Chạy type checker (mypy)
	mypy src/

# ──────────────────────────────────────────────
# Test
# ──────────────────────────────────────────────

test: ## Chạy tất cả tests
	pytest tests/ -v

test-unit: ## Chạy unit tests
	pytest tests/unit/ -v

test-integration: ## Chạy integration tests
	pytest tests/integration/ -v

test-cov: ## Chạy tests với coverage
	pytest tests/ -v --cov=src --cov-report=term-missing

# ──────────────────────────────────────────────
# Check (chạy tất cả)
# ──────────────────────────────────────────────

check: lint format typecheck test ## Chạy tất cả checks (lint + format + typecheck + test)

# ──────────────────────────────────────────────
# Docker
# ──────────────────────────────────────────────

docker-build: ## Build Docker image
	docker-compose build

docker-up: ## Chạy với docker-compose
	docker-compose up --build

docker-down: ## Dừng docker-compose
	docker-compose down

# ──────────────────────────────────────────────
# Utility
# ──────────────────────────────────────────────

clean: ## Xóa cache và build artifacts
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type d -name .pytest_cache -exec rm -rf {} +
	find . -type d -name .mypy_cache -exec rm -rf {} +
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	rm -rf dist/ build/ .coverage htmlcov/

help: ## Hiển thị danh sách lệnh
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
