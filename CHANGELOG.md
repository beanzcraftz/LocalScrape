# Changelog

## v2.1.4
### UI Enhancements
- **Activity Monitor:** Added "Clear All" buttons to both the Failed Jobs and Completed Jobs sections within the Activity Monitor, allowing users to wipe history logs on demand.

## v2.1.3
### Bug Fixes
- **Reading Time Calculation:** Fixed a regex parsing bug on the backend where quoted reading times in markdown frontmatter caused the total reading time calculations on the library dashboard to incorrectly display as 0 minutes.

## v2.1.2
### Bug Fixes
- **Reader Navigation Fix:** Pressing "Back" or deleting an article from within the Reader View now correctly returns you to the current tag's folder view instead of dropping you all the way back to the main library grid.

## v2.1.1
### UI Enhancements & Fixes
- **Reader Navigation:** Added a "Next Article" button directly to the main Reader view header, allowing users to seamlessly skip through RSS feeds without returning to the library grid.
- **Widescreen Layout:** Eliminated the horizontal scrollbar issue on the Info tabs and enforced a full-width layout for the main content wrappers.
- **AI Cleanup:** Removed all legacy UI and backend references to the Gemini AI integration.

## v2.1.0
### Settings Dashboard & Dynamic Config
- **Settings UI:** Added a dedicated Settings dashboard to manage RSS polling, retentions, UI defaults, TTS preferences, and Global Cookies natively in the browser without editing JSON files.
- **Dynamic Configuration:** Backend jobs like APScheduler now dynamically read retentions and intervals from `settings.json`, automatically updating and rescheduling when changed.

## v2.0.0
### Major Features & UI/UX Overhaul
- **Mobile PWA Enhancements:** Added Web Share Target API to accept URLs directly from mobile browser share sheets, and added swipe-left/swipe-right gestures to navigate between articles or return to the library.
- **Reading Power-Ups:** Introduced a Read/Unread state tracker that persists locally and highlights unread articles, Bionic Reading Mode for improved focus, and a customizable Teleprompter auto-scroll.
- **Bulk Data Utilities:** Added a multi-select batch actions floating panel to mark items read/unread, delete them, or seamlessly compile them into a new Megathread digest.
- **Library Data Analysis:** A new interactive info tab detailing storage footprints, read ratios, and estimated total reading time aggregations dynamically overlaid across the dashboard tiles.
- **Canonical Duplication Safeguard:** Backend instantly filters duplicate URLs against historical completion logs to drastically improve queue efficiency.

## v1.7.2
### Bug Fixes
- **Sidebar Navigation:** Fixed an issue where clicking a tag in the sidebar with 0 articles would force an empty state view, while clicking a tag with articles would only expand the sidebar accordion without updating the central view. Now, clicking any tag in the sidebar perfectly mirrors the behavior of clicking it in the Dashboard grid.

## v1.7.1
### Bug Fixes & Refinements
- **Zen Mode Visibility:** Removed the `hidden` class from the Focus Mode floating controls that was preventing them from appearing.
- **Next Article Flow:** Replaced the Auto-Scroll button with a "Next Article" button that instantly loads the next article in your current folder queue for seamless reading.
- **TTS Speed Clarification:** Added an automatic Toast notification to inform users that they must stop and restart the TTS engine to apply a new speed setting, due to browser API limitations.


## v1.7.0
### New Features & Improvements
- **Text-to-Speech Speed Control:** Added a speed adjustment slider next to the TTS Listen button (0.5x to 2.0x).
- **Zen Mode Controls:** Added a floating action menu during Focus Mode with a "Close" button to exit and an "Auto-Scroll" button to automatically read down the page.
- **Documentation Overhaul:** Fully updated the in-app Help & Docs to accurately reflect the new Add Articles/Links dashboard and Reader tools.

## v1.6.5
### Bug Fixes
- **UI Initialization Crash:** Fixed a critical JavaScript ReferenceError caused by missing variables that prevented the sidebar, storage calculator, and dashboard library from loading properly.
- **Favorites Tile Rendering:** Fixed a bug where the "Favorites" virtual tile would crash the dashboard rendering pipeline or fail to display alongside other tags.
- **CPU Pegging:** Pushed Service Worker cache bust to properly deploy the CSS infinite animation fixes, permanently resolving the background Firefox CPU pegging issue.

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
