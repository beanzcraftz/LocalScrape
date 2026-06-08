// --- Splash Screen (Session-Based + Inactivity Timer) ---
document.addEventListener('DOMContentLoaded', () => {
    const splashScreen = document.getElementById('splash-screen');
    const splashBtn = document.getElementById('splash-enter-btn');
    const appLayout = document.getElementById('app-layout');

    // --- Inactivity Timer (10 minutes) ---
    let inactivityTimeout = null;
    const INACTIVITY_LIMIT = 10 * 60 * 1000; // 10 minutes

    function resetInactivityTimer() {
        if (inactivityTimeout) clearTimeout(inactivityTimeout);
        inactivityTimeout = setTimeout(() => {
            showSplash();
        }, INACTIVITY_LIMIT);
    }

    ['mousemove', 'click', 'keypress', 'scroll', 'touchstart'].forEach(evt => {
        document.addEventListener(evt, resetInactivityTimer, { passive: true });
    });

    function dismissSplash() {
        splashScreen.classList.add('fade-out');
        splashScreen.classList.remove('fade-in');
        sessionStorage.setItem('splashDismissed', 'true');
        setTimeout(() => {
            splashScreen.style.display = 'none';
            appLayout.classList.remove('hidden');
        }, 600);
        resetInactivityTimer();
    }

    function showSplash() {
        sessionStorage.removeItem('splashDismissed');
        splashScreen.classList.remove('fade-out');
        splashScreen.style.display = 'flex';
        // Trigger reflow then add fade-in
        void splashScreen.offsetWidth;
        splashScreen.classList.add('fade-in');
        appLayout.classList.add('hidden');
        if (inactivityTimeout) clearTimeout(inactivityTimeout);
    }

    // Check session: skip splash if already dismissed this session
    if (splashBtn && splashScreen && appLayout) {
        if (sessionStorage.getItem('splashDismissed')) {
            // Skip splash entirely on refresh
            splashScreen.style.display = 'none';
            appLayout.classList.remove('hidden');
            resetInactivityTimer();
        } else {
            splashBtn.addEventListener('click', dismissSplash);
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    
    const tagsList = document.getElementById('tags-list');
    
    const urlsInput = document.getElementById('urls-input');
    const tagInput = document.getElementById('tag-input');
    const scrapeBtn = document.getElementById('scrape-btn');
    const scrapeMessage = document.getElementById('scrape-message');
    
    const queueStatus = document.getElementById('queue-status');
    const queueText = document.getElementById('queue-text');
    
    const controlCard = document.getElementById('control-card');
    const readerView = document.getElementById('reader-view');
    const markdownContent = document.getElementById('markdown-content');
    const closeReaderBtn = document.getElementById('close-reader-btn');
    const readerControls = document.getElementById('reader-controls');
    const fontSizeSlider = document.getElementById('font-size-slider');
    
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.querySelector('.sidebar');
    const sidebarBackdrop = document.getElementById('sidebar-backdrop');
    
    const navLibraryBtn = document.getElementById('nav-library-btn');
    const navDashboardBtn = document.getElementById('nav-dashboard-btn');
    const navRssBtn = document.getElementById('nav-rss-btn');
    const navActivityBtn = document.getElementById('nav-activity-btn');
    const navInfoBtn = document.getElementById('nav-info-btn');
    const navSettingsBtn = document.getElementById('nav-settings-btn');
    
    const activityMonitorView = document.getElementById('activity-monitor-view');
    const infoView = document.getElementById('info-view');
    const settingsView = document.getElementById('settings-view');
    const rssView = document.getElementById('rss-view');
    const rssUrlInput = document.getElementById('rss-url-input');
    const rssTagInput = document.getElementById('rss-tag-input');
    const rssKeywordsInput = document.getElementById('rss-keywords-input');
    const addRssBtn = document.getElementById('add-rss-btn');
    const rssList = document.getElementById('rss-list');
    
    const failedList = document.getElementById('failed-list');
    const completedList = document.getElementById('completed-list');
    const emptyStateView = document.getElementById('empty-state-view');
    const libraryView = document.getElementById('library-view');
    const tagArticlesView = document.getElementById('tag-articles-view');
    const backToLibraryBtn = document.getElementById('back-to-library-btn');
    const tagArticlesTitle = document.getElementById('tag-articles-title');
    const tagArticlesList = document.getElementById('tag-articles-list');
    
    const emptyStateDashboardBtn = document.getElementById('empty-state-dashboard-btn');
    const refreshActivityBtn = document.getElementById('refresh-activity-btn');
    const clearFailedBtn = document.getElementById('clear-failed-btn');
    const clearCompletedBtn = document.getElementById('clear-completed-btn');
    const logsContent = document.getElementById('logs-content');
    
    const renameArticleBtn = document.getElementById('rename-article-btn');
    const deleteArticleBtn = document.getElementById('delete-article-btn');
    const endOfArticle = document.getElementById('end-of-article');
    const endDeleteBtn = document.getElementById('end-delete-btn');
    const downloadArticleBtn = document.getElementById('download-article-btn');
    const focusModeBtn = document.getElementById('focus-mode-btn');
    const ttsListenBtn = document.getElementById('tts-listen-btn');
    const ttsControls = document.getElementById('tts-controls');
    const ttsSpeed = document.getElementById('tts-speed');
    const ttsSpeedLabel = document.getElementById('tts-speed-label');
    const favoriteArticleBtn = document.getElementById('favorite-article-btn');
    const navBackupBtn = document.getElementById('nav-backup-btn');
    
    const bionicModeBtn = document.getElementById('bionic-mode-btn');
    const teleprompterBtn = document.getElementById('teleprompter-btn');
    const teleprompterControls = document.getElementById('teleprompter-controls');
    const teleprompterPlayBtn = document.getElementById('teleprompter-play-btn');
    const teleprompterSpeed = document.getElementById('teleprompter-speed');
    
    const readerMenuBtn = document.getElementById('reader-menu-btn');
    const readerMenuDropdown = document.getElementById('reader-menu-dropdown');
    
    const exitFocusBtn = document.getElementById('exit-focus-btn');
    const resumePrompt = document.getElementById('resume-prompt');
    const resumeYesBtn = document.getElementById('resume-yes-btn');
    const resumeNoBtn = document.getElementById('resume-no-btn');
    const nextArticleBtn = document.getElementById('next-article-btn');
    const nextArticleMainBtn = document.getElementById('next-article-main-btn');
    
    const librarySearch = document.getElementById('library-search');
    const tagSearch = document.getElementById('tag-search');
    const readingProgress = document.getElementById('reading-progress');
    
    const storageText = document.getElementById('storage-text');
    
    const tagDatalist = document.getElementById('tag-datalist');
    const toastContainer = document.getElementById('toast-container');
    const sidebarResizer = document.getElementById('sidebar-resizer');

    const batchPanel = document.getElementById('batch-actions-panel');
    const batchCount = document.getElementById('batch-count');
    const batchReadBtn = document.getElementById('batch-read-btn');
    const batchUnreadBtn = document.getElementById('batch-unread-btn');
    const batchMegathreadBtn = document.getElementById('batch-megathread-btn');
    const batchDeleteBtn = document.getElementById('batch-delete-btn');
    const batchCancelBtn = document.getElementById('batch-cancel-btn');

    let currentArticleTag = null;
    let currentArticleFilename = null;
    let currentArticleRaw = null;
    let favoritesList = [];
    let readStates = {};
    let isSpeaking = false;
    let isFocusMode = false;
    let currentArticleQueue = [];

    // --- State ---
    let pollInterval = null;
    let previousQueueCount = 0;
    let isResizing = false;

    // --- Sidebar Resizer ---
    function initSidebarWidth() {
        const savedWidth = localStorage.getItem('sidebar-width');
        if (savedWidth) {
            document.documentElement.style.setProperty('--sidebar-width', savedWidth);
        }
    }

    if (sidebarResizer) {
        sidebarResizer.addEventListener('mousedown', (e) => {
            isResizing = true;
            document.body.classList.add('resizing');
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            // Calculate new width (mouse X position)
            // Min 200px, Max 600px handled by CSS, but we also bound it here for safety
            let newWidth = e.clientX;
            if (newWidth < 200) newWidth = 200;
            if (newWidth > 600) newWidth = 600;
            
            document.documentElement.style.setProperty('--sidebar-width', newWidth + 'px');
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                document.body.classList.remove('resizing');
                const finalWidth = document.documentElement.style.getPropertyValue('--sidebar-width');
                if (finalWidth) localStorage.setItem('sidebar-width', finalWidth);
            }
        });
    }

    initSidebarWidth();

    // --- Theme Management ---
    function initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);
    }

    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        let newTheme = 'dark';
        if (currentTheme === 'dark') newTheme = 'terminal';
        else if (currentTheme === 'terminal') newTheme = 'light';
        else newTheme = 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    }

    function updateThemeIcon(theme) {
        if (theme === 'dark') themeIcon.textContent = '🌙';
        else if (theme === 'light') themeIcon.textContent = '☀️';
        else themeIcon.textContent = '💻';
    }

    themeToggleBtn.addEventListener('click', toggleTheme);
    initTheme();
    
    async function loadFavorites() {
        try {
            const res = await fetch('/api/favorites');
            const data = await res.json();
            favoritesList = data.favorites || [];
        } catch (err) {
            console.error('Failed to load favorites', err);
        }
    }
    
    async function openFavoritesView() {
        switchView('tag-articles');
        tagArticlesTitle.textContent = `★ Favorites`;
        tagArticlesList.innerHTML = '';
        
        if (favoritesList.length === 0) {
            tagArticlesList.innerHTML = `
                <div class="library-empty">
                    <div class="empty-icon">★</div>
                    <h3>No favorites yet</h3>
                    <p>Star some articles to see them here.</p>
                </div>
            `;
            return;
        }
        
        currentArticleQueue = favoritesList.map(path => {
            const parts = path.split('/');
            return parts.length === 2 ? { tag: parts[0], filename: parts[1] } : null;
        }).filter(a => a !== null);
        
        favoritesList.forEach(path => {
            const parts = path.split('/');
            if (parts.length !== 2) return;
            const tag = parts[0];
            const filename = parts[1];
            
            const card = document.createElement('div');
            card.className = 'article-card';
            if (!readStates[path]) {
                card.classList.add('unread-bold');
            } else {
                card.classList.add('read-muted');
            }
            card.innerHTML = `
                <input type="checkbox" class="article-checkbox" data-path="${path}" style="margin-right:0.5rem; width:1.2rem; height:1.2rem; cursor:pointer;">
                <div class="article-card-icon">★</div>
                <div style="display:flex; flex-direction:column; justify-content:center; flex-grow:1;">
                    <div class="article-card-name">${filename.replace('.md', '')}</div>
                    <span class="article-date">${tag}</span>
                </div>
            `;
            
            const checkbox = card.querySelector('.article-checkbox');
            checkbox.checked = selectedArticles.has(path);
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) selectedArticles.add(path);
                else selectedArticles.delete(path);
                updateBatchPanel();
            });
            checkbox.addEventListener('click', e => e.stopPropagation());
            
            card.addEventListener('click', () => openArticle(tag, filename));
            tagArticlesList.appendChild(card);
        });
    }

    // --- Sidebar & Data Loading ---
    async function loadTags() {
        try {
            const res = await fetch('/api/tags?t=' + Date.now(), { cache: "no-store" });
            const data = await res.json();
            renderTags(data.tags);
        } catch (err) {
            console.error('Failed to load tags:', err);
        }
    }

    function renderTags(tags) {
        tagsList.innerHTML = '';
        tagDatalist.innerHTML = '';
        
        // Add Favorites to sidebar
        const favSidebar = document.createElement('li');
        favSidebar.className = 'tag-item';
        favSidebar.innerHTML = `
            <div class="tag-header">
                <span class="folder-icon" style="flex-grow:1; display:flex; align-items:center; color:gold;">★ Favorites</span>
            </div>
        `;
        favSidebar.addEventListener('click', openFavoritesView);
        tagsList.appendChild(favSidebar);

        tags.forEach(tag => {
            const option = document.createElement('option');
            option.value = tag;
            tagDatalist.appendChild(option);

            const li = document.createElement('li');
            li.className = 'tag-item';
            
            const header = document.createElement('div');
            header.className = 'tag-header';
            header.innerHTML = `
                <span class="folder-icon" style="flex-grow:1; display:flex; align-items:center;">📁 ${tag}</span>
                <span class="tag-actions">
                    <button class="rename-tag" title="Rename Tag" style="background:none;border:none;cursor:pointer;font-size:0.8rem;margin-right:4px;">✏️</button>
                    <button class="delete-tag" title="Delete Tag" style="background:none;border:none;cursor:pointer;font-size:0.8rem">🗑️</button>
                </span>
            `;
            
            // Rename tag logic
            const renameBtn = header.querySelector('.rename-tag');
            renameBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const newName = prompt(`Rename tag '${tag}' to:`, tag);
                if (newName && newName !== tag) {
                    try {
                        const res = await fetch(`/api/tags/${tag}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ new_name: newName })
                        });
                        if (res.ok) {
                            loadTags();
                            switchView('library');
                        } else {
                            const error = await res.json();
                            alert(`Failed to rename tag: ${error.detail}`);
                        }
                    } catch (err) {
                        console.error(err);
                    }
                }
            });

            // Delete tag logic
            const deleteBtn = header.querySelector('.delete-tag');
            deleteBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (confirm(`Are you sure you want to delete the tag '${tag}' and all its articles?`)) {
                    try {
                        const res = await fetch(`/api/tags/${tag}`, { method: 'DELETE' });
                        if (res.ok) {
                            loadTags();
                            switchView('library');
                        } else {
                            alert('Failed to delete tag.');
                        }
                    } catch (err) {
                        console.error(err);
                    }
                }
            });
            
            const articlesContainer = document.createElement('ul');
            articlesContainer.className = 'articles-list';
            
            header.addEventListener('click', () => {
                const isOpen = articlesContainer.classList.contains('open');
                // Close all other open tags
                document.querySelectorAll('.articles-list.open').forEach(el => el.classList.remove('open'));
                
                if (!isOpen) {
                    articlesContainer.classList.add('open');
                    loadArticles(tag, articlesContainer);
                }
                
                // Also load the tag in the central view to match dashboard behavior
                openTagView(tag);
            });

            li.appendChild(header);
            li.appendChild(articlesContainer);
            tagsList.appendChild(li);
        });
    }

    async function loadArticles(tag, container) {
        container.innerHTML = '<li class="article-item">Loading...</li>';
        try {
            const res = await fetch(`/api/articles/${tag}`);
            const data = await res.json();
            
            container.innerHTML = '';
            if (data.articles.length === 0) {
                container.innerHTML = '<li class="article-item" style="pointer-events:none">No articles</li>';
                return;
            }

            data.articles.forEach(article => {
                const li = document.createElement('li');
                li.className = 'article-item';
                li.style.flexDirection = 'column';
                li.style.alignItems = 'flex-start';
                
                const dateStr = new Date(article.added_at * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                li.innerHTML = `<span style="word-break: break-word;">${article.filename.replace('.md', '')}</span><span class="article-date">${dateStr}</span>`;
                li.title = article.filename;
                
                li.addEventListener('click', (e) => {
                    // Highlight active
                    document.querySelectorAll('.article-item.active').forEach(el => el.classList.remove('active'));
                    li.classList.add('active');
                    openArticle(tag, article.filename);
                    
                    // Close sidebar on mobile
                    if (window.innerWidth <= 768) {
                        sidebar.classList.remove('open');
                        sidebarBackdrop.classList.remove('show');
                    }
                });
                
                container.appendChild(li);
            });
        } catch (err) {
            console.error('Failed to load articles:', err);
            container.innerHTML = '<li class="article-item">Error loading</li>';
        }
    }

    // --- View Management ---
    function switchView(viewName) {
        if (librarySearch) librarySearch.value = '';
        if (tagSearch) tagSearch.value = '';
        if (readingProgress) readingProgress.style.width = '0%';
        
        controlCard.classList.add('hidden');
        readerView.classList.add('hidden');
        activityMonitorView.classList.add('hidden');
        infoView.classList.add('hidden');
        settingsView.classList.add('hidden');
        rssView.classList.add('hidden');
        emptyStateView.classList.add('hidden');
        readerControls.classList.add('hidden');
        libraryView.classList.add('hidden');
        tagArticlesView.classList.add('hidden');

        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

        if (viewName === 'library') {
            libraryView.classList.remove('hidden');
            navLibraryBtn.classList.add('active');
            renderLibraryTiles();
        } else if (viewName === 'tag-articles') {
            tagArticlesView.classList.remove('hidden');
            navLibraryBtn.classList.add('active');
        } else if (viewName === 'dashboard') {
            controlCard.classList.remove('hidden');
            navDashboardBtn.classList.add('active');
        } else if (viewName === 'rss') {
            rssView.classList.remove('hidden');
            navRssBtn.classList.add('active');
            loadRssFeeds();
        } else if (viewName === 'activity') {
            activityMonitorView.classList.remove('hidden');
            navActivityBtn.classList.add('active');
            loadActivityMonitor();
        } else if (viewName === 'info') {
            infoView.classList.remove('hidden');
            navInfoBtn.classList.add('active');
        } else if (viewName === 'settings') {
            settingsView.classList.remove('hidden');
            if (navSettingsBtn) navSettingsBtn.classList.add('active');
            loadSettings();
        } else if (viewName === 'reader') {
            readerView.classList.remove('hidden');
            readerControls.classList.remove('hidden');
        } else if (viewName === 'empty-state') {
            emptyStateView.classList.remove('hidden');
        }
        
        // Close mobile sidebar if open
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('open');
            sidebarBackdrop.classList.remove('show');
        }
    }

    navLibraryBtn.addEventListener('click', () => switchView('library'));
    navDashboardBtn.addEventListener('click', () => switchView('dashboard'));
    navRssBtn.addEventListener('click', () => switchView('rss'));
    navActivityBtn.addEventListener('click', () => switchView('activity'));
    navInfoBtn.addEventListener('click', () => switchView('info'));
    if (navSettingsBtn) navSettingsBtn.addEventListener('click', () => switchView('settings'));
    
    emptyStateDashboardBtn.addEventListener('click', () => switchView('library'));

    // --- Library Tiles ---
    async function renderLibraryTiles() {
        const tilesContainer = document.getElementById('library-tiles');
        tilesContainer.innerHTML = '<p style="color:var(--text-muted)">Loading your library...</p>';
        
        try {
            const res = await fetch('/api/analysis?t=' + Date.now(), { cache: "no-store" });
            const data = await res.json();
            
            tilesContainer.innerHTML = '';
            
            // Render Favorites tile in Dashboard Grid
            const favTile = document.createElement('div');
            favTile.className = 'tag-tile';
            favTile.innerHTML = `
                <div class="tag-tile-icon" style="color:gold;">★</div>
                <div class="tag-tile-name">Favorites</div>
                <div class="tag-tile-count">${favoritesList.length} article${favoritesList.length !== 1 ? 's' : ''}</div>
            `;
            favTile.addEventListener('click', openFavoritesView);
            tilesContainer.appendChild(favTile);
            
            if (data.analysis.length === 0 && favoritesList.length === 0) {
                tilesContainer.innerHTML = `
                    <div class="library-empty">
                        <div class="empty-icon">\ud83d\udced</div>
                        <h3>No collections yet</h3>
                        <p>Head over to <strong>Add Articles/Links</strong> to start building your library.</p>
                    </div>
                `;
                return;
            }
            
            data.analysis.forEach(item => {
                const count = item.total_assets;
                const tile = document.createElement('div');
                tile.className = 'tag-tile';
                if (item.total_pending > 0) {
                    tile.classList.add('unread-highlight');
                }
                tile.innerHTML = `
                    <div class="tag-tile-icon">\ud83d\udcc1</div>
                    <div class="tag-tile-name">${item.tag}</div>
                    <div class="tag-tile-count">${count} article${count !== 1 ? 's' : ''}</div>
                    <span class="metric-overlay">${item.total_pending} unread &bull; ~${item.total_read_time} min total</span>
                `;
                tile.addEventListener('click', () => openTagView(item.tag));
                tilesContainer.appendChild(tile);
            });
            
        } catch (err) {
            console.error('Failed to load library tiles:', err);
            tilesContainer.innerHTML = '<p style="color:var(--error-text)">Failed to load library.</p>';
        }
    }

    async function openTagView(tag) {
        switchView('tag-articles');
        tagArticlesTitle.textContent = `\ud83d\udcc1 ${tag}`;
        tagArticlesList.innerHTML = '<p style="color:var(--text-muted)">Loading articles...</p>';
        
        try {
            const res = await fetch(`/api/articles/${tag}`);
            const data = await res.json();
            
            tagArticlesList.innerHTML = '';
            
            if (data.articles.length === 0) {
                tagArticlesList.innerHTML = `
                    <div class="library-empty">
                        <div class="empty-icon">\ud83d\udcf0</div>
                        <h3>No articles in this collection</h3>
                        <p>Scrape some URLs with this tag to populate it.</p>
                    </div>
                `;
                return;
            }
            
            currentArticleQueue = data.articles.map(a => ({ tag, filename: a.filename }));
            
            data.articles.forEach(article => {
                const card = document.createElement('div');
                card.className = 'article-card';
                const pathKey = tag + '/' + article.filename;
                if (!readStates[pathKey]) {
                    card.classList.add('unread-bold');
                } else {
                    card.classList.add('read-muted');
                }
                const dateStr = new Date(article.added_at * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                card.innerHTML = `
                    <input type="checkbox" class="article-checkbox" data-path="${pathKey}" style="margin-right:0.5rem; width:1.2rem; height:1.2rem; cursor:pointer;">
                    <div class="article-card-icon">\ud83d\udcc4</div>
                    <div style="display:flex; flex-direction:column; justify-content:center; flex-grow:1;">
                        <div class="article-card-name">${article.filename.replace('.md', '')}</div>
                        <span class="article-date">${dateStr}</span>
                    </div>
                `;
                
                const checkbox = card.querySelector('.article-checkbox');
                checkbox.checked = selectedArticles.has(pathKey);
                checkbox.addEventListener('change', (e) => {
                    if (e.target.checked) selectedArticles.add(pathKey);
                    else selectedArticles.delete(pathKey);
                    updateBatchPanel();
                });
                checkbox.addEventListener('click', e => e.stopPropagation());
                
                card.addEventListener('click', () => openArticle(tag, article.filename));
                tagArticlesList.appendChild(card);
            });
        } catch (err) {
            console.error('Failed to load tag articles:', err);
            tagArticlesList.innerHTML = '<p style="color:var(--error-text)">Failed to load articles.</p>';
        }
    }

    backToLibraryBtn.addEventListener('click', () => switchView('library'));

    // --- Reader View ---
    function stripFrontMatter(text) {
        // Strip YAML front-matter block (between opening --- and closing ---)
        const match = text.match(/^---\n([\s\S]*?)\n---\n\n?([\s\S]*)$/);
        if (match) {
            // Parse simple key-value pairs from YAML
            const meta = {};
            match[1].split('\n').forEach(line => {
                const kv = line.match(/^(\w+):\s*"?(.+?)"?\s*$/);
                if (kv) meta[kv[1]] = kv[2];
            });
            return { meta, body: match[2] };
        }
        return { meta: null, body: text };
    }

    async function openArticle(tag, filename) {
        currentArticleTag = tag;
        currentArticleFilename = filename;
        switchView('reader');
        markdownContent.innerHTML = '<p>Loading article...</p>';
        endOfArticle.classList.add('hidden');

        try {
            const res = await fetch(`/api/articles/${tag}/${filename}`);
            if (!res.ok) throw new Error('Article not found');
            const markdownText = await res.text();
            currentArticleRaw = markdownText;
            
            const { meta, body } = stripFrontMatter(markdownText);
            
            // Check favorites
            const path = tag + '/' + filename;
            if (favoritesList.includes(path)) {
                favoriteArticleBtn.style.color = 'gold';
            } else {
                favoriteArticleBtn.style.color = '';
            }
            
            // Build an optional metadata bar if front-matter exists
            let metaHtml = '';
            if (meta) {
                const parts = [];
                if (meta.word_count) parts.push(`${parseInt(meta.word_count).toLocaleString()} words`);
                if (meta.reading_time) parts.push(`${meta.reading_time} read`);
                if (meta.date_scraped) {
                    const d = new Date(meta.date_scraped);
                    parts.push(`Scraped ${d.toLocaleDateString()}`);
                }
                if (meta.source) parts.push(`<a href="${meta.source}" target="_blank" rel="noopener">Source ↗</a>`);
                metaHtml = `<div class="article-meta">${parts.join(' · ')}</div>`;
            }

            markdownContent.innerHTML = metaHtml + marked.parse(body);
            
            // Fetch progress and show prompt if resuming
            try {
                const progRes = await fetch('/api/progress');
                if (progRes.ok) {
                    const progressData = await progRes.json();
                    const savedPos = progressData[path];
                    if (savedPos && savedPos > 0) {
                        resumePrompt.classList.remove('hidden');
                        
                        // Action listeners
                        resumeYesBtn.onclick = () => {
                            const scrollContainer = readerView.closest('.content-scrollable');
                            if (scrollContainer) {
                                scrollContainer.scrollTo({ top: savedPos, behavior: 'smooth' });
                            }
                            resumePrompt.classList.add('hidden');
                        };
                        resumeNoBtn.onclick = () => {
                            resumePrompt.classList.add('hidden');
                        };
                    }
                }
            } catch (err) {
                console.error("Failed to load reading progress:", err);
            }
            
            // Scroll detection: show delete prompt when near the bottom & update progress bar
            const scrollContainer = readerView.closest('.content-scrollable');
            if (scrollContainer) {
                let progressTimer = null;
                const onScroll = () => {
                    const scrollBottom = scrollContainer.scrollTop + scrollContainer.clientHeight;
                    const totalHeight = scrollContainer.scrollHeight;
                    
                    // Hide resume prompt on manual scroll
                    if (resumePrompt && !resumePrompt.classList.contains('hidden')) {
                        resumePrompt.classList.add('hidden');
                    }
                    
                    // Update Progress Bar
                    if (readingProgress) {
                        const scrollableDist = totalHeight - scrollContainer.clientHeight;
                        let progress = 0;
                        if (scrollableDist > 0) {
                            progress = Math.min(100, Math.max(0, (scrollContainer.scrollTop / scrollableDist) * 100));
                        }
                        readingProgress.style.width = `${progress}%`;
                    }
                    
                    if (scrollBottom >= totalHeight - 350) {
                        endOfArticle.classList.remove('hidden');
                    } else {
                        endOfArticle.classList.add('hidden');
                    }
                    
                    // Debounced Progress Save
                    clearTimeout(progressTimer);
                    progressTimer = setTimeout(() => {
                        let positionToSave = Math.floor(scrollContainer.scrollTop);
                        if (scrollBottom >= totalHeight - 350) {
                            positionToSave = 0; // Reset progress when finished
                        }
                        
                        fetch('/api/progress', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ path: path, position: positionToSave })
                        }).catch(console.error);
                    }, 1000);
                };
                // Ensure no duplicate listeners if opened multiple times
                scrollContainer.onscroll = onScroll;
            }
        } catch (err) {
            console.error('Failed to load article:', err);
            markdownContent.innerHTML = '<p style="color:var(--error-text)">Failed to load article content.</p>';
        }
    }

    // --- Read State Intersection Observer ---
    const readerObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting && currentArticleTag && currentArticleFilename) {
                const path = currentArticleTag + '/' + currentArticleFilename;
                if (!readStates[path]) {
                    fetch('/api/read-state', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ path: path, read: true })
                    }).then(() => {
                        readStates[path] = true;
                    }).catch(err => console.error(err));
                }
            }
        });
    }, { threshold: 0.1 });
    
    if (endOfArticle) {
        readerObserver.observe(endOfArticle);
    }

    closeReaderBtn.addEventListener('click', () => {
        if (currentArticleTag) {
            openTagView(currentArticleTag);
        } else {
            switchView('library');
        }
        endOfArticle.classList.add('hidden');
        document.querySelectorAll('.article-item.active').forEach(el => el.classList.remove('active'));
    });

    // End-of-article delete button
    endDeleteBtn.addEventListener('click', async () => {
        if (!currentArticleTag || !currentArticleFilename) return;
        try {
            const res = await fetch(`/api/articles/${currentArticleTag}/${currentArticleFilename}`, { method: 'DELETE' });
            if (res.ok) {
                showToast('Article deleted');
                    loadTags();
                    loadStorage();
                    if (currentArticleTag) {
                        openTagView(currentArticleTag);
                    } else {
                        switchView('library');
                    }
            } else {
                alert('Failed to delete article.');
            }
        } catch (err) {
            console.error(err);
        }
    });

    renameArticleBtn.addEventListener('click', async () => {
        if (!currentArticleTag || !currentArticleFilename) return;
        const newName = prompt('Rename article to:', currentArticleFilename.replace('.md', ''));
        if (newName && newName + '.md' !== currentArticleFilename) {
            try {
                const res = await fetch(`/api/articles/${currentArticleTag}/${currentArticleFilename}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ new_name: newName })
                });
                if (res.ok) {
                    const data = await res.json();
                    loadTags();
                    openArticle(currentArticleTag, data.filename);
                } else {
                    alert('Failed to rename article.');
                }
            } catch (err) {}
        }
    });

    deleteArticleBtn.addEventListener('click', async () => {
        if (!currentArticleTag || !currentArticleFilename) return;
        if (confirm(`Delete article '${currentArticleFilename}'?`)) {
            try {
                const res = await fetch(`/api/articles/${currentArticleTag}/${currentArticleFilename}`, { method: 'DELETE' });
                if (res.ok) {
                    loadTags();
                    if (currentArticleTag) {
                        openTagView(currentArticleTag);
                    } else {
                        switchView('library');
                    }
                } else {
                    alert('Failed to delete article.');
                }
            } catch (err) {}
        }
    });

    // Font size scaling
    fontSizeSlider.addEventListener('input', (e) => {
        const scale = e.target.value;
        markdownContent.style.fontSize = `${scale}em`;
    });

    // --- Scraping Form ---
    scrapeBtn.addEventListener('click', async () => {
        const urlsText = urlsInput.value.trim();
        const tag = tagInput.value.trim();

        if (!urlsText || !tag) {
            showMessage('Please provide at least one URL and a tag.', 'error');
            return;
        }

        const urls = urlsText.split('\n').map(u => u.trim()).filter(u => u);
        
        // Disable button during req
        scrapeBtn.disabled = true;
        scrapeBtn.textContent = 'Submitting...';

        try {
            const res = await fetch('/api/scrape', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ urls, tag })
            });
            
            const data = await res.json();
            
            if (res.ok) {
                showMessage(data.message, 'success');
                urlsInput.value = ''; // clear form
                previousQueueCount = data.queued; // Seed count so fast jobs still trigger the toast
                startQueuePolling();
                // Refresh tags slightly later in case it's a new tag
                setTimeout(loadTags, 2000);
            } else {
                showMessage(`Error: ${data.detail || 'Failed to queue'}`, 'error');
            }
        } catch (err) {
            console.error(err);
            showMessage('Network error submitting scrape job.', 'error');
        } finally {
            scrapeBtn.disabled = false;
            scrapeBtn.textContent = 'Scrape';
        }
    });

    function showMessage(msg, type) {
        scrapeMessage.textContent = msg;
        scrapeMessage.className = `message ${type}`;
        scrapeMessage.classList.remove('hidden');
        setTimeout(() => {
            scrapeMessage.classList.add('hidden');
        }, 5000);
    }

    function showToast(msg) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = msg;
        toastContainer.appendChild(toast);
        
        // Trigger reflow for animation
        void toast.offsetWidth;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400); // Wait for transition
        }, 4000);
    }

    // --- RSS Feeds ---
    async function loadRssFeeds() {
        rssList.innerHTML = '<li style="color:var(--text-muted)">Loading...</li>';
        try {
            const res = await fetch('/api/rss?t=' + Date.now(), { cache: "no-store" });
            const data = await res.json();
            
            rssList.innerHTML = '';
            if (data.feeds.length === 0) {
                rssList.innerHTML = '<li style="color:var(--text-muted)">No RSS feeds added yet.</li>';
                return;
            }
            
            data.feeds.forEach(feed => {
                const li = document.createElement('li');
                li.style.display = 'flex';
                li.style.justifyContent = 'space-between';
                li.style.alignItems = 'center';
                li.style.padding = '0.75rem';
                li.style.backgroundColor = 'var(--bg-main)';
                li.style.borderRadius = '6px';
                li.style.border = '1px solid var(--border-color)';
                
                const kws = feed.keywords.length > 0 ? feed.keywords.join(', ') : 'All articles';
                
                li.innerHTML = `
                    <div style="display:flex; flex-direction:column; overflow:hidden; padding-right:1rem;">
                        <strong style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:0.25rem; font-size:0.95rem;">${feed.url}</strong>
                        <div style="font-size:0.8rem; color:var(--text-muted);">
                            <span style="color:var(--accent-color); font-weight:600;">#${feed.tag}</span> &middot; Keywords: ${kws}
                        </div>
                    </div>
                    <div style="display:flex; gap:0.5rem;">
                        <button class="btn secondary-btn fetch-rss-btn" data-url="${feed.url}" style="padding:0.4rem 0.8rem; font-size:0.8rem;">Fetch Now</button>
                        <button class="btn danger-btn delete-rss-btn" data-url="${feed.url}" style="padding:0.4rem 0.8rem; font-size:0.8rem;">Delete</button>
                    </div>
                `;
                rssList.appendChild(li);
            });
            
            // Bind fetch buttons
            document.querySelectorAll('.fetch-rss-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const url = e.target.getAttribute('data-url');
                    const originalText = e.target.textContent;
                    e.target.textContent = 'Fetching...';
                    e.target.disabled = true;
                    try {
                        const res = await fetch(`/api/rss/fetch?url=${encodeURIComponent(url)}`, { method: 'POST' });
                        const data = await res.json();
                        if (res.ok) {
                            showToast(data.message);
                            if (data.queued > 0) {
                                previousQueueCount = data.queued;
                                startQueuePolling();
                                setTimeout(loadTags, 2000);
                            }
                        } else {
                            alert(`Failed to fetch: ${data.detail}`);
                        }
                    } catch (err) {
                        console.error(err);
                    } finally {
                        e.target.textContent = originalText;
                        e.target.disabled = false;
                    }
                });
            });
            
            // Bind delete buttons
            document.querySelectorAll('.delete-rss-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const url = e.target.getAttribute('data-url');
                    if (confirm(`Delete RSS feed ${url}?`)) {
                        try {
                            const res = await fetch(`/api/rss?url=${encodeURIComponent(url)}`, { method: 'DELETE' });
                            if (res.ok) {
                                loadRssFeeds();
                                showToast('Feed deleted');
                            }
                        } catch (err) {
                            console.error(err);
                        }
                    }
                });
            });
            
        } catch (err) {
            console.error('Failed to load RSS feeds', err);
            rssList.innerHTML = '<li style="color:var(--error-text)">Failed to load feeds.</li>';
        }
    }
    
    addRssBtn.addEventListener('click', async () => {
        const url = rssUrlInput.value.trim();
        const tag = rssTagInput.value.trim();
        const keywordsRaw = rssKeywordsInput.value.trim();
        
        if (!url || !tag) {
            alert("URL and Tag are required.");
            return;
        }
        
        const keywords = keywordsRaw ? keywordsRaw.split(',').map(k => k.trim()).filter(k => k) : [];
        
        addRssBtn.disabled = true;
        addRssBtn.textContent = 'Adding...';
        
        try {
            const res = await fetch('/api/rss', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, tag, keywords })
            });
            
            if (res.ok) {
                rssUrlInput.value = '';
                rssTagInput.value = '';
                rssKeywordsInput.value = '';
                showToast('RSS feed added successfully');
                loadRssFeeds();
            } else {
                const data = await res.json();
                alert(`Failed to add feed: ${data.detail || 'Unknown error'}`);
            }
        } catch (err) {
            console.error(err);
            alert('Network error adding RSS feed.');
        } finally {
            addRssBtn.disabled = false;
            addRssBtn.textContent = 'Add Feed';
        }
    });

    // --- Queue Polling ---
    async function checkQueue() {
        try {
            const res = await fetch('/api/queue?t=' + Date.now(), { cache: "no-store" });
            const data = await res.json();
            
            let favicon = document.querySelector("link[rel~='icon']");
            if (!favicon) {
                favicon = document.createElement('link');
                favicon.rel = 'icon';
                document.head.appendChild(favicon);
            }
            
            if (data.remaining > 0) {
                queueStatus.classList.remove('hidden');
                queueText.textContent = `Queue: ${data.remaining} item${data.remaining !== 1 ? 's' : ''}`;
                document.title = `(${data.remaining}) LocalScrape`;
                favicon.href = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%23ef4444'/%3E%3Ccircle cx='50' cy='50' r='30' fill='%23ffffff'/%3E%3C/svg%3E";
            } else {
                queueStatus.classList.add('hidden');
                document.title = 'LocalScrape Dashboard';
                favicon.href = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%230f172a'/%3E%3Cpath d='M25 20h50v60H25z' fill='none' stroke='%233b82f6' stroke-width='4' rx='3'/%3E%3Cpath d='M35 35h30M35 47h30M35 59h20' stroke='%2360a5fa' stroke-width='3' stroke-linecap='round'/%3E%3Cpath d='M65 65l10 10' stroke='%2300ff88' stroke-width='4' stroke-linecap='round'/%3E%3C/svg%3E";
                
                // Show toast if queue just finished
                if (previousQueueCount > 0) {
                    showToast('✅ Scrape Complete!');
                    loadTags(); // Automatically refresh UI
                    loadStorage(); // Refresh storage counter
                }
                
                stopQueuePolling();
            }
            previousQueueCount = data.remaining;
        } catch (err) {
            console.error('Failed to check queue:', err);
        }
    }

    function startQueuePolling() {
        if (!pollInterval) {
            checkQueue(); // check immediately
            pollInterval = setInterval(checkQueue, 3000); // then every 3s
        }
    }

    function stopQueuePolling() {
        if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
        }
    }

    // --- Activity Monitor ---
    async function loadActivityMonitor() {
        failedList.innerHTML = '<li style="color:var(--text-muted)">Loading failed jobs...</li>';
        completedList.innerHTML = '<li style="color:var(--text-muted)">Loading completed jobs...</li>';
        logsContent.textContent = 'Loading logs...';
        
        try {
            // Load logs
            const logRes = await fetch('/api/logs?t=' + Date.now(), { cache: 'no-store' });
            const logData = await logRes.json();
            if (logData.logs && logData.logs.length > 0) {
                logsContent.textContent = logData.logs.join('');
            } else {
                logsContent.textContent = 'No logs available.';
            }
            logsContent.scrollTop = logsContent.scrollHeight;
            
            // Load activity
            const res = await fetch('/api/activity?t=' + Date.now(), { cache: 'no-store' });
            const data = await res.json();
            
            failedList.innerHTML = '';
            completedList.innerHTML = '';
            
            if (!data.failed || data.failed.length === 0) {
                failedList.innerHTML = '<li style="color:var(--text-muted)">No failed jobs. 🎉</li>';
            } else {
                data.failed.forEach(item => {
                    const li = document.createElement('li');
                    li.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:0.75rem; background:var(--bg-main); border-radius:6px; border:1px solid var(--border-color);';
                    
                    const strikes = item.attempts || 0;
                    const maxedOut = strikes >= 3;
                    const strikeLabel = maxedOut 
                        ? '<span style="color:#ff4444; font-weight:600;">⛔ 3/3 strikes</span>'
                        : `<span style="color:var(--text-muted);">${strikes}/3 strikes</span>`;
                    
                    li.innerHTML = `
                        <div style="display:flex; flex-direction:column; overflow:hidden; padding-right:1rem;">
                            <strong style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:0.25rem; font-size:0.9rem;">${item.url}</strong>
                            <div style="font-size:0.8rem; color:var(--text-muted);">
                                ${strikeLabel} · ${item.reason || 'Unknown error'}
                            </div>
                        </div>
                        <div style="display:flex; gap: 0.5rem; flex-shrink: 0;">
                            <button class="btn ${maxedOut ? 'secondary-btn' : 'primary-btn'} retry-failed-btn" 
                                data-url="${item.url}" 
                                ${maxedOut ? 'disabled title="Max retries reached"' : ''}
                                style="padding:0.4rem 0.8rem; font-size:0.8rem; white-space:nowrap;">
                                ${maxedOut ? 'Max Retries' : 'Retry'}
                            </button>
                            <button class="btn danger-btn delete-failed-btn" data-url="${item.url}" style="padding:0.4rem 0.8rem; font-size:0.8rem; white-space:nowrap;">Delete</button>
                        </div>
                    `;
                    failedList.appendChild(li);
                });
            }
            
            if (!data.completed || data.completed.length === 0) {
                completedList.innerHTML = '<li style="color:var(--text-muted)">No completed jobs recorded yet.</li>';
            } else {
                // sort completed by timestamp newest first
                data.completed.sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0));
                data.completed.forEach(item => {
                    const li = document.createElement('li');
                    li.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:0.75rem; background:var(--bg-main); border-radius:6px; border:1px solid var(--border-color);';
                    
                    const dateStr = item.date_str ? new Date(item.date_str).toLocaleString() : 'Unknown date';
                    li.innerHTML = `
                        <div style="display:flex; flex-direction:column; overflow:hidden; padding-right:1rem;">
                            <strong style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:0.25rem; font-size:0.9rem;">${item.url}</strong>
                            <div style="font-size:0.8rem; color:var(--text-muted);">
                                <span style="color:var(--success-text);">✓ Success</span> · Tag: ${item.tag} · ${dateStr}
                            </div>
                        </div>
                        <div style="display:flex; gap: 0.5rem; flex-shrink: 0;">
                            <button class="btn danger-btn delete-completed-btn" data-url="${item.url}" style="padding:0.4rem 0.8rem; font-size:0.8rem; white-space:nowrap;">Delete</button>
                        </div>
                    `;
                    completedList.appendChild(li);
                });
            }
            
            // Bind retry buttons
            document.querySelectorAll('.retry-failed-btn:not([disabled])').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const url = e.target.getAttribute('data-url');
                    e.target.textContent = 'Retrying...';
                    e.target.disabled = true;
                    try {
                        const res = await fetch('/api/failed/retry', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ urls: [url] })
                        });
                        if (res.ok) {
                            showToast('Retrying failed job...');
                            previousQueueCount = 1;
                            startQueuePolling();
                            loadActivityMonitor();
                        } else {
                            const data = await res.json();
                            alert(`Failed: ${data.detail}`);
                        }
                    } catch (err) {
                        console.error(err);
                    } finally {
                        e.target.textContent = 'Retry';
                        e.target.disabled = false;
                    }
                });
            });

            // Bind delete failed buttons
            document.querySelectorAll('.delete-failed-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const url = e.target.getAttribute('data-url');
                    const safeUrl = encodeURIComponent(url);
                    try {
                        const res = await fetch(`/api/activity/failed?url=${safeUrl}`, { method: 'DELETE' });
                        if (res.ok) {
                            e.target.closest('li').remove();
                            showToast('Failed job removed');
                            if (failedList.children.length === 0) {
                                failedList.innerHTML = '<li style="color:var(--text-muted)">No failed jobs. 🎉</li>';
                            }
                        }
                    } catch (err) {
                        console.error(err);
                    }
                });
            });
            
            // Bind delete completed buttons
            document.querySelectorAll('.delete-completed-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const url = e.target.getAttribute('data-url');
                    const safeUrl = encodeURIComponent(url);
                    try {
                        const res = await fetch(`/api/activity/completed?url=${safeUrl}`, { method: 'DELETE' });
                        if (res.ok) {
                            e.target.closest('li').remove();
                            showToast('Completed job record removed');
                            if (completedList.children.length === 0) {
                                completedList.innerHTML = '<li style="color:var(--text-muted)">No completed jobs recorded yet.</li>';
                            }
                        }
                    } catch (err) {
                        console.error(err);
                    }
                });
            });
            
        } catch (err) {
            failedList.innerHTML = '<li style="color:var(--text-muted)">Failed to load.</li>';
            completedList.innerHTML = '<li style="color:var(--text-muted)">Failed to load.</li>';
        }
    }
    
    refreshActivityBtn.addEventListener('click', loadActivityMonitor);

    if (clearFailedBtn) {
        clearFailedBtn.addEventListener('click', async () => {
            if (confirm("Clear all failed jobs?")) {
                try {
                    await fetch('/api/activity/failed/all', { method: 'DELETE' });
                    loadActivityMonitor();
                } catch (e) {
                    console.error(e);
                }
            }
        });
    }

    if (clearCompletedBtn) {
        clearCompletedBtn.addEventListener('click', async () => {
            if (confirm("Clear all completed jobs?")) {
                try {
                    await fetch('/api/activity/completed/all', { method: 'DELETE' });
                    loadActivityMonitor();
                } catch (e) {
                    console.error(e);
                }
            }
        });
    }

    // --- Info Tabs ---
    const analysisTableBody = document.getElementById('analysis-table-body');
    async function loadAnalysisTable() {
        if (!analysisTableBody) return;
        analysisTableBody.innerHTML = '<tr><td colspan="5" style="padding:1rem;">Loading analysis...</td></tr>';
        try {
            const res = await fetch('/api/analysis?t=' + Date.now(), { cache: "no-store" });
            const data = await res.json();
            analysisTableBody.innerHTML = '';
            if (data.analysis.length === 0) {
                analysisTableBody.innerHTML = '<tr><td colspan="5" style="padding:1rem;">No data available.</td></tr>';
                return;
            }
            data.analysis.forEach(item => {
                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid var(--border-color)';
                tr.innerHTML = `
                    <td style="padding:0.75rem;">${item.tag}</td>
                    <td style="padding:0.75rem;">${item.total_assets}</td>
                    <td style="padding:0.75rem;">${item.total_read}</td>
                    <td style="padding:0.75rem;">${item.total_pending}</td>
                    <td style="padding:0.75rem;">${item.size_mb} MB</td>
                `;
                analysisTableBody.appendChild(tr);
            });
        } catch (e) {
            analysisTableBody.innerHTML = '<tr><td colspan="5" style="padding:1rem;color:var(--error-text);">Failed to load analysis.</td></tr>';
        }
    }

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Remove active from all buttons
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            // Add active to clicked button
            e.target.classList.add('active');
            
            // Hide all tab contents
            document.querySelectorAll('.tab-content').forEach(tc => tc.classList.add('hidden'));
            
            // Show target tab content
            const targetId = 'tab-' + e.target.getAttribute('data-tab');
            const targetEl = document.getElementById(targetId);
            if (targetEl) {
                targetEl.classList.remove('hidden');
                if (targetId === 'tab-data-analysis') {
                    loadAnalysisTable();
                }
            }
        });
    });

    // --- Mobile Menu ---
    mobileMenuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        sidebarBackdrop.classList.toggle('show');
    });

    // Close sidebar when clicking outside on mobile
    sidebarBackdrop.addEventListener('click', () => {
        sidebar.classList.remove('open');
        sidebarBackdrop.classList.remove('show');
    });

    // --- Storage Counter ---
    async function loadStorage() {
        try {
            const res = await fetch('/api/system/stats?t=' + Date.now(), { cache: 'no-store' });
            const data = await res.json();
            storageText.textContent = data.total_size_human;
            
            // Storage Warning Threshold (> 500MB)
            const storageBadge = document.getElementById('storage-badge');
            if (data.total_size_bytes > 500 * 1024 * 1024) {
                storageBadge.style.color = 'var(--error-text)';
                storageBadge.style.backgroundColor = 'var(--error-bg)';
            } else {
                storageBadge.style.color = '';
                storageBadge.style.backgroundColor = '';
            }
        } catch (err) {
            storageText.textContent = '--';
        }
    }
    
    // --- Instant Search ---
    if (librarySearch) {
        librarySearch.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            document.querySelectorAll('.tag-tile').forEach(tile => {
                const name = tile.querySelector('.tag-tile-name').textContent.toLowerCase();
                tile.style.display = name.includes(query) ? '' : 'none';
            });
        });
    }

    if (tagSearch) {
        tagSearch.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            document.querySelectorAll('.article-card').forEach(card => {
                const name = card.querySelector('.article-card-name').textContent.toLowerCase();
                card.style.display = name.includes(query) ? '' : 'none';
            });
        });
    }

    // --- Download Article ---
    if (downloadArticleBtn) {
        downloadArticleBtn.addEventListener('click', () => {
            if (!currentArticleFilename || !currentArticleRaw) return;
            const blob = new Blob([currentArticleRaw], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = currentArticleFilename.endsWith('.md') ? currentArticleFilename : currentArticleFilename + '.md';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }

    if (focusModeBtn) {
        focusModeBtn.addEventListener('click', () => {
            isFocusMode = !isFocusMode;
            if (isFocusMode) {
                document.body.classList.add('focus-mode');
                focusModeBtn.style.color = 'var(--accent-color)';
            } else {
                document.body.classList.remove('focus-mode');
                focusModeBtn.style.color = '';
            }
        });
    }

    if (exitFocusBtn) {
        exitFocusBtn.addEventListener('click', () => {
            isFocusMode = false;
            document.body.classList.remove('focus-mode');
            focusModeBtn.style.color = '';
        });
    }

    if (readerMenuBtn && readerMenuDropdown) {
        readerMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            readerMenuDropdown.classList.toggle('hidden');
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!readerMenuDropdown.classList.contains('hidden') && !e.target.closest('.reader-dropdown')) {
                readerMenuDropdown.classList.add('hidden');
            }
        });
    }

    if (nextArticleBtn) {
        nextArticleBtn.addEventListener('click', () => {
            if (!currentArticleQueue.length || !currentArticleFilename || !currentArticleTag) return;
            const currentIndex = currentArticleQueue.findIndex(a => a.filename === currentArticleFilename && a.tag === currentArticleTag);
            if (currentIndex >= 0 && currentIndex < currentArticleQueue.length - 1) {
                const next = currentArticleQueue[currentIndex + 1];
                openArticle(next.tag, next.filename);
            } else {
                showToast("You've reached the end of the list.");
            }
        });
    }

    if (nextArticleMainBtn) {
        nextArticleMainBtn.addEventListener('click', () => {
            if (nextArticleBtn) {
                nextArticleBtn.click();
            }
        });
    }
    
    if (ttsListenBtn) {
        if (ttsSpeed && ttsSpeedLabel) {
            ttsSpeed.addEventListener('input', () => {
                ttsSpeedLabel.textContent = parseFloat(ttsSpeed.value).toFixed(1) + 'x';
            });
            ttsSpeed.addEventListener('change', () => {
                if (isSpeaking) {
                    showToast("Stop and Restart reading to apply new speed");
                }
            });
        }
        
        ttsListenBtn.addEventListener('click', () => {
            if (isSpeaking) {
                window.speechSynthesis.cancel();
                isSpeaking = false;
                ttsListenBtn.textContent = '🎧 Listen';
                ttsListenBtn.style.color = '';
                if (ttsControls) ttsControls.classList.add('hidden');
            } else {
                if (!markdownContent.innerText) return;
                const utterance = new SpeechSynthesisUtterance(markdownContent.innerText);
                if (ttsSpeed) {
                    utterance.rate = parseFloat(ttsSpeed.value);
                }
                utterance.onend = () => {
                    isSpeaking = false;
                    ttsListenBtn.textContent = '🎧 Listen';
                    ttsListenBtn.style.color = '';
                    if (ttsControls) ttsControls.classList.add('hidden');
                };
                window.speechSynthesis.speak(utterance);
                isSpeaking = true;
                ttsListenBtn.textContent = '⏹ Stop';
                ttsListenBtn.style.color = 'var(--error-text)';
                if (ttsControls) ttsControls.classList.remove('hidden');
            }
        });
    }
    
    if (navBackupBtn) {
        navBackupBtn.addEventListener('click', () => {
            showToast('Generating backup zip...');
            window.location.href = '/api/backup';
        });
    }

    if (favoriteArticleBtn) {
        favoriteArticleBtn.addEventListener('click', async () => {
            if (!currentArticleTag || !currentArticleFilename) return;
            const path = currentArticleTag + '/' + currentArticleFilename;
            const isFav = favoritesList.includes(path);
            
            try {
                const res = await fetch('/api/favorites', {
                    method: isFav ? 'DELETE' : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ path })
                });
                if (res.ok) {
                    const data = await res.json();
                    favoritesList = data.favorites;
                    if (!isFav) {
                        favoriteArticleBtn.style.color = 'gold';
                        showToast('Added to favorites');
                    } else {
                        favoriteArticleBtn.style.color = '';
                        showToast('Removed from favorites');
                    }
                    loadTags(); // refresh count
                }
            } catch (err) {}
        });
    }

    // --- Bionic Reading Mode ---
    let isBionicActive = false;
    if (bionicModeBtn) {
        bionicModeBtn.addEventListener('click', () => {
            if (!currentArticleRaw) return;
            isBionicActive = !isBionicActive;
            if (isBionicActive) {
                bionicModeBtn.style.color = 'var(--accent-color)';
                const words = markdownContent.innerHTML.split(/(<[^>]+>|\s+)/);
                for (let i = 0; i < words.length; i++) {
                    const word = words[i];
                    // Avoid modifying HTML tags or pure whitespace
                    if (word && !word.startsWith('<') && word.trim().length > 0) {
                        const mid = Math.ceil(word.length / 2);
                        words[i] = `<b>${word.slice(0, mid)}</b>${word.slice(mid)}`;
                    }
                }
                markdownContent.innerHTML = words.join('');
            } else {
                bionicModeBtn.style.color = '';
                markdownContent.innerHTML = marked.parse(currentArticleRaw);
            }
        });
    }

    // --- Teleprompter Mode Auto-Scroll ---
    let teleprompterActive = false;
    let teleprompterFrame = null;
    if (teleprompterBtn) {
        teleprompterBtn.addEventListener('click', () => {
            if (teleprompterControls.classList.contains('hidden')) {
                teleprompterControls.classList.remove('hidden');
                teleprompterBtn.style.color = 'var(--accent-color)';
            } else {
                teleprompterControls.classList.add('hidden');
                teleprompterBtn.style.color = '';
                cancelAnimationFrame(teleprompterFrame);
                teleprompterActive = false;
                teleprompterPlayBtn.textContent = '▶️';
            }
        });
        
        teleprompterPlayBtn.addEventListener('click', () => {
            teleprompterActive = !teleprompterActive;
            teleprompterPlayBtn.textContent = teleprompterActive ? '⏸️' : '▶️';
            if (teleprompterActive) {
                function scrollStep() {
                    if (!teleprompterActive) return;
                    const speed = parseInt(teleprompterSpeed.value, 10);
                    // scroll by a fraction for smoothness
                    window.scrollBy(0, speed / 2);
                    teleprompterFrame = requestAnimationFrame(scrollStep);
                }
                teleprompterFrame = requestAnimationFrame(scrollStep);
            } else {
                cancelAnimationFrame(teleprompterFrame);
            }
        });
    }

    // --- Service Worker ---
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/static/sw.js').catch(err => {
                console.log('SW registration failed: ', err);
            });
        });
    }

    // --- Web Share Target Interceptor ---
    function handleSharedURLs() {
        const urlParams = new URLSearchParams(window.location.search);
        const sharedUrl = urlParams.get('url') || urlParams.get('text');

        if (sharedUrl && sharedUrl.startsWith('http')) {
            if (navDashboardBtn) navDashboardBtn.click(); 
            if (urlsInput) urlsInput.value = sharedUrl;
            window.history.replaceState({}, document.title, "/");
            showToast("🔗 URL caught from share sheet!");
        }
    }

    // --- Swipe Gestures in Reader ---
    let touchstartX = 0;
    let touchstartY = 0;
    let touchendX = 0;
    let touchendY = 0;
    const swipeThreshold = 50;

    readerView.addEventListener('touchstart', e => {
        touchstartX = e.changedTouches[0].screenX;
        touchstartY = e.changedTouches[0].screenY;
    }, {passive: true});

    readerView.addEventListener('touchend', e => {
        touchendX = e.changedTouches[0].screenX;
        touchendY = e.changedTouches[0].screenY;
        handleSwipe();
    }, {passive: true});

    function handleSwipe() {
        if (Math.abs(touchendY - touchstartY) > Math.abs(touchendX - touchstartX)) {
            // Primarily vertical scrolling, ignore horizontal swipe
            return;
        }

        if (touchendX < touchstartX - swipeThreshold) {
            // Swiped left -> Next article
            if (nextArticleBtn) nextArticleBtn.click();
        } else if (touchendX > touchstartX + swipeThreshold) {
            // Swiped right -> Back to library
            if (closeReaderBtn) closeReaderBtn.click();
        }
    }

    // --- Offline Detection ---
    const offlinePill = document.getElementById('offline-pill');
    function updateOnlineStatus() {
        if (offlinePill) {
            if (navigator.onLine) {
                offlinePill.classList.add('hidden');
            } else {
                offlinePill.classList.remove('hidden');
                showToast("You are offline.");
            }
        }
    }
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    async function loadReadStates() {
        try {
            const res = await fetch('/api/read-state');
            readStates = await res.json();
        } catch (e) {
            readStates = {};
        }
    }

    // --- Batch Actions ---
    let selectedArticles = new Set();
    function updateBatchPanel() {
        if (!batchPanel) return;
        if (selectedArticles.size > 0) {
            batchPanel.classList.remove('hidden');
            batchCount.textContent = `${selectedArticles.size} selected`;
        } else {
            batchPanel.classList.add('hidden');
        }
    }

    if (batchCancelBtn) {
        batchCancelBtn.addEventListener('click', () => {
            selectedArticles.clear();
            updateBatchPanel();
            if (currentArticleTag) {
                loadArticles(currentArticleTag, tagArticlesList);
            } else {
                openFavoritesView();
            }
        });
    }

    if (batchReadBtn) {
        batchReadBtn.addEventListener('click', async () => {
            for (let path of selectedArticles) {
                await fetch('/api/read-state', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ path: path, read: true })
                });
            }
            await loadReadStates();
            selectedArticles.clear();
            updateBatchPanel();
            if (currentArticleTag) loadArticles(currentArticleTag, tagArticlesList);
            else openFavoritesView();
        });
    }

    if (batchUnreadBtn) {
        batchUnreadBtn.addEventListener('click', async () => {
            for (let path of selectedArticles) {
                await fetch('/api/read-state', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ path: path, read: false })
                });
            }
            await loadReadStates();
            selectedArticles.clear();
            updateBatchPanel();
            if (currentArticleTag) loadArticles(currentArticleTag, tagArticlesList);
            else openFavoritesView();
        });
    }
    
    if (batchDeleteBtn) {
        batchDeleteBtn.addEventListener('click', async () => {
            if (confirm(`Delete ${selectedArticles.size} selected articles?`)) {
                for (let path of selectedArticles) {
                    const [tag, fname] = path.split('/');
                    await fetch(`/api/articles/${tag}/${fname}`, { method: 'DELETE' });
                }
                showToast(`Deleted ${selectedArticles.size} articles.`);
                selectedArticles.clear();
                updateBatchPanel();
                if (currentArticleTag) loadArticles(currentArticleTag, tagArticlesList);
                else openFavoritesView();
            }
        });
    }

    if (batchMegathreadBtn) {
        batchMegathreadBtn.addEventListener('click', async () => {
            const title = prompt("Enter a title for your Megathread:", "Compiled Megathread");
            if (!title) return;
            
            const targetTag = prompt("Which tag should this Megathread belong to?", currentArticleTag || "mixed");
            if (!targetTag) return;
            
            try {
                const res = await fetch('/api/megathread', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        files: Array.from(selectedArticles),
                        tag: targetTag,
                        title: title
                    })
                });
                
                if (res.ok) {
                    showToast("🧵 Megathread created successfully!");
                    selectedArticles.clear();
                    updateBatchPanel();
                    if (currentArticleTag) loadArticles(currentArticleTag, tagArticlesList);
                    else switchView('library');
                    loadTags(); // refresh library grid
                } else {
                    const err = await res.json();
                    showToast("Failed to create megathread: " + err.detail);
                }
            } catch (err) {
                showToast("Network error creating megathread.");
            }
        });
    }

    // --- Settings UI Logic ---
    async function loadSettings() {
        try {
            const res = await fetch('/api/settings');
            if (res.ok) {
                const data = await res.json();
                // AI settings removed
                document.getElementById('setting-rss-polling').value = data.rss_polling_interval || 2;
                document.getElementById('setting-rss-retention').value = data.rss_retention_days || 5;
                document.getElementById('setting-log-retention').value = data.log_retention_days || 10;
                document.getElementById('setting-theme').value = data.default_theme || 'dark';
                document.getElementById('setting-typography').value = data.typography || 'sans-serif';
                
                const fontSize = data.base_font_size || 16;
                document.getElementById('setting-font-size').value = fontSize;
                document.getElementById('setting-font-size-val').textContent = fontSize;
                
                const ttsSpeed = data.tts_default_speed || 1.0;
                document.getElementById('setting-tts-speed').value = ttsSpeed;
                document.getElementById('setting-tts-speed-val').textContent = ttsSpeed;
                
                document.getElementById('setting-global-cookies').value = data.global_cookies || '';

                populateVoiceList(data.tts_preferred_voice);
                applySettingsToDOM(data);
            }
        } catch (e) {
            console.error('Failed to load settings:', e);
        }
    }

    function populateVoiceList(preferredVoice) {
        const voiceSelect = document.getElementById('setting-tts-voice');
        if (!voiceSelect) return;
        const voices = window.speechSynthesis.getVoices();
        voiceSelect.innerHTML = '<option value="">System Default</option>';
        voices.forEach(voice => {
            const option = document.createElement('option');
            option.value = voice.name;
            option.textContent = `${voice.name} (${voice.lang})`;
            if (preferredVoice && voice.name === preferredVoice) option.selected = true;
            voiceSelect.appendChild(option);
        });
    }

    if (window.speechSynthesis && window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
            const voiceSelect = document.getElementById('setting-tts-voice');
            if (voiceSelect) {
                populateVoiceList(voiceSelect.value);
            }
        };
    }

    const saveSettingsBtn = document.getElementById('save-settings-btn');
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', async () => {
            const payload = {
                // AI settings removed
                rss_polling_interval: parseInt(document.getElementById('setting-rss-polling').value) || 2,
                rss_retention_days: parseInt(document.getElementById('setting-rss-retention').value) || 5,
                log_retention_days: parseInt(document.getElementById('setting-log-retention').value) || 10,
                default_theme: document.getElementById('setting-theme').value,
                typography: document.getElementById('setting-typography').value,
                base_font_size: parseInt(document.getElementById('setting-font-size').value) || 16,
                tts_default_speed: parseFloat(document.getElementById('setting-tts-speed').value) || 1.0,
                tts_preferred_voice: document.getElementById('setting-tts-voice').value,
                global_cookies: document.getElementById('setting-global-cookies').value
            };

            try {
                const res = await fetch('/api/settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (res.ok) {
                    showToast('Settings saved successfully!');
                    applySettingsToDOM(payload);
                } else {
                    showToast('Failed to save settings', true);
                }
            } catch (e) {
                showToast('Error saving settings', true);
            }
        });
    }

    function applySettingsToDOM(settings) {
        document.documentElement.setAttribute('data-theme', settings.default_theme);
        if (settings.typography === 'serif') {
            document.body.style.fontFamily = 'Georgia, serif';
        } else {
            document.body.style.fontFamily = "'Inter', sans-serif";
        }
        document.documentElement.style.fontSize = settings.base_font_size + 'px';
    }

    const fontSizeInput = document.getElementById('setting-font-size');
    if (fontSizeInput) {
        fontSizeInput.addEventListener('input', (e) => {
            document.getElementById('setting-font-size-val').textContent = e.target.value;
            // Real-time preview
            document.documentElement.style.fontSize = e.target.value + 'px';
        });
    }

    const themeSelect = document.getElementById('setting-theme');
    if (themeSelect) {
        themeSelect.addEventListener('change', (e) => {
            document.documentElement.setAttribute('data-theme', e.target.value);
        });
    }

    const typoSelect = document.getElementById('setting-typography');
    if (typoSelect) {
        typoSelect.addEventListener('change', (e) => {
            if (e.target.value === 'serif') document.body.style.fontFamily = 'Georgia, serif';
            else document.body.style.fontFamily = "'Inter', sans-serif";
        });
    }

    const ttsSpeedInput = document.getElementById('setting-tts-speed');
    if (ttsSpeedInput) {
        ttsSpeedInput.addEventListener('input', (e) => {
            document.getElementById('setting-tts-speed-val').textContent = e.target.value;
        });
    }

    // Load initial settings on boot to apply theme/typography globally immediately
    fetch('/api/settings').then(res => res.json()).then(data => applySettingsToDOM(data)).catch(() => {});

    // --- Initialization ---
    updateOnlineStatus();
    handleSharedURLs();
    switchView('library');
    loadFavorites().then(() => {
        loadReadStates().then(() => {
            loadTags();
        });
    });
    loadStorage();
    checkQueue(); // Check if anything is pending on initial load
});
