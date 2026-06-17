FROM python:3.11-slim AS runtime

ARG BACKEND_EXTRAS=""

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PATH="/home/app/.local/bin:${PATH}"

WORKDIR /app

RUN addgroup --system app && adduser --system --ingroup app app

COPY pyproject.toml README.md ./
COPY src ./src

RUN if [ -n "$BACKEND_EXTRAS" ]; then \
        pip install --no-cache-dir --no-compile ".[${BACKEND_EXTRAS}]"; \
    else \
        pip install --no-cache-dir --no-compile .; \
    fi

COPY data/practice/vi_grade_school_math_mcq_full.json ./data/practice/vi_grade_school_math_mcq_full.json
COPY data/practice/vi_grade_school_math_mcq_curated_manifest.json ./data/practice/vi_grade_school_math_mcq_curated_manifest.json

RUN mkdir -p /app/logs && chown -R app:app /app

USER app

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=3).read()" || exit 1

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
