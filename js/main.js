import { Game } from './game.js';
import { VEGETABLES } from './config.js';

window.addEventListener('DOMContentLoaded', () => {
    // Populate Header
    const guideContainer = document.querySelector('.evolution-guide');
    if (guideContainer) {
        guideContainer.innerHTML = ''; // Clear static
        VEGETABLES.forEach((veg, index) => {
            const item = document.createElement('div');
            item.className = 'evo-item';

            const img = document.createElement('img');
            img.src = veg.img;
            item.appendChild(img);

            guideContainer.appendChild(item);

            // Arrow (except last)
            if (index < VEGETABLES.length - 1) {
                const arrow = document.createElement('div');
                arrow.className = 'arrow';
                arrow.innerText = '→';
                guideContainer.appendChild(arrow);
            }
        });
    }

    const game = new Game();
    game.init();
});
