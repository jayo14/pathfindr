# ── Stage 1: builder ─────────────────────────────────────────────────────
FROM python:3.12-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# System deps only needed at build time
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies into a dedicated prefix so we can copy them cleanly
COPY requirements.txt .
RUN pip install --prefix=/install --no-cache-dir -r requirements.txt


# ── Stage 2: runtime ─────────────────────────────────────────────────────
FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    # Default values; override at deploy time via env vars / secrets
    DJANGO_SETTINGS_MODULE=app.settings \
    PORT=8000

# Runtime system lib (libpq for psycopg2 at runtime)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 curl \
    && rm -rf /var/lib/apt/lists/*

# Copy installed packages from builder
COPY --from=builder /install /usr/local

WORKDIR /app

# Create a non-root user for better security
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

COPY --chown=appuser:appgroup . .

# Collect static files (silently ignores when STATIC_ROOT is not set)
RUN python manage.py collectstatic --noinput 2>/dev/null || true

USER appuser

EXPOSE ${PORT}

# Health check: hit Django's runserver/gunicorn on /, expect a 200/301/302/404
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD curl -f http://localhost:${PORT}/api/campus/ -o /dev/null -s -w '%{http_code}' \
        | grep -qE '^(200|301|302|404)$' || exit 1

# Use gunicorn in production. Workers = 2 × CPU + 1 (sensible default).
CMD ["sh", "-c", "gunicorn app.wsgi:application --bind 0.0.0.0:${PORT} --workers ${GUNICORN_WORKERS:-3} --timeout ${GUNICORN_TIMEOUT:-120} --access-logfile - --error-logfile -"]
