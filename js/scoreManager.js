export class ScoreManager {
    constructor() {
        this.score = 0;
        this.highScore = Number(localStorage.getItem('wonder_highScore')) || 0;
        this.combo = 0;
        this.comboTimer = null;

        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('high-score');

        // Ensure High Score element exists in UI updates
        this.updateDisplay();
    }

    addScore(points) {
        // Simple combo system: if merges happen quickly, multiplier increases
        this.combo++;
        const multiplier = Math.min(this.combo, 5); // Max 5x
        const earned = points * multiplier;

        this.score += earned;
        this.updateDisplay();

        // Check High Score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('wonder_highScore', this.highScore);
        }

        // Reset combo if no merges for 1.5 seconds
        if (this.comboTimer) clearTimeout(this.comboTimer);
        this.comboTimer = setTimeout(() => {
            this.combo = 0;
        }, 1500);
    }

    reset() {
        this.score = 0;
        this.combo = 0;
        this.updateDisplay();
    }

    updateDisplay() {
        if (this.scoreElement) this.scoreElement.innerText = this.score;
        if (this.highScoreElement) this.highScoreElement.innerText = `Best: ${this.highScore}`;
    }
}
