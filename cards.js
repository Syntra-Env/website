// Card Emboss + Click-to-Navigate

document.addEventListener('cardsInitialized', () => {
    const cards = document.querySelectorAll('.tarot-card:not(.draft)');

    cards.forEach(card => {
        let isAnimating = false;
        const inner = card.querySelector('.card-inner');

        card.addEventListener('mousemove', (e) => {
            if (isAnimating) return;

            const rect = inner.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            inner.style.setProperty('--mouse-x', `${x}px`);
            inner.style.setProperty('--mouse-y', `${y}px`);
            inner.classList.add('emboss-active');
        });

        card.addEventListener('mouseleave', () => {
            if (isAnimating) return;
            inner.classList.remove('emboss-active');
        });

        const cardLink = card.querySelector('.card-rotator');
        cardLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = cardLink.href;
        });
    });
});
