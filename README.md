# 🚀 LocalScrape

![Version](https://img.shields.io/badge/version-v1.3.3-blue)
![Docker](https://img.shields.io/badge/docker-ready-2496ED?logo=docker&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-2EAD33?logo=playwright&logoColor=white)

LocalScrape is a self-hosted, offline-first bookmarking and article-reading web app. It allows you to scrape articles from the web, convert them into clean, distraction-free Markdown, and read them in a private local environment. 

Designed with simplicity and privacy in mind, LocalScrape operates entirely **without a database**, relying purely on flat files and JSON for persistence.

---

## 🏗️ Tech Stack & Architecture

* **Frontend:** Pure Vanilla HTML, CSS (with CSS variables for theming), and JavaScript. Built as a Single Page Application (SPA) without the overhead of heavy frameworks like React or Vue.
* **Backend:** Python powered by FastAPI.
* **Scraping Engine:** Playwright (Chromium) for rendering JavaScript-heavy pages, extracting article content using Readability, and saving it locally.
* **Task Scheduling:** APScheduler manages background loops for RSS polling safely.

---

## ✨ Features

- **Distraction-Free Reader Mode:** Clean readability view with customizable text sizing, light/dark modes, and a modern layout.
- **Robust 4-Stage Scraping Pipeline:**
  1. Checks for cached versions on `archive.md`.
  2. Extracts content from Accelerated Mobile Pages (AMP) versions via `?amp`.
  3. Uses a direct scraper with spoofed headers (e.g. Googlebot, Twitterbot referers) to bypass soft paywalls.
  4. Falls back to headless Playwright (Chromium) to execute complex JavaScript-heavy articles.
- **Sequential Scraping Queue:** Uses an `asyncio.Queue` system to process pages in order, avoiding rate limits.
- **Automated RSS Feed Reader:** 
  - Automatically polls your feeds every 2 hours.
  - Supports keyword filtering (only download articles containing specific topics).
  - Manual "Fetch Now" override button.
  - Automated cleanup job deletes scraped RSS articles older than **5 days** to keep your storage lean.
- **Library Management:** Organizes articles with Tags, lets you Rename/Delete files directly, and offers a one-click ZIP exporter for entire Tags.
- **Failed Jobs Vault:** Keep track of scraping errors with an interactive retry and dismissal queue (uses a 3-strike policy).
- **Full-Text Search:** Instantly search through your entire article collection.
- **Branded Neon Splash Screen:** Sleek entry page with neon glow effects on startup.
- **Resizable Sidebar:** A draggable left sidebar that saves your preferred size to `localStorage`.

---

## 💾 Storage Requirements

LocalScrape has an extremely small footprint:
- **Application Code:** `< 1 MB`
- **Docker Container Size:** `~1 GB` (includes Python base image and Playwright/Chromium dependencies).
- **Article Storage (Data):** Extremely lightweight. Because articles are saved as text-only Markdown and images are hotlinked to their original URLs, a typical article is only `5 KB` to `30 KB`. 
  - *Example:* You can store **10,000 offline articles** in only `~150 MB` of disk space!
- **Database:** `0 MB` (100% database-free).

---

## 🚀 Getting Started

### Method 1: Using Docker (Recommended)

1. Ensure you have Docker and Docker Compose installed.
2. Clone this repository and open your terminal.
3. Build and run the container:
   ```bash
   docker compose up -d
   ```
4. Access the dashboard at [http://localhost:8603](http://localhost:8603).
5. Scraped articles will persist on your host machine inside the `./downloads` folder.

### Method 2: Manual Local Setup

1. Clone the repository and navigate into it.
2. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   # On Windows (PowerShell):
   .\venv\Scripts\Activate.ps1
   # On Linux/macOS:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Install Playwright browser dependencies:
   ```bash
   playwright install chromium
   ```
5. Run the server:
   ```bash
   uvicorn main:app --reload --port 8603
   ```
6. Access the dashboard at [http://localhost:8603](http://localhost:8603).

---

## 🧪 Running Tests

To run the automated FastAPI test suite, make sure you have `pytest` installed and run:

```bash
pytest
```

---

## 📂 File Persistence Structure

LocalScrape stores all configuration and scraped contents in standard files under the root workspace:

```text
├── downloads/
│   └── tags/
│       ├── tech/          # Folder matching tag 'tech'
│       │   └── article.md # Clean Markdown files
│       └── news/
├── feeds.json             # RSS configuration file (gitignored)
├── failed.json            # Failed job database (gitignored)
├── cookies.json           # Domain-specific Netscape cookies (gitignored)
└── requirements.txt       # Project dependencies
```

---

## 🛠️ API Reference

- `POST /api/scrape` — Queue URLs for scraping.
- `GET /api/queue` — Check status of background scrape queue.
- `GET /api/tags` — List all library tags.
- `GET /api/articles/{tag}` — List all articles inside a tag.
- `GET /api/articles/{tag}/{filename}` — Fetch Markdown file content.
- `PUT /api/tags/{old_tag}` — Rename a tag category.
- `DELETE /api/tags/{tag}` — Delete a tag and all its articles.
- `GET /api/rss` — List active RSS feeds.
- `POST /api/rss` — Register new RSS feed.
- `DELETE /api/rss` — Delete an RSS feed.
- `POST /api/rss/fetch` — Manually trigger RSS fetch.
- `GET /api/failed` — View failed scraper attempts.
- `POST /api/failed/retry` — Retry failed scrape jobs.
- `GET /api/search?q={query}` — Full-text search over Markdown library.
- `GET /api/export/{tag}` — Download a zip of all articles under a tag.
