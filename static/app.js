// --- Splash Screen ---
document.addEventListener('DOMContentLoaded', () => {
    const splashScreen = document.getElementById('splash-screen');
    const splashBtn = document.getElementById('splash-enter-btn');
    const appLayout = document.getElementById('app-layout');

    if (splashBtn && splashScreen && appLayout) {
        splashBtn.addEventListener('click', () => {
            splashScreen.classList.add('fade-out');
            // After the CSS transition ends, remove splash and show app
            setTimeout(() => {
                splashScreen.style.display = 'none';
                appLayout.classList.remove('hidden');
            }, 600);
        });
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
    
    const navDashboardBtn = document.getElementById('nav-dashboard-btn');
    const navRssBtn = document.getElementById('nav-rss-btn');
    const navFailedBtn = document.getElementById('nav-failed-btn');
    const navLogsBtn = document.getElementById('nav-logs-btn');
    const navInfoBtn = document.getElementById('nav-info-btn');
    
    const logsView = document.getElementById('logs-view');
    const infoView = document.getElementById('info-view');
    const rssView = document.getElementById('rss-view');
    const rssUrlInput = document.getElementById('rss-url-input');
    const rssTagInput = document.getElementById('rss-tag-input');
    const rssKeywordsInput = document.getElementById('rss-keywords-input');
    const addRssBtn = document.getElementById('add-rss-btn');
    const rssList = document.getElementById('rss-list');
    
    const failedJobsView = document.getElementById('failed-jobs-view');
    const failedList = document.getElementById('failed-list');
    const emptyStateView = document.getElementById('empty-state-view');
    
    const emptyStateDashboardBtn = document.getElementById('empty-state-dashboard-btn');
    const refreshLogsBtn = document.getElementById('refresh-logs-btn');
    const logsContent = document.getElementById('logs-content');
    
    const renameArticleBtn = document.getElementById('rename-article-btn');
    const deleteArticleBtn = document.getElementById('delete-article-btn');
    const endOfArticle = document.getElementById('end-of-article');
    const endDeleteBtn = document.getElementById('end-delete-btn');
    
    const storageText = document.getElementById('storage-text');
    
    const tagDatalist = document.getElementById('tag-datalist');
    const toastContainer = document.getElementById('toast-container');
    const sidebarResizer = document.getElementById('sidebar-resizer');

    let currentArticleTag = null;
    let currentArticleFilename = null;

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
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    }

    function updateThemeIcon(theme) {
        themeIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
    }

    themeToggleBtn.addEventListener('click', toggleTheme);
    initTheme();

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

        if (tags.length === 0) {
            tagsList.innerHTML = '<li class="tag-item"><span class="tag-header">No tags found</span></li>';
            return;
        }

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
                            switchView('dashboard');
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
                            switchView('dashboard');
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
                switchView('empty-state');
                return;
            }

            data.articles.forEach(article => {
                const li = document.createElement('li');
                li.className = 'article-item';
                li.textContent = article.replace('.md', '');
                li.title = article;
                
                li.addEventListener('click', (e) => {
                    // Highlight active
                    document.querySelectorAll('.article-item.active').forEach(el => el.classList.remove('active'));
                    li.classList.add('active');
                    openArticle(tag, article);
                    
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
        controlCard.classList.add('hidden');
        readerView.classList.add('hidden');
        logsView.classList.add('hidden');
        infoView.classList.add('hidden');
        rssView.classList.add('hidden');
        failedJobsView.classList.add('hidden');
        emptyStateView.classList.add('hidden');
        readerControls.classList.add('hidden');

        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

        if (viewName === 'dashboard') {
            controlCard.classList.remove('hidden');
            navDashboardBtn.classList.add('active');
        } else if (viewName === 'rss') {
            rssView.classList.remove('hidden');
            navRssBtn.classList.add('active');
            loadRssFeeds();
        } else if (viewName === 'failed') {
            failedJobsView.classList.remove('hidden');
            navFailedBtn.classList.add('active');
            loadFailedJobs();
        } else if (viewName === 'logs') {
            logsView.classList.remove('hidden');
            navLogsBtn.classList.add('active');
            loadLogs();
        } else if (viewName === 'info') {
            infoView.classList.remove('hidden');
            navInfoBtn.classList.add('active');
        } else if (viewName === 'reader') {
            readerView.classList.remove('hidden');
            readerControls.classList.remove('hidden');
            // don't mark any nav-btn active so dashboard is deselected
        } else if (viewName === 'empty-state') {
            emptyStateView.classList.remove('hidden');
        }
        
        // Close mobile sidebar if open
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('open');
            sidebarBackdrop.classList.remove('show');
        }
    }

    navDashboardBtn.addEventListener('click', () => switchView('dashboard'));
    navRssBtn.addEventListener('click', () => switchView('rss'));
    navFailedBtn.addEventListener('click', () => switchView('failed'));
    navLogsBtn.addEventListener('click', () => switchView('logs'));
    navInfoBtn.addEventListener('click', () => switchView('info'));
    
    emptyStateDashboardBtn.addEventListener('click', () => switchView('dashboard'));

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
            
            const { meta, body } = stripFrontMatter(markdownText);
            
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
            
            // Scroll detection: show delete prompt when near the bottom
            const scrollContainer = readerView.closest('.content-scrollable');
            if (scrollContainer) {
                const onScroll = () => {
                    const scrollBottom = scrollContainer.scrollTop + scrollContainer.clientHeight;
                    const totalHeight = scrollContainer.scrollHeight;
                    if (scrollBottom >= totalHeight - 100) {
                        endOfArticle.classList.remove('hidden');
                        scrollContainer.removeEventListener('scroll', onScroll);
                    }
                };
                scrollContainer.addEventListener('scroll', onScroll);
            }
        } catch (err) {
            console.error('Failed to load article content:', err);
            markdownContent.innerHTML = `<p style="color: var(--error-text)">Error loading article content.</p>`;
        }
    }

    closeReaderBtn.addEventListener('click', () => {
        switchView('dashboard');
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
                switchView('dashboard');
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
                    switchView('dashboard');
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
            
            if (data.remaining > 0) {
                queueStatus.classList.remove('hidden');
                queueText.textContent = `Queue: ${data.remaining} item${data.remaining !== 1 ? 's' : ''}`;
            } else {
                queueStatus.classList.add('hidden');
                
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

    // --- Logs ---
    async function loadLogs() {
        logsContent.textContent = 'Loading logs...';
        try {
            const res = await fetch('/api/logs');
            const data = await res.json();
            if (data.logs && data.logs.length > 0) {
                logsContent.textContent = data.logs.join('');
            } else {
                logsContent.textContent = 'No logs available.';
            }
            logsContent.scrollTop = logsContent.scrollHeight;
        } catch (err) {
            logsContent.textContent = 'Failed to load logs.';
        }
    }
    
    refreshLogsBtn.addEventListener('click', loadLogs);

    // --- Info Tabs ---
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
            document.getElementById(targetId).classList.remove('hidden');
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
        } catch (err) {
            storageText.textContent = '--';
        }
    }

    // --- Failed Jobs ---
    async function loadFailedJobs() {
        failedList.innerHTML = '<li style="color:var(--text-muted)">Loading...</li>';
        try {
            const res = await fetch('/api/failed?t=' + Date.now(), { cache: 'no-store' });
            const data = await res.json();
            
            failedList.innerHTML = '';
            if (!data.jobs || data.jobs.length === 0) {
                failedList.innerHTML = '<li style="color:var(--text-muted)">No failed jobs. 🎉</li>';
                return;
            }
            
            data.jobs.forEach(item => {
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
                    <button class="btn ${maxedOut ? 'secondary-btn' : 'primary-btn'} retry-failed-btn" 
                        data-url="${item.url}" 
                        ${maxedOut ? 'disabled title="Max retries reached"' : ''}
                        style="padding:0.4rem 0.8rem; font-size:0.8rem; white-space:nowrap;">
                        ${maxedOut ? 'Max Retries' : 'Retry'}
                    </button>
                `;
                failedList.appendChild(li);
            });
            
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
                            loadFailedJobs();
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
        } catch (err) {
            failedList.innerHTML = '<li style="color:var(--text-muted)">Failed to load.</li>';
        }
    }

    // --- Initialization ---
    loadTags();
    loadStorage();
    checkQueue(); // Check if anything is pending on initial load
});
