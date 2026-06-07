#!/usr/bin/env python3
"""
scraper.py — Clean article scraper (v1.1.0 beta)

Features:
    - Multi-strategy fetch: archive.md → AMP → direct → Playwright
    - Referer spoofing on all requests
    - Heuristic failure detection (stub/paywall content)
    - YAML front-matter with word count & reading time
    - Clean Markdown output via readability-lxml + BeautifulSoup4

Usage:
    python scraper.py <url> <tag>

Example:
    python scraper.py https://example.com/article tech
"""

import sys
import os
import re
import time
import random
import argparse
import unicodedata
import urllib.parse
from datetime import datetime, timezone

import requests
from bs4 import BeautifulSoup
from readability import Document


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

BASE_DIR = "downloads"

ARCHIVE_URL = "https://archive.md/newest/{url}"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

REFERERS = [
    "https://www.google.com/",
    "https://www.google.com/search?q=",
    "https://news.google.com/",
    "https://t.co/",
    "https://x.com/",
    "https://www.facebook.com/",
    "https://www.reddit.com/",
    "https://www.bing.com/search?q=",
    "https://duckduckgo.com/?q=",
]

# Phrases that indicate a failed / paywalled scrape
FAILURE_PHRASES = [
    "subscribe to continue",
    "access denied",
    "checking your browser",
    "enable javascript",
    "you have been blocked",
    "please verify you are a human",
    "please turn javascript on",
    "this content is for subscribers",
    "create a free account",
    "sign in to read",
]

MIN_CONTENT_LENGTH = 400  # characters — below this we consider it a stub
WORDS_PER_MINUTE = 200    # average adult reading speed

REQUEST_TIMEOUT = 15  # seconds


# ---------------------------------------------------------------------------
# Exceptions
# ---------------------------------------------------------------------------

class ScrapeFailedError(Exception):
    """Raised when heuristic checks detect unusable content."""
    pass


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def slugify(text: str) -> str:
    """Convert arbitrary text to a safe, lowercase filename slug."""
    text = unicodedata.normalize("NFKD", text)
    text = text.encode("ascii", "ignore").decode("ascii")
    text = text.lower()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text).strip("-")
    text = re.sub(r"-{2,}", "-", text)
    return text or "untitled"


def clean_url(url: str) -> str:
    """Extract original URL from paywall redirects (e.g. News Corp 'dest=' parameter)."""
    parsed = urllib.parse.urlparse(url)
    qs = urllib.parse.parse_qs(parsed.query)

    if 'dest' in qs:
        cleaned = qs['dest'][0]
        print(f"[*] Extracted original URL from redirect: {cleaned}")
        return cleaned

    return url


def _get_spoofed_headers() -> dict:
    """Return a copy of HEADERS with a randomised Referer."""
    h = HEADERS.copy()
    h["Referer"] = random.choice(REFERERS)
    return h


def load_cookies_for_url(url: str) -> dict:
    """
    Read downloads/cookies.json and return a {name: value} dict of cookies
    matching the given URL's domain. Returns empty dict if none found.
    """
    import json
    cookies_file = os.path.join(BASE_DIR, "cookies.json")
    if not os.path.exists(cookies_file):
        return {}
    try:
        with open(cookies_file, "r", encoding="utf-8") as f:
            all_cookies: dict = json.load(f)
    except (json.JSONDecodeError, OSError):
        return {}

    parsed = urllib.parse.urlparse(url)
    hostname = parsed.hostname or ""

    result = {}
    for domain, cookie_str in all_cookies.items():
        # Match if the domain is a suffix of the URL hostname
        if hostname.endswith(domain.lstrip(".")):
            # Parse Netscape cookie format: name\tvalue lines (or simple key=value)
            for line in cookie_str.splitlines():
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                parts = line.split("\t")
                if len(parts) >= 7:
                    # Netscape format: domain, flag, path, secure, expiry, name, value
                    result[parts[5]] = parts[6]
                elif "=" in line:
                    # Simple key=value format
                    name, _, value = line.partition("=")
                    result[name.strip()] = value.strip()
    return result


# ---------------------------------------------------------------------------
# Fetching strategies
# ---------------------------------------------------------------------------

def fetch_html(url: str) -> tuple[str, str]:
    """
    Try multiple strategies to retrieve article HTML:
        1. archive.md cached version
        2. AMP version (?amp)
        3. Direct fetch
        4. Playwright headless browser (final fallback)

    Returns (html_content, resolved_url).
    """
    url = clean_url(url)
    archive_url = ARCHIVE_URL.format(url=url)

    # --- attempt 1: archive.md ---
    try:
        print(f"[*] Trying archive.md: {archive_url}")
        resp = requests.get(
            archive_url,
            headers=_get_spoofed_headers(),
            timeout=REQUEST_TIMEOUT,
            allow_redirects=True,
        )
        if resp.status_code == 200 and len(resp.text) > 500:
            print(f"[+] archive.md returned content ({len(resp.text):,} bytes)")
            return resp.text, resp.url
        else:
            print(f"[-] archive.md responded with status {resp.status_code} — falling back.")
    except requests.RequestException as exc:
        print(f"[-] archive.md request failed: {exc} — falling back.")

    time.sleep(1)

    # --- attempt 2: AMP fetch (paywall bypass) ---
    amp_url = url + ("&amp" if "?" in url else "?amp")
    try:
        print(f"[*] Trying AMP URL: {amp_url}")
        resp = requests.get(
            amp_url,
            headers=_get_spoofed_headers(),
            timeout=REQUEST_TIMEOUT,
            allow_redirects=True,
        )
        if resp.status_code == 200 and len(resp.text) > 500:
            print(f"[+] AMP fetch OK ({len(resp.text):,} bytes)")
            return resp.text, resp.url
        else:
            print(f"[-] AMP fetch responded with status {resp.status_code} — falling back.")
    except requests.RequestException as exc:
        print(f"[-] AMP fetch failed: {exc}")

    time.sleep(1)

    # --- attempt 3: direct fetch with cookie injection ---
    try:
        print(f"[*] Fetching directly: {url}")
        session = requests.Session()
        session.headers.update(_get_spoofed_headers())
        # Inject any stored cookies for this domain
        site_cookies = load_cookies_for_url(url)
        if site_cookies:
            print(f"[*] Injecting {len(site_cookies)} cookie(s) for direct fetch")
            session.cookies.update(site_cookies)
        resp = session.get(url, timeout=REQUEST_TIMEOUT, allow_redirects=True)
        resp.raise_for_status()
        print(f"[+] Direct fetch OK ({len(resp.text):,} bytes)")
        return resp.text, resp.url
    except requests.RequestException as exc:
        print(f"[-] Direct fetch failed: {exc} — trying Playwright.")

    time.sleep(1)

    # --- attempt 4: Playwright headless browser ---
    try:
        html = fetch_with_playwright(url)
        return html, url
    except Exception as exc:
        print(f"[-] Playwright fallback also failed: {exc}")
        raise ScrapeFailedError(
            f"All fetch strategies exhausted for {url}"
        ) from exc


def fetch_with_playwright(url: str) -> str:
    """
    Launch headless Chromium via Playwright, block images/fonts/media
    for speed, and return the fully-rendered DOM HTML.
    """
    from playwright.sync_api import sync_playwright

    print(f"[*] Trying Playwright (headless Chromium): {url}")

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1920, "height": 1080},
            user_agent=HEADERS["User-Agent"],
            extra_http_headers={
                "Referer": random.choice(REFERERS),
                "Accept-Language": "en-US,en;q=0.9",
            },
        )
        # Inject stored cookies into the Playwright context
        site_cookies = load_cookies_for_url(url)
        if site_cookies:
            parsed = urllib.parse.urlparse(url)
            pw_cookies = [
                {"name": k, "value": v, "domain": parsed.hostname, "path": "/"}
                for k, v in site_cookies.items()
            ]
            print(f"[*] Injecting {len(pw_cookies)} cookie(s) into Playwright context")
            context.add_cookies(pw_cookies)
        page = context.new_page()

        # Block heavy resources to speed things up
        def _block_resources(route, request):
            if request.resource_type in ("image", "font", "media", "stylesheet"):
                route.abort()
            else:
                route.continue_()

        page.route("**/*", _block_resources)

        page.goto(url, wait_until="networkidle", timeout=30000)

        # Give JS-rendered content a moment to settle
        page.wait_for_timeout(2000)

        html = page.content()
        browser.close()

    print(f"[+] Playwright returned content ({len(html):,} bytes)")
    return html


# ---------------------------------------------------------------------------
# Extraction
# ---------------------------------------------------------------------------

def extract_article(html: str) -> tuple[str, str]:
    """
    Use readability-lxml to isolate the main article body.
    Returns (title, cleaned_html).
    """
    doc = Document(html)
    title = doc.title() or "Untitled"
    content_html = doc.summary(html_partial=True)
    return title, content_html


def html_to_markdown(title: str, content_html: str) -> str:
    """
    Convert the readability-extracted HTML to clean Markdown.
    Handles: headings, paragraphs, ordered/unordered lists, bold, italic, links.
    """
    soup = BeautifulSoup(content_html, "html.parser")

    lines: list[str] = [f"# {title}", ""]

    def process_node(node, list_type=None, list_index=None):
        if isinstance(node, str):
            text = node.strip()
            if text:
                return text
            return ""

        tag = node.name if node.name else ""

        # --- inline elements ---
        if tag in ("strong", "b"):
            inner = "".join(process_node(c) for c in node.children).strip()
            return f"**{inner}**" if inner else ""

        if tag in ("em", "i"):
            inner = "".join(process_node(c) for c in node.children).strip()
            return f"*{inner}*" if inner else ""

        if tag == "a":
            href = node.get("href", "").strip()
            inner = "".join(process_node(c) for c in node.children).strip()
            if href and inner:
                return f"[{inner}]({href})"
            return inner

        if tag in ("code",):
            return f"`{''.join(process_node(c) for c in node.children).strip()}`"

        if tag == "br":
            return "\n"

        # --- block elements ---
        if tag in ("h1", "h2", "h3", "h4", "h5", "h6"):
            level = int(tag[1])
            inner = "".join(process_node(c) for c in node.children).strip()
            if inner:
                lines.append(f"{'#' * level} {inner}")
                lines.append("")
            return ""

        if tag == "p":
            inner = "".join(process_node(c) for c in node.children).strip()
            if inner:
                lines.append(inner)
                lines.append("")
            return ""

        if tag == "blockquote":
            inner = "".join(process_node(c) for c in node.children).strip()
            for bq_line in inner.splitlines():
                lines.append(f"> {bq_line}")
            lines.append("")
            return ""

        if tag == "pre":
            code_text = node.get_text()
            lines.append(f"```\n{code_text}\n```")
            lines.append("")
            return ""

        if tag in ("ul", "ol"):
            for i, child in enumerate(node.find_all("li", recursive=False), start=1):
                bullet = "-" if tag == "ul" else f"{i}."
                inner = "".join(process_node(c) for c in child.children).strip()
                # flatten nested newlines inside list items
                inner = re.sub(r"\n+", " ", inner)
                lines.append(f"{bullet} {inner}")
            lines.append("")
            return ""

        if tag == "hr":
            lines.append("---")
            lines.append("")
            return ""

        # generic container — recurse
        return "".join(process_node(c) for c in node.children)

    for child in soup.children:
        process_node(child)

    # clean up excessive blank lines
    markdown = "\n".join(lines)
    markdown = re.sub(r"\n{3,}", "\n\n", markdown).strip()
    return markdown


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------

def validate_content(text: str, url: str) -> None:
    """
    Heuristic check: raise ScrapeFailedError if the extracted content
    looks like a stub, paywall page, or bot-detection challenge.
    """
    stripped = text.strip()

    # Check minimum length
    if len(stripped) < MIN_CONTENT_LENGTH:
        raise ScrapeFailedError(
            f"Content too short ({len(stripped)} chars, minimum {MIN_CONTENT_LENGTH}): {url}"
        )

    # Check for paywall / bot-detection phrases
    lower = stripped.lower()
    for phrase in FAILURE_PHRASES:
        if phrase in lower:
            raise ScrapeFailedError(
                f"Detected failure phrase '{phrase}' in content from: {url}"
            )


# ---------------------------------------------------------------------------
# Metrics & Front-matter
# ---------------------------------------------------------------------------

def calculate_metrics(text: str) -> tuple[int, str]:
    """
    Calculate word count and estimated reading time.
    Returns (word_count, reading_time_string).
    """
    words = text.split()
    word_count = len(words)
    minutes = max(1, round(word_count / WORDS_PER_MINUTE))
    return word_count, f"{minutes} min"


def build_front_matter(
    title: str,
    source_url: str,
    tag: str,
    word_count: int,
    reading_time: str,
) -> str:
    """Build a YAML front-matter block string."""
    # Escape quotes in title for valid YAML
    safe_title = title.replace('"', '\\"')
    now = datetime.now(timezone.utc).astimezone().isoformat()

    return (
        f"---\n"
        f'title: "{safe_title}"\n'
        f'source: "{source_url}"\n'
        f'date_scraped: "{now}"\n'
        f"tags:\n"
        f"  - {tag}\n"
        f"word_count: {word_count}\n"
        f'reading_time: "{reading_time}"\n'
        f"---\n\n"
    )


def build_article(
    title: str,
    content_html: str,
    source_url: str,
    tag: str,
) -> str:
    """
    Full pipeline: convert HTML to Markdown, calculate metrics,
    prepend YAML front-matter, and return the complete article string.
    """
    markdown_body = html_to_markdown(title, content_html)
    word_count, reading_time = calculate_metrics(markdown_body)
    front_matter = build_front_matter(title, source_url, tag, word_count, reading_time)
    return front_matter + markdown_body


# ---------------------------------------------------------------------------
# I/O
# ---------------------------------------------------------------------------

def save_markdown(tag: str, filename_slug: str, content: str) -> str:
    """Save content to downloads/<tag>/<slug>.md and return the final path."""
    folder = os.path.join(BASE_DIR, tag)
    os.makedirs(folder, exist_ok=True)

    filepath = os.path.join(folder, f"{filename_slug}.md")

    # avoid silently overwriting — append a counter if the file exists
    if os.path.exists(filepath):
        counter = 1
        while os.path.exists(filepath):
            filepath = os.path.join(folder, f"{filename_slug}-{counter}.md")
            counter += 1

    with open(filepath, "w", encoding="utf-8") as fh:
        fh.write(content)

    return filepath


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Scrape an article and save it as clean Markdown.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument("url", help="Target article URL")
    parser.add_argument("tag", help="Tag / category (used as subfolder name)")
    return parser.parse_args()


def extract_auto_tag(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    # try keywords meta
    meta_kw = soup.find("meta", attrs={"name": "keywords"})
    if meta_kw and meta_kw.get("content"):
        kw = meta_kw.get("content").split(",")[0].strip()
        slug = slugify(kw)
        if slug: return slug
    # try property article:tag
    meta_tag = soup.find("meta", property="article:tag")
    if meta_tag and meta_tag.get("content"):
        slug = slugify(meta_tag.get("content").strip())
        if slug: return slug
    return "uncategorized"

def main() -> None:
    args = parse_args()
    url: str = args.url.strip()
    tag: str = slugify(args.tag.strip()) if args.tag.strip() != "_auto_" else "_auto_"

    if not url.startswith(("http://", "https://")):
        print("[!] URL must start with http:// or https://")
        sys.exit(1)

    # 1. Fetch
    html, resolved_url = fetch_html(url)
    
    if tag == "_auto_":
        tag = extract_auto_tag(html)

    # 2. Extract
    title, content_html = extract_article(html)
    print(f"[+] Title: {title}")

    # 3. Build article with front-matter
    article = build_article(title, content_html, url, tag)

    # 4. Validate
    validate_content(article, url)

    # 5. Save
    slug = slugify(title)
    filepath = save_markdown(tag, slug, article)

    word_count, reading_time = calculate_metrics(article)
    print(f"[+] Saved -> {filepath}")
    print(f"    {len(article):,} chars | {word_count} words | {reading_time} read | tag: {tag}")


if __name__ == "__main__":
    main()
