document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.nav-item');
    const pages = {
        '/home': `
            <div class="click-area">
                <svg id="big-coin" class="big-coin" width="200" height="200" viewBox="0 0 200 200">
                    <circle cx="100" cy="100" r="90" fill="url(#gold-grad-big)" stroke="#b8860b" stroke-width="5"/>
                    <circle cx="100" cy="100" r="70" fill="none" stroke="#fff" stroke-width="2" opacity="0.3"/>
                    <text x="100" y="110" text-anchor="middle" font-size="40" font-family="Roboto, sans-serif" fill="#b8860b">$</text>
                    <defs>
                        <radialGradient id="gold-grad-big" cx="0.4" cy="0.4" r="0.5">
                            <stop offset="0%" stop-color="#ffd700"/>
                            <stop offset="100%" stop-color="#daa520"/>
                        </radialGradient>
                    </defs>
                </svg>
                <p class="click-info" data-en="Clicks Today: " data-tk="Şu Gün Basyşlar: " data-ru="Клики сегодня: ">
                    Clicks Today: <span id="clicks-today">0</span>/100
                </p>
            </div>
            <div class="game-info">
                <div class="info-card">
                    <svg width="32" height="32" viewBox="0 0 24 24">
                        <path d="M3 21h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18V7H3v2zm0-6v2h18V3H3z" fill="#0077b6"/>
                    </svg>
                    <p data-en="Mining Rate: 1 coin/min" data-tk="Gazyp Çykarmak Tizlik: 1 teňňe/min" data-ru="Скорость майнинга: 1 монета/мин">
                        Mining Rate: 1 coin/min
                    </p>
                </div>
                <div class="info-card">
                    <svg width="32" height="32" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="#0077b6"/>
                    </svg>
                    <p data-en="Referrals: 0" data-tk="Ugrukdyryşlar: 0" data-ru="Рефералы: 0">
                        Referrals: 0
                    </p>
                </div>
            </div>
        `,
        '/referrals': `
            <div class="referral-section">
                <h2 data-en="Invite Friends" data-tk="Dostlary Çagyryň" data-ru="Приглашайте друзей">Invite Friends</h2>
                <p data-en="Share your referral link to earn 5 coins per friend!" 
                   data-tk="Dostuňyza 5 teňňe gazanmak üçin ugrukdyryş baglanyşygyňyzy paýlaşyň!" 
                   data-ru="Поделитесь реферальной ссылкой, чтобы заработать 5 монет за друга!">
                    Share your referral link to earn 5 coins per friend!
                </p>
                <input type="text" id="referral-link" value="https://t.me/YourBotName?start=12345" readonly class="referral-input">
                <button class="form-button" data-en="Copy Link" data-tk="Baglanyşygy Göçüriň" data-ru="Скопировать ссылку">Copy Link</button>
            </div>
        `,
        '/withdraw': `
            <div class="withdrawal-section">
                <h2 data-en="Request Withdrawal" data-tk="Çykarmak Haýyşy" data-ru="Запрос на вывод">Request Withdrawal</h2>
                <form id="withdraw-form" class="withdrawal-form">
                    <input type="text" id="name" placeholder="Full Name" data-en-placeholder="Full Name" data-tk-placeholder="Doly Ady" data-ru-placeholder="Полное имя" required>
                    <input type="tel" id="phone" placeholder="Phone Number" data-en-placeholder="Phone Number" data-tk-placeholder="Telefon Nomeri" data-ru-placeholder="Номер телефона" required>
                    <input type="number" id="amount" placeholder="Amount (min 500)" data-en-placeholder="Amount (min 500)" data-tk-placeholder="Mukdar (iň az 500)" data-ru-placeholder="Сумма (мин. 500)" required>
                    <button type="submit" class="form-button" data-en="Submit Withdrawal" data-tk="Çykarmak Tabşyryň" data-ru="Подать заявку на вывод">Submit Withdrawal</button>
                </form>
            </div>
        `
    };

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const href = link.getAttribute('href');
            const mainContent = document.querySelector('.content');
            mainContent.innerHTML = pages[href];

            history.pushState({}, '', href);

            const currentLang = localStorage.getItem('language') || 'tk';
            const newTranslatableElements = document.querySelectorAll('[data-en]');
            newTranslatableElements.forEach(el => {
                if (!el.closest('.nav-item') || el.tagName === 'SPAN') {
                    if (el.dataset[currentLang]) {
                        el.textContent = el.dataset[currentLang];
                    }
                }
                if (el.tagName === 'INPUT' && el.dataset[`${currentLang}-placeholder`]) {
                    el.placeholder = el.dataset[`${currentLang}-placeholder`];
                }
            });

            fetch('/api/user')
                .then(response => response.json())
                .then(data => {
                    if (data.error) return;
                    const clicksToday = document.getElementById('clicks-today');
                    if (clicksToday) {
                        clicksToday.textContent = data.clicks_today;
                    }
                    document.getElementById('coin-balance').textContent = `${data.coins} Coins`;
                    const referralLink = document.getElementById('referral-link');
                    if (referralLink) {
                        referralLink.value = `https://t.me/YourBotName?start=${data.referral_code}`;
                    }
                });

            if (href === '/home') {
                const bigCoin = document.getElementById('big-coin');
                if (bigCoin) {
                    bigCoin.addEventListener('click', () => {
                        fetch('/api/click', { method: 'POST' })
                            .then(response => response.json())
                            .then(data => {
                                if (data.error) {
                                    alert(data.error);
                                    return;
                                }
                                document.getElementById('clicks-today').textContent = data.clicks_today;
                                document.getElementById('coin-balance').textContent = `${data.coins} Coins`;
                                bigCoin.style.transform = 'scale(1.1) rotate(360deg)';
                                setTimeout(() => {
                                    bigCoin.style.transform = 'scale(1)';
                                }, 300);
                            });
                    });
                }
            } else if (href === '/referrals') {
                const copyButton = document.querySelector('.referral-section .form-button');
                if (copyButton) {
                    copyButton.addEventListener('click', () => {
                        const referralLink = document.getElementById('referral-link');
                        referralLink.select();
                        document.execCommand('copy');
                        alert('Referral link copied!');
                    });
                }
            } else if (href === '/withdraw') {
                const withdrawForm = document.getElementById('withdraw-form');
                if (withdrawForm) {
                    withdrawForm.addEventListener('submit', (e) => {
                        e.preventDefault();
                        const data = {
                            name: document.getElementById('name').value,
                            phone: document.getElementById('phone').value,
                            amount: document.getElementById('amount').value
                        };
                        fetch('/api/withdraw', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(data)
                        })
                        .then(response => response.json())
                        .then(data => {
                            alert(data.message || data.error);
                            if (!data.error) {
                                withdrawForm.reset();
                            }
                        });
                    });
                }
            }
        });
    });

    window.addEventListener('popstate', () => {
        const path = window.location.pathname;
        const mainContent = document.querySelector('.content');
        mainContent.innerHTML = pages[path] || pages['/home'];
        
        const currentLang = localStorage.getItem('language') || 'tk';
        const newTranslatableElements = document.querySelectorAll('[data-en]');
        newTranslatableElements.forEach(el => {
            if (!el.closest('.nav-item') || el.tagName === 'SPAN') {
                if (el.dataset[currentLang]) {
                    el.textContent = el.dataset[currentLang];
                }
            }
            if (el.tagName === 'INPUT' && el.dataset[`${currentLang}-placeholder`]) {
                el.placeholder = el.dataset[`${currentLang}-placeholder`];
            }
        });

        fetch('/api/user')
            .then(response => response.json())
            .then(data => {
                if (data.error) return;
                const clicksToday = document.getElementById('clicks-today');
                if (clicksToday) {
                    clicksToday.textContent = data.clicks_today;
                }
                document.getElementById('coin-balance').textContent = `${data.coins} Coins`;
                const referralLink = document.getElementById('referral-link');
                if (referralLink) {
                    referralLink.value = `https://t.me/YourBotName?start=${data.referral_code}`;
                }
            });
    });

    const urlParams = new URLSearchParams(window.location.search);
    const referralCode = urlParams.get('start');
    if (referralCode) {
        fetch(`/api/referral/${referralCode}`, { method: 'GET' })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    console.log(data.error);
                }
            });
    }
});