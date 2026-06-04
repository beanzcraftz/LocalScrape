# ──────────────────────────────────────────────────────────────────────────────
# Dockerfile — LocalScrape API (v1.1.0)
#
# Based on python:3.12-slim with Playwright/Chromium for headless fallback.
# The image is larger than v1.0.x due to the Chromium binary (~650MB total).
# ──────────────────────────────────────────────────────────────────────────────

FROM python:3.12-slim

# ── System hardening ──────────────────────────────────────────────────────────
# Run as a non-root user for security.
RUN groupadd --gid 1001 appgroup \
 && useradd  --uid 1001 --gid appgroup --no-create-home appuser

# ── Chromium system dependencies ──────────────────────────────────────────────
# These are required by Playwright's bundled Chromium binary.
# Installed and cleaned in a single layer to keep the image lean.
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
        libnss3 \
        libnspr4 \
        libatk1.0-0 \
        libatk-bridge2.0-0 \
        libcups2 \
        libdrm2 \
        libxkbcommon0 \
        libxcomposite1 \
        libxdamage1 \
        libxrandr2 \
        libgbm1 \
        libpango-1.0-0 \
        libasound2 \
        libxshmfence1 \
        libx11-xcb1 \
        libxcb1 \
        libxext6 \
        libxfixes3 \
        libx11-6 \
        libdbus-1-3 \
        libatspi2.0-0 \
        libcairo2 \
 && rm -rf /var/lib/apt/lists/*

# ── Working directory ─────────────────────────────────────────────────────────
WORKDIR /app

# ── Dependencies (own layer — cached unless requirements.txt changes) ─────────
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ── Install Playwright Chromium browser ───────────────────────────────────────
# Must run as root before switching to appuser.
RUN playwright install chromium

# ── Application source ────────────────────────────────────────────────────────
COPY scraper.py main.py ./
COPY static/ static/

# ── Persistent data directory ─────────────────────────────────────────────────
# Created here so the volume mount doesn't reset ownership at runtime.
RUN mkdir -p /app/downloads && chown -R appuser:appgroup /app

# ── Switch to non-root user ───────────────────────────────────────────────────
USER appuser

# ── Port ──────────────────────────────────────────────────────────────────────
EXPOSE 8000

# ── Entrypoint ────────────────────────────────────────────────────────────────
# --workers 1  → single process; the asyncio queue lives in one process.
# --timeout-keep-alive 75 → a little above the typical 60 s ALB idle timeout.
CMD ["uvicorn", "main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--workers", "1", \
     "--timeout-keep-alive", "75"]
