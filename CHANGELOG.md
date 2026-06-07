# Changelog

## v1.6.0
### New Features
- **Activity Monitor:** Consolidated the Failed Jobs and Logs views into a single dashboard.
- **Job History:** Added tracking for successfully completed scrape jobs.
- **10-Day Retention:** Implemented a background automated cleanup task to prune log files and job histories older than 10 days to save space.

## v1.5.0
### New Features
- **PWA Support:** Install LocalScrape to your home screen with offline manifest and service worker support.
- **Focus / Zen Mode:** Distraction-free reading with the '👓 Focus' toggle that fades out all UI elements.
- **Text-to-Speech:** Listen to articles using the '🎧 Listen' button via the native Web Speech API.
- **Virtual Favorites:** Star articles to collect them in a virtual 'Favorites' folder on your dashboard.
- **Smart Auto-Tagging:** Leaving the tag input blank will fallback to automatically parsing keywords or 'uncategorized'.
- **One-Click Backup:** Zip and download your entire library directly from the sidebar.
- **Print-to-PDF Optimizer:** Clean print formatting optimized for readability and paper saving.
- **Safari Optimizations:** Switched to `100dvh` and eliminated bounce scrolling for an improved mobile viewport layout.
- **Storage Warnings:** The storage badge turns red and alerts you when the library exceeds 500MB.
- **Terminal Theme:** Added a third "Hacker/Terminal" theme to the switcher.
- **Instant Search:** Find tags and articles quickly using the new search bars in the library views.
- **Reading Progress Bar:** A fixed progress indicator appears when reading long articles.
- **Download Button:** Export articles directly to your local machine as `.md` files.
- **Article Dates:** Articles now display their added dates and sort by newest first across all views.

## v1.4.0
- **Library Tile Layout:** The default home screen is now a CSS Grid of large, clickable Tag Tiles.
- **Session Splash Screen:** The splash page now uses sessionStorage and only appears once per browser session.
- **Inactivity Lock:** After 10 minutes of no interaction, the splash screen fades back in to hide app contents.
- **Branding:** New inline SVG brand icon and a custom document/search favicon.

## v1.3.3
- **Automated Maintenance:** Background cleanup job that automatically deletes RSS articles older than 5 days.

## v1.3.0
- **Fetch Now:** Manually trigger an RSS feed pull.
- **Delete After Reading:** A "Delete this article" prompt appears when you scroll to the bottom.
- **Storage Counter:** Live indicator showing total library disk usage.
- **Failed Jobs UI:** Fully interactive view to review, retry, or dismiss failed scrapes.

## v1.2.0 (Beta Polish)
- **RSS Feeds:** Automated polling every 2 hours with keyword matching.
- **Full-Text Search API:** Search your entire local library via `/api/search`.
- **Cookie Injector:** Save domain cookies for paywall bypassing.

## v1.1.0
- **Playwright Fallback:** Headless Chromium integration for JS-heavy sites.
- **Referer Spoofing:** Bypass soft paywalls pretending to be Google/Twitter.
- **Metrics:** YAML front-matter with reading time and word count.
