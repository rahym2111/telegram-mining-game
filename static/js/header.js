document.addEventListener('DOMContentLoaded', () => {
    // Theme toggle based on system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
        document.body.classList.remove('light-mode');
        document.body.classList.add('dark-mode');
    }

    // Initialize Telegram WebApp
    const telegram = window.Telegram ? window.Telegram.WebApp : null;
    if (telegram) {
        telegram.ready();
    } else {
        console.error('Telegram WebApp not available');
        alert('Please open this app in Telegram');
        return;
    }

    // Authenticate user and fetch initial data
    const initData = telegram.initData || '';
    const userData = telegram.initDataUnsafe.user || {};
    fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `init_data=${encodeURIComponent(initData)}&user=${encodeURIComponent(JSON.stringify(userData))}`
    })
    .then(response => {
        if (!response.ok) throw new Error('Authentication failed');
        return response.json();
    })
    .then(data => {
        if (data.error) {
            console.error('Auth error:', data.error);
            alert(data.error);
            return;
        }
        document.getElementById('username').textContent = data.username || 'User';
        document.getElementById('coin-balance').textContent = `${data.coins || 0} Coins`;
    })
    .catch(error => {
        console.error('Auth fetch error:', error);
        alert('Failed to connect to server');
    });

    // Load saved language or default to Turkmen
    const savedLang = localStorage.getItem('language') || 'tk';
    const languageMap = { 'en': 'English', 'tk': 'Türkmen', 'ru': 'Русский' };
    const translatableElements = document.querySelectorAll('[data-en]');

    // Apply saved or default language
    translatableElements.forEach(element => {
        if (element.dataset[savedLang]) {
            element.textContent = element.dataset[savedLang];
        }
        if (element.tagName === 'INPUT' && element.dataset[`${savedLang}-placeholder`]) {
            element.placeholder = element.dataset[`${savedLang}-placeholder`];
        }
    });
    const languageButton = document.getElementById('language-button');
    if (languageButton) {
        languageButton.textContent = languageMap[savedLang];
    }

    // Language dropdown toggle
    if (languageButton) {
        languageButton.addEventListener('click', () => {
            const languageMenu = document.getElementById('language-menu');
            if (languageMenu) {
                languageMenu.classList.toggle('active');
            }
        });
    }

    // Language selection
    document.querySelectorAll('.language-menu a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const lang = e.target.getAttribute('data-lang');
            if (!lang) return;

            localStorage.setItem('language', lang);
            translatableElements.forEach(element => {
                // Update text only for non-footer elements or footer spans
                if (!element.closest('.nav-item') || element.tagName === 'SPAN') {
                    if (element.dataset[lang]) {
                        element.textContent = element.dataset[lang];
                    }
                }
                // Update input placeholders
                if (element.tagName === 'INPUT' && element.dataset[`${lang}-placeholder`]) {
                    element.placeholder = element.dataset[`${lang}-placeholder`];
                }
            });
            if (languageButton) {
                languageButton.textContent = e.target.textContent;
            }
            const languageMenu = document.getElementById('language-menu');
            if (languageMenu) {
                languageMenu.classList.remove('active');
            }
        });
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const languageMenu = document.getElementById('language-menu');
        if (languageButton && languageMenu && !languageButton.contains(e.target) && !languageMenu.contains(e.target)) {
            languageMenu.classList.remove('active');
        }
    });
});