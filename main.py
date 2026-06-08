"""
main.py — FastAPI wrapper for scraper.py (v1.2.0)

Endpoints:
  POST /api/scrape                Queue a batch of URLs under a tag
  GET  /api/queue                 Remaining item count in the queue

  GET  /api/tags                  List all tag folders in downloads/
  GET  /api/articles/{tag}        List .md files inside a tag folder
  GET  /api/articles/{tag}/{fn}   Return raw Markdown content
  PUT  /api/tags/{old}            Rename a tag folder
  DELETE /api/tags/{tag}          Delete a tag folder
  PUT  /api/articles/{tag}/{fn}   Rename an article file
  DELETE /api/articles/{tag}/{fn} Delete an article file

  GET  /api/logs                  Last 100 lines of app.log

  POST /api/rss                   Add an RSS feed to feeds.json
  GET  /api/rss                   List all RSS feeds
  DELETE /api/rss                 Remove an RSS feed by URL

  GET  /api/failed                List all failed scrape jobs
  DELETE /api/failed/{url}        Remove a failed job record
  POST /api/failed/retry          Retry failed jobs (honours 3-strike limit)

  GET  /api/search?q={query}      Full-text search across all .md files

  GET  /api/export/{tag}          Download a tag folder as a .zip archive

  POST /api/cookies               Save domain cookies (Netscape format)
  GET  /api/cookies               List stored cookie domains
  DELETE /api/cookies/{domain}    Remove a domain's cookies

Run locally:
  uvicorn main:app --reload --port 8603
"""

from __future__ import annotations

import asyncio
import io
import json
import logging
import os
import threading
import time
import zipfile
import tempfile
import shutil
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Annotated
from urllib.parse import quote, unquote

import feedparser
from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import FastAPI, HTTPException, Path as FPath, Query
from fastapi.responses import PlainTextResponse, FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, HttpUrl, field_validator

from scraper import (
    build_article,
    extract_article,
    fetch_html,
    save_markdown,
    slugify,
    validate_content,
    ScrapeFailedError,
)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
BASE = Path("downloads")
BASE.mkdir(parents=True, exist_ok=True)

FEEDS_FILE = BASE / "feeds.json"
FAILED_FILE = BASE / "failed.json"
COMPLETED_FILE = BASE / "completed.json"
COOKIES_FILE = BASE / "cookies.json"
FAVORITES_FILE = BASE / "favorites.json"
MAX_ATTEMPTS = 3  # URL is permanently failed after this many total attempts

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(BASE / "app.log", encoding="utf-8"),
    ],
)
log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Thread-safe JSON helpers
# ---------------------------------------------------------------------------

_json_lock = threading.Lock()


def _load_json(path: Path, default):
    """Load a JSON file safely; return default if missing or corrupt."""
    with _json_lock:
        if not path.is_file():
            return default
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, OSError):
            return default


def _save_json(path: Path, data) -> None:
    """Atomically write data to a JSON file."""
    with _json_lock:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)


# ---------------------------------------------------------------------------
# Queue
# ---------------------------------------------------------------------------

_queue: asyncio.Queue[tuple[str, str]] = asyncio.Queue()
_worker_task: asyncio.Task | None = None
_loop_ref: asyncio.AbstractEventLoop | None = None


def _record_failure(url: str, tag: str, reason: str) -> None:
    """Append / update a failure record in failed.json (3-strike logic)."""
    failed: dict = _load_json(FAILED_FILE, {})
    existing = failed.get(url, {})
    attempts = existing.get("attempts", 0) + 1
    failed[url] = {
        "url": url,
        "tag": tag,
        "reason": reason,
        "attempts": attempts,
        "status": "permanently_failed" if attempts >= MAX_ATTEMPTS else "failed",
        "last_failed": datetime.now(timezone.utc).isoformat(),
        "timestamp": time.time()
    }
    _save_json(FAILED_FILE, failed)
    if attempts >= MAX_ATTEMPTS:
        log.warning(
            "[failed] %s has failed %d times — marked permanently_failed.", url, attempts
        )

def _record_success(url: str, tag: str, filepath: str) -> None:
    """Append a success record in completed.json."""
    completed: list = _load_json(COMPLETED_FILE, [])
    completed.append({
        "url": url,
        "tag": tag,
        "filepath": filepath,
        "timestamp": time.time(),
        "date_str": datetime.now(timezone.utc).isoformat()
    })
    _save_json(COMPLETED_FILE, completed)


async def _worker() -> None:
    """
    Processes scraped URLs one at a time so we never hammer a target server.
    Runs for the entire lifespan of the application.
    """
    while True:
        url, tag = await _queue.get()
        log.info("[queue] Processing: %s  (tag=%s)", url, tag)
        try:
            loop = asyncio.get_running_loop()
            html, resolved_url = await loop.run_in_executor(None, fetch_html, url)
            title, content_html = extract_article(html)

            article = build_article(title, content_html, url, tag)
            validate_content(article, url)

            slug = slugify(title)
            filepath = save_markdown(tag, slug, article)
            log.info("[queue] Saved -> %s  (%d chars)", filepath, len(article))
            _record_success(url, tag, filepath)

        except ScrapeFailedError as exc:
            reason = str(exc)
            log.warning("[queue] Rejected %s: %s", url, reason)
            _record_failure(url, tag, reason)

        except Exception as exc:
            reason = f"{type(exc).__name__}: {exc}"
            log.error("[queue] Failed %s: %s", url, reason)
            _record_failure(url, tag, reason)

        finally:
            _queue.task_done()


# ---------------------------------------------------------------------------
# RSS background polling
# ---------------------------------------------------------------------------

def _poll_single_feed(feed_cfg: dict) -> int:
    feed_url = feed_cfg.get("url", "")
    tag = feed_cfg.get("tag", "rss")
    keywords: list[str] = [k.lower() for k in feed_cfg.get("keywords", [])]
    queued_count = 0

    try:
        parsed = feedparser.parse(feed_url)
        entries = parsed.get("entries", [])
        log.info("[rss] %s — %d entries", feed_url, len(entries))

        for entry in entries:
            # Combine title + summary for keyword matching
            text = (
                (entry.get("title") or "") + " " +
                (entry.get("summary") or "")
            ).lower()

            link = entry.get("link", "")
            if not link:
                continue

            # OR logic: any keyword triggers the scrape
            if not keywords or any(kw in text for kw in keywords):
                # Avoid double-queuing already-saved articles
                tag_folder = BASE / slugify(tag)
                
                # Check existing files to avoid duplicates (basic check based on slug)
                candidate_slug = slugify(entry.get("title", ""))
                is_duplicate = False
                if tag_folder.is_dir():
                    for f in tag_folder.glob("*.md"):
                        if candidate_slug in f.stem:
                            is_duplicate = True
                            break
                if is_duplicate:
                    continue

                # Add to asyncio queue from synchronous function
                try:
                    loop = asyncio.get_running_loop()
                    loop.call_soon_threadsafe(_queue.put_nowait, (link, slugify(tag)))
                except RuntimeError:
                    # If called from APScheduler, there is no running loop in this thread
                    asyncio.run_coroutine_threadsafe(
                        _queue.put((link, slugify(tag))), 
                        _loop_ref  # We need a reference to the main event loop
                    )
                except Exception as e:
                    # Fallback for manual triggering in fastapi async routes
                    _queue.put_nowait((link, slugify(tag)))
                
                queued_count += 1
                log.info("[rss] Queued: %s", link)

    except Exception as exc:
        log.error("[rss] Failed to parse %s: %s", feed_url, exc)
    
    return queued_count

def cleanup_old_rss_articles(feeds: list[dict]):
    """
    Deletes RSS articles (markdown files) in RSS tags that are older than 5 days.
    """
    rss_tags = {f.get("tag") for f in feeds if f.get("tag")}
    if not rss_tags:
        return

    now = time.time()
    
    settings = _load_json(BASE / "settings.json", {})
    retention_days = int(settings.get("rss_retention_days", 5))
    retention_seconds = retention_days * 24 * 3600
    cutoff_time = now - retention_seconds
    deleted_count = 0

    for tag in rss_tags:
        tag_dir = BASE / tag
        if not tag_dir.exists() or not tag_dir.is_dir():
            continue
        
        for md_file in tag_dir.glob("*.md"):
            try:
                # Check file modification time
                if md_file.stat().st_mtime < cutoff_time:
                    md_file.unlink()
                    deleted_count += 1
            except Exception as exc:
                log.error("[cleanup] Error deleting old RSS file %s: %s", md_file.name, exc)
    
    if deleted_count > 0:
        log.info("[cleanup] Deleted %d old RSS article(s) older than 5 days.", deleted_count)


def poll_rss_feeds():
    """
    Scheduled job: parse all RSS feeds in feeds.json, check entries
    against keyword lists (case-insensitive OR match), and push
    matching URLs into the scraping queue. Then cleans up old articles.
    """
    feeds: list[dict] = _load_json(FEEDS_FILE, [])
    if not feeds:
        return

    log.info("[rss] Polling %d feed(s)...", len(feeds))
    for feed_cfg in feeds:
        _poll_single_feed(feed_cfg)
        
    cleanup_old_rss_articles(feeds)



# ---------------------------------------------------------------------------
# Cleanup Job (10-day retention)
# ---------------------------------------------------------------------------

def _cleanup_jobs_logs():
    """Remove old jobs and truncate app.log."""
    settings = _load_json(BASE / "settings.json", {})
    retention_days = int(settings.get("log_retention_days", 10))
    retention_seconds = retention_days * 86400
    now = time.time()
    
    # 1. Clean failed.json
    failed = _load_json(FAILED_FILE, {})
    new_failed = {k: v for k, v in failed.items() if (now - v.get("timestamp", now)) <= ten_days}
    if len(new_failed) != len(failed):
        _save_json(FAILED_FILE, new_failed)
        
    # 2. Clean completed.json
    completed = _load_json(COMPLETED_FILE, [])
    new_completed = [v for v in completed if (now - v.get("timestamp", now)) <= ten_days]
    if len(new_completed) != len(completed):
        _save_json(COMPLETED_FILE, new_completed)
        
    # 3. Truncate app.log to last 1000 lines if > 5MB
    log_file = BASE / "app.log"
    if log_file.exists() and log_file.stat().st_size > 5 * 1024 * 1024:
        try:
            with open(log_file, "r", encoding="utf-8") as f:
                lines = f.readlines()
            if len(lines) > 1000:
                with open(log_file, "w", encoding="utf-8") as f:
                    f.writelines(lines[-1000:])
        except Exception as e:
            log.error("Failed to truncate app.log: %s", e)

# ---------------------------------------------------------------------------
# Lifespan — starts/stops background worker + scheduler cleanly
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):  # noqa: ARG001
    global _worker_task, _loop_ref

    # Capture the main event loop for cross-thread access (APScheduler)
    _loop_ref = asyncio.get_running_loop()

    # Start asyncio queue worker
    _worker_task = asyncio.create_task(_worker())
    log.info("[startup] Queue worker started.")

    # Load settings to get interval
    settings = _load_json(BASE / "settings.json", {})
    rss_interval = int(settings.get("rss_polling_interval", 2))

    # Start APScheduler for RSS polling
    scheduler = BackgroundScheduler()
    scheduler.add_job(poll_rss_feeds, "interval", hours=rss_interval, id="rss_poll")
    scheduler.add_job(_cleanup_jobs_logs, "interval", days=1, id="cleanup_jobs")
    scheduler.start()
    app.state.scheduler = scheduler
    log.info(f"[startup] RSS scheduler started (interval: {rss_interval}h). Cleanup scheduler started (interval: 1d).")

    yield

    # Shutdown
    _worker_task.cancel()
    try:
        await _worker_task
    except asyncio.CancelledError:
        pass
    scheduler.shutdown(wait=False)
    log.info("[shutdown] Queue worker and scheduler stopped.")


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="LocalScrape API",
    description="Async article-scraping queue backed by archive.md + readability.",
    version="2.1.0",
    lifespan=lifespan,
)


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class ScrapeRequest(BaseModel):
    urls: list[HttpUrl]
    tag: str = ""

    @field_validator("tag")
    @classmethod
    def validate_tag(cls, v: str) -> str:
        if not v.strip():
            return "_auto_"
        slug = slugify(v.strip())
        if not slug:
            raise ValueError("tag must not be empty after slugification.")
        return slug

    @field_validator("urls")
    @classmethod
    def validate_urls(cls, v: list[HttpUrl]) -> list[HttpUrl]:
        if not v:
            raise ValueError("urls list must not be empty.")
        return v

class SettingsPayload(BaseModel):
    gemini_api_key: str = ""
    auto_summarize: bool = False
    rss_polling_interval: int = 2
    rss_retention_days: int = 5
    log_retention_days: int = 10
    default_theme: str = "dark"
    typography: str = "sans-serif"
    base_font_size: int = 16
    tts_default_speed: float = 1.0
    tts_preferred_voice: str = ""
    global_cookies: str = ""


class ScrapeResponse(BaseModel):
    message: str
    queued: int
    tag: str


class QueueResponse(BaseModel):
    remaining: int


class TagsResponse(BaseModel):
    tags: list[str]


class ArticleItem(BaseModel):
    filename: str
    added_at: float


class ArticlesResponse(BaseModel):
    tag: str
    articles: list[ArticleItem]


class RenameRequest(BaseModel):
    new_name: str

    @field_validator("new_name")
    @classmethod
    def validate_new_name(cls, v: str) -> str:
        slug = slugify(v.strip())
        if not slug:
            raise ValueError("Name must not be empty after slugification.")
        return slug


class LogsResponse(BaseModel):
    logs: list[str]


class RssFeedRequest(BaseModel):
    url: HttpUrl
    tag: str
    keywords: list[str] = []

    @field_validator("tag")
    @classmethod
    def validate_tag(cls, v: str) -> str:
        slug = slugify(v.strip())
        if not slug:
            raise ValueError("tag must not be empty.")
        return slug


class RetryRequest(BaseModel):
    urls: list[str] = []  # empty = retry all eligible


class CookieRequest(BaseModel):
    domain: str
    cookies: str  # raw Netscape-format cookie string

    @field_validator("domain")
    @classmethod
    def validate_domain(cls, v: str) -> str:
        v = v.strip().lstrip(".")
        if not v:
            raise ValueError("domain must not be empty.")
        return v


class SearchResult(BaseModel):
    tag: str
    filename: str


# ---------------------------------------------------------------------------
# Security helpers
# ---------------------------------------------------------------------------

def _safe_child(parent: Path, *parts: str) -> Path:
    resolved = (parent / Path(*parts)).resolve()
    if not str(resolved).startswith(str(parent.resolve())):
        raise HTTPException(status_code=400, detail="Invalid path component.")
    return resolved


# ---------------------------------------------------------------------------
# Core endpoints (unchanged from v1.1.0)
# ---------------------------------------------------------------------------

@app.post("/api/scrape", response_model=ScrapeResponse, status_code=202)
async def enqueue_scrape(body: ScrapeRequest) -> ScrapeResponse:
    """Accept a batch of URLs and a tag, place them on the queue, return immediately."""
    url_strings = [str(u) for u in body.urls]
    
    completed = _load_json(COMPLETED_FILE, [])
    completed_urls = set(c.get("url") for c in completed)
    failed = _load_json(FAILED_FILE, {})
    
    filtered_urls = []
    for url in url_strings:
        if url in completed_urls:
            log.warning("[api] Duplicate URL blocked: %s", url)
            continue
        if url in failed and failed[url].get("status") == "permanently_failed":
            continue
        filtered_urls.append(url)
        
    if not filtered_urls and url_strings:
        raise HTTPException(status_code=409, detail="All submitted URLs have already been scraped or permanently failed.")

    for url in filtered_urls:
        await _queue.put((url, body.tag))
    log.info("[api] Queued %d URL(s) under tag '%s'.", len(filtered_urls), body.tag)
    return ScrapeResponse(
        message=f"Accepted. {len(filtered_urls)} URL(s) added to the queue.",
        queued=len(filtered_urls),
        tag=body.tag,
    )


@app.get("/api/queue", response_model=QueueResponse)
async def queue_status() -> QueueResponse:
    return QueueResponse(remaining=_queue.qsize())


# ---------------------------------------------------------------------------
# Read/Unread Tracker & Favorites
# ---------------------------------------------------------------------------

READ_STATE_FILE = BASE / "read_state.json"

class ReadStateRequest(BaseModel):
    path: str
    read: bool

@app.get("/api/read-state")
async def get_read_state():
    if not READ_STATE_FILE.exists():
        return {}
    try:
        with open(READ_STATE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}

@app.post("/api/read-state")
async def update_read_state(body: ReadStateRequest):
    state = {}
    if READ_STATE_FILE.exists():
        try:
            with open(READ_STATE_FILE, "r", encoding="utf-8") as f:
                state = json.load(f)
        except Exception:
            pass
    state[body.path] = body.read
    _save_json(READ_STATE_FILE, state)
    return {"status": "ok", "state": state}


class FavoriteRequest(BaseModel):
    path: str

@app.get("/api/favorites")
async def get_favorites():
    if not FAVORITES_FILE.exists():
        return {"favorites": []}
    try:
        with open(FAVORITES_FILE, "r", encoding="utf-8") as f:
            return {"favorites": json.load(f)}
    except:
        return {"favorites": []}

@app.post("/api/favorites")
async def add_favorite(body: FavoriteRequest):
    favs = []
    if FAVORITES_FILE.exists():
        try:
            with open(FAVORITES_FILE, "r", encoding="utf-8") as f:
                favs = json.load(f)
        except:
            pass
    if body.path not in favs:
        favs.append(body.path)
        with open(FAVORITES_FILE, "w", encoding="utf-8") as f:
            json.dump(favs, f)
    return {"status": "ok", "favorites": favs}

@app.delete("/api/favorites")
async def remove_favorite(body: FavoriteRequest):
    favs = []
    if FAVORITES_FILE.exists():
        try:
            with open(FAVORITES_FILE, "r", encoding="utf-8") as f:
                favs = json.load(f)
        except:
            pass
    if body.path in favs:
        favs.remove(body.path)
        with open(FAVORITES_FILE, "w", encoding="utf-8") as f:
            json.dump(favs, f)
    return {"status": "ok", "favorites": favs}


@app.get("/api/backup")
async def backup_data():
    """Zips the downloads/ directory and returns it as a file."""
    # Create temp zip
    tmp_dir = tempfile.gettempdir()
    zip_path = os.path.join(tmp_dir, f"localscrape_backup_{int(time.time())}")
    shutil.make_archive(zip_path, 'zip', BASE)
    zip_file = zip_path + ".zip"
    return FileResponse(
        path=zip_file,
        media_type="application/zip",
        filename=f"localscrape_backup_{datetime.now().strftime('%Y%m%d')}.zip"
    )


@app.get("/api/tags", response_model=TagsResponse)
async def list_tags() -> TagsResponse:
    if not BASE.is_dir():
        return TagsResponse(tags=[])
    tags = sorted(e.name for e in BASE.iterdir() if e.is_dir())
    return TagsResponse(tags=tags)

@app.get("/api/settings", response_model=SettingsPayload)
async def get_settings():
    settings = _load_json(BASE / "settings.json", {})
    if COOKIES_FILE.exists():
        with open(COOKIES_FILE, "r", encoding="utf-8") as f:
            settings["global_cookies"] = f.read()
    else:
        settings["global_cookies"] = ""
    return SettingsPayload(**settings)

@app.post("/api/settings")
async def update_settings(body: SettingsPayload):
    settings_dict = body.dict()
    _save_json(BASE / "settings.json", settings_dict)
    
    if body.global_cookies:
        with open(COOKIES_FILE, "w", encoding="utf-8") as w:
            w.write(body.global_cookies)
            
    try:
        from apscheduler.triggers.interval import IntervalTrigger
        if hasattr(app.state, "scheduler"):
            app.state.scheduler.reschedule_job("rss_poll", trigger=IntervalTrigger(hours=body.rss_polling_interval))
    except Exception as e:
        log.warning(f"Could not reschedule rss_poll: {e}")
        
    return {"status": "ok"}

class MegathreadRequest(BaseModel):
    files: list[str]
    tag: str
    title: str

@app.post("/api/megathread")
async def create_megathread(body: MegathreadRequest):
    if not body.files:
        raise HTTPException(status_code=400, detail="No files provided.")
    
    megathread_content = []
    megathread_content.append(f"---\ntitle: \"{body.title}\"\ntags:\n  - {body.tag}\n---\n\n# {body.title}\n\n")
    
    tag_folder = _safe_child(BASE, body.tag)
    tag_folder.mkdir(parents=True, exist_ok=True)
    
    for file_path in body.files:
        parts = file_path.split("/")
        if len(parts) != 2:
            continue
        t, f = parts
        src = _safe_child(BASE, t) / f
        if src.exists():
            with open(src, "r", encoding="utf-8") as r:
                content = r.read()
                import re
                content = re.sub(r'^---\n.*?\n---\n', '', content, flags=re.DOTALL)
                megathread_content.append(f"## From: {f.replace('.md', '')}\n\n{content}\n\n---\n")
                
    safe_title = slugify(body.title) or "megathread"
    out_file = tag_folder / f"{safe_title}.md"
    
    with open(out_file, "w", encoding="utf-8") as w:
        w.write("".join(megathread_content))
        
    for file_path in body.files:
        parts = file_path.split("/")
        if len(parts) == 2:
            t, f = parts
            src = _safe_child(BASE, t) / f
            if src.exists():
                src.unlink()
                
    return {"status": "ok", "megathread": f"{body.tag}/{safe_title}.md"}

@app.get("/api/analysis")
async def get_analysis():
    if not BASE.is_dir():
        return {"analysis": []}
        
    read_state = {}
    if READ_STATE_FILE.exists():
        try:
            with open(READ_STATE_FILE, "r", encoding="utf-8") as f:
                read_state = json.load(f)
        except Exception:
            pass
            
    analysis = []
    for tag_dir in BASE.iterdir():
        if tag_dir.is_dir() and tag_dir.name not in ["__pycache__", ".git"]:
            tag_name = tag_dir.name
            total_assets = 0
            total_read = 0
            total_size_bytes = 0
            total_read_time = 0
            
            for f in tag_dir.glob("*.md"):
                total_assets += 1
                total_size_bytes += f.stat().st_size
                
                path_key = f"{tag_name}/{f.name}"
                if read_state.get(path_key, False):
                    total_read += 1
                    
                try:
                    with open(f, "r", encoding="utf-8") as md_file:
                        content = md_file.read(1024)
                        import re
                        m = re.search(r'reading_time:\s*(\d+)', content)
                        if m:
                            total_read_time += int(m.group(1))
                except Exception:
                    pass
            
            analysis.append({
                "tag": tag_name,
                "total_assets": total_assets,
                "total_read": total_read,
                "total_pending": total_assets - total_read,
                "size_mb": round(total_size_bytes / (1024 * 1024), 2),
                "total_read_time": total_read_time
            })
            
    return {"analysis": analysis}



@app.get("/api/articles/{tag}", response_model=ArticlesResponse)
async def list_articles(
    tag: Annotated[str, FPath(description="Tag / category folder name")],
) -> ArticlesResponse:
    folder = _safe_child(BASE, tag)
    if not folder.is_dir():
        raise HTTPException(status_code=404, detail=f"Tag '{tag}' not found.")
    
    articles = []
    for f in folder.iterdir():
        if f.suffix == ".md":
            articles.append(ArticleItem(filename=f.name, added_at=f.stat().st_mtime))
            
    # Sort newest first
    articles.sort(key=lambda x: x.added_at, reverse=True)
    
    return ArticlesResponse(tag=tag, articles=articles)


@app.get("/api/articles/{tag}/{filename}", response_class=PlainTextResponse)
async def get_article(
    tag: Annotated[str, FPath(description="Tag / category folder name")],
    filename: Annotated[str, FPath(description="Filename (with or without .md)")],
) -> PlainTextResponse:
    if not filename.endswith(".md"):
        filename = filename + ".md"
    filepath = _safe_child(BASE, tag, filename)
    if not filepath.is_file():
        raise HTTPException(status_code=404, detail="Article not found.")
    return PlainTextResponse(
        filepath.read_text(encoding="utf-8"),
        media_type="text/markdown; charset=utf-8",
    )


@app.put("/api/tags/{old_tag}")
async def rename_tag(
    old_tag: Annotated[str, FPath(description="Old tag name")],
    body: RenameRequest,
):
    old_folder = _safe_child(BASE, old_tag)
    if not old_folder.is_dir():
        raise HTTPException(status_code=404, detail=f"Tag '{old_tag}' not found.")
    new_folder = _safe_child(BASE, body.new_name)
    if new_folder.exists():
        raise HTTPException(status_code=400, detail=f"Tag '{body.new_name}' already exists.")
    old_folder.rename(new_folder)
    return {"message": f"Tag renamed to {body.new_name}", "tag": body.new_name}


@app.delete("/api/tags/{tag}")
async def delete_tag(tag: Annotated[str, FPath(description="Tag folder name")]):
    import shutil
    folder = _safe_child(BASE, tag)
    if not folder.is_dir():
        raise HTTPException(status_code=404, detail=f"Tag '{tag}' not found.")
    shutil.rmtree(folder)
    return {"message": f"Tag '{tag}' deleted."}


@app.put("/api/articles/{tag}/{old_filename}")
async def rename_article(
    tag: Annotated[str, FPath(description="Tag folder name")],
    old_filename: Annotated[str, FPath(description="Old filename")],
    body: RenameRequest,
):
    if not old_filename.endswith(".md"):
        old_filename += ".md"
    old_path = _safe_child(BASE, tag, old_filename)
    if not old_path.is_file():
        raise HTTPException(status_code=404, detail="Article not found.")
    new_filename = body.new_name if body.new_name.endswith(".md") else body.new_name + ".md"
    new_path = _safe_child(BASE, tag, new_filename)
    if new_path.exists():
        raise HTTPException(status_code=400, detail=f"Article '{new_filename}' already exists.")
    old_path.rename(new_path)
    return {"message": f"Article renamed to {new_filename}", "filename": new_filename}


@app.delete("/api/articles/{tag}/{filename}")
async def delete_article(
    tag: Annotated[str, FPath(description="Tag folder name")],
    filename: Annotated[str, FPath(description="Filename")],
):
    if not filename.endswith(".md"):
        filename += ".md"
    filepath = _safe_child(BASE, tag, filename)
    if not filepath.is_file():
        raise HTTPException(status_code=404, detail="Article not found.")
    filepath.unlink()
    return {"message": f"Article '{filename}' deleted."}


@app.get("/api/logs", response_model=LogsResponse)
async def get_logs():
    log_file = BASE / "app.log"
    if not log_file.is_file():
        return LogsResponse(logs=[])
    try:
        with open(log_file, "r", encoding="utf-8") as f:
            lines = f.readlines()
        return LogsResponse(logs=lines[-100:])
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ---------------------------------------------------------------------------
# Feature 1 — RSS Feeder
# ---------------------------------------------------------------------------

@app.post("/api/rss", status_code=201)
async def add_rss_feed(body: RssFeedRequest):
    """Add an RSS feed to the polling list."""
    feeds: list[dict] = _load_json(FEEDS_FILE, [])
    url_str = str(body.url)

    # Prevent duplicates
    if any(f["url"] == url_str for f in feeds):
        raise HTTPException(status_code=409, detail="Feed already exists.")

    new_feed = {
        "url": url_str,
        "tag": body.tag,
        "keywords": body.keywords,
        "added": datetime.now(timezone.utc).isoformat(),
    }
    feeds.append(new_feed)
    _save_json(FEEDS_FILE, feeds)
    log.info("[rss] Added feed: %s (tag=%s, keywords=%s)", url_str, body.tag, body.keywords)
    return {"message": "Feed added.", "feed": new_feed}


@app.get("/api/rss")
async def list_rss_feeds():
    """List all registered RSS feeds."""
    return {"feeds": _load_json(FEEDS_FILE, [])}


@app.get("/api/system/stats")
def get_system_stats():
    """Returns total size of the downloads folder."""
    total_size = 0
    if os.path.exists(BASE):
        for dirpath, _, filenames in os.walk(BASE):
            for f in filenames:
                fp = os.path.join(dirpath, f)
                if not os.path.islink(fp):
                    total_size += os.path.getsize(fp)
    
    # Convert to human readable format
    if total_size < 1024:
        size_str = f"{total_size} B"
    elif total_size < 1024 * 1024:
        size_str = f"{total_size / 1024:.1f} KB"
    else:
        size_str = f"{total_size / (1024 * 1024):.1f} MB"
        
    return {"total_size_bytes": total_size, "total_size_human": size_str}

@app.delete("/api/rss")
async def delete_rss_feed(url: str = Query(..., description="Feed URL to remove")):
    feeds = _load_json(FEEDS_FILE, [])
    new_feeds = [f for f in feeds if f.get("url") != url]
    if len(feeds) == len(new_feeds):
        raise HTTPException(status_code=404, detail="Feed not found.")
    _save_json(FEEDS_FILE, new_feeds)
    return {"message": "Feed deleted."}

@app.post("/api/rss/fetch")
def fetch_rss_feed(url: str):
    """
    Manually trigger polling for a specific RSS feed.
    """
    feeds = _load_json(FEEDS_FILE, [])
    feed_cfg = next((f for f in feeds if f.get("url") == url), None)
    if not feed_cfg:
        raise HTTPException(status_code=404, detail="Feed not found.")
    
    queued = _poll_single_feed(feed_cfg)
    return {"message": f"Fetched feed. Queued {queued} new articles.", "queued": queued}


# ---------------------------------------------------------------------------
# Feature 2 — Failed Jobs Vault
# ---------------------------------------------------------------------------

@app.get("/api/activity")
async def list_activity():
    """List all failed and completed scrape jobs."""
    failed: dict = _load_json(FAILED_FILE, {})
    completed: list = _load_json(COMPLETED_FILE, [])
    return {
        "failed": list(failed.values()),
        "completed": completed
    }

@app.delete("/api/activity/failed")
async def delete_activity_failed(url: str):
    """Remove a single failed job record."""
    failed: dict = _load_json(FAILED_FILE, {})
    if url in failed:
        del failed[url]
        _save_json(FAILED_FILE, failed)
    return {"status": "deleted", "url": url}

@app.delete("/api/activity/completed")
async def delete_activity_completed(url: str):
    """Remove a single completed job log record."""
    completed: list = _load_json(COMPLETED_FILE, [])
    new_completed = [j for j in completed if j.get("url") != url]
    if len(new_completed) != len(completed):
        _save_json(COMPLETED_FILE, new_completed)
    return {"status": "deleted", "url": url}


@app.post("/api/failed/retry", status_code=202)
async def retry_failed(body: RetryRequest):
    """
    Retry failed scrape jobs. Respects 3-strike limit — permanently_failed
    URLs are skipped and listed in the advisory response.
    """
    failed: dict = _load_json(FAILED_FILE, {})

    # Determine target URLs
    if body.urls:
        targets = {u: failed[u] for u in body.urls if u in failed}
        not_found = [u for u in body.urls if u not in failed]
    else:
        targets = dict(failed)
        not_found = []

    queued = []
    skipped_permanent = []

    for url, record in targets.items():
        if record.get("status") == "permanently_failed":
            skipped_permanent.append(url)
            continue
        tag = record.get("tag", "retried")
        await _queue.put((url, tag))
        queued.append(url)
        # Remove from failed list (will be re-added if it fails again)
        del failed[url]

    _save_json(FAILED_FILE, failed)

    response: dict = {
        "message": f"Queued {len(queued)} URL(s) for retry.",
        "queued": queued,
    }
    if skipped_permanent:
        response["advisory"] = (
            f"{len(skipped_permanent)} URL(s) have failed {MAX_ATTEMPTS} times "
            f"and are marked permanently failed. Delete them manually to re-attempt."
        )
        response["permanently_failed"] = skipped_permanent
    if not_found:
        response["not_found"] = not_found

    log.info("[retry] Queued %d, skipped %d permanent.", len(queued), len(skipped_permanent))
    return response


# ---------------------------------------------------------------------------
# Feature 3 — Full-Text Search
# ---------------------------------------------------------------------------

def _search_files(query: str) -> list[dict]:
    """Scan all .md files under downloads/ for query string (case-insensitive)."""
    query_lower = query.lower()
    results = []
    if not BASE.is_dir():
        return results
    for tag_dir in BASE.iterdir():
        if not tag_dir.is_dir():
            continue
        for md_file in tag_dir.glob("*.md"):
            try:
                content = md_file.read_text(encoding="utf-8", errors="ignore")
                if query_lower in content.lower():
                    results.append({"tag": tag_dir.name, "filename": md_file.name})
            except OSError:
                continue
    return results


@app.get("/api/search")
async def search_articles(q: str = Query(..., min_length=2, description="Search query")):
    """Full-text search across all saved .md files."""
    loop = asyncio.get_running_loop()
    results = await loop.run_in_executor(None, _search_files, q)
    return {"query": q, "total": len(results), "results": results}


# ---------------------------------------------------------------------------
# Feature 4 — Bulk Archive Exporter
# ---------------------------------------------------------------------------

@app.get("/api/export/{tag}")
async def export_tag(tag: Annotated[str, FPath(description="Tag folder name")]):
    """Download all articles in a tag as a .zip archive (in-memory)."""
    folder = _safe_child(BASE, tag)
    if not folder.is_dir():
        raise HTTPException(status_code=404, detail=f"Tag '{tag}' not found.")

    def _build_zip() -> io.BytesIO:
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
            for md_file in sorted(folder.glob("*.md")):
                zf.write(md_file, arcname=md_file.name)
        buf.seek(0)
        return buf

    loop = asyncio.get_running_loop()
    zip_buf = await loop.run_in_executor(None, _build_zip)

    filename = f"{tag}.zip"
    return StreamingResponse(
        zip_buf,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ---------------------------------------------------------------------------
# Feature 5 — Cookie Injector
# ---------------------------------------------------------------------------

@app.post("/api/cookies", status_code=201)
async def save_cookies(body: CookieRequest):
    """Save Netscape-format cookies for a domain."""
    cookies: dict = _load_json(COOKIES_FILE, {})
    cookies[body.domain] = body.cookies
    _save_json(COOKIES_FILE, cookies)
    log.info("[cookies] Saved cookies for domain: %s", body.domain)
    return {"message": f"Cookies saved for '{body.domain}'.", "domain": body.domain}


@app.get("/api/cookies")
async def list_cookies():
    """List all domains that have stored cookies (values not returned)."""
    cookies: dict = _load_json(COOKIES_FILE, {})
    return {
        "domains": list(cookies.keys()),
        "total": len(cookies),
    }


@app.delete("/api/cookies/{domain}")
async def delete_cookies(domain: str):
    """Remove stored cookies for a domain."""
    cookies: dict = _load_json(COOKIES_FILE, {})
    if domain not in cookies:
        raise HTTPException(status_code=404, detail=f"No cookies stored for '{domain}'.")
    del cookies[domain]
    _save_json(COOKIES_FILE, cookies)
    log.info("[cookies] Deleted cookies for domain: %s", domain)
    return {"message": f"Cookies for '{domain}' deleted."}


# ---------------------------------------------------------------------------
# Static Files & Frontend
# ---------------------------------------------------------------------------

app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
async def serve_frontend():
    return FileResponse("static/index.html")
