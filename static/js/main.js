document.addEventListener('DOMContentLoaded', () => {
    // Fetch user data
    fetch('/api/user')
        .then(response => response.json())
        .then(data => {
            if (data.error) return;
            document.getElementById('clicks-today').textContent = data.clicks_today;
            document.getElementById('coin-balance').textContent = `${data.coins} Coins`;
            const referralLink = document.getElementById('referral-link');
            if (referralLink) {
                referralLink.value = `https://t.me/#BegconBot?start=${data.referral_code}`;
            }
        });

    // Handle big coin click
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

    // Referral copy button
    const copyButton = document.querySelector('.referral-section .form-button');
    if (copyButton) {
        copyButton.addEventListener('click', () => {
            const referralLink = document.getElementById('referral-link');
            referralLink.select();
            document.execCommand('copy');
            alert('Referral link copied!');
        });
    }

    // Withdraw form submission
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
});