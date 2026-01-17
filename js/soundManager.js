export class SoundManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.3; // 30% volume
        this.masterGain.connect(this.ctx.destination);
    }

    playTone(freq, type, duration) {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playShoot() {
        // "Pew" sound
        this.playTone(600, 'sine', 0.1);
        setTimeout(() => this.playTone(800, 'triangle', 0.1), 50);
    }

    // Musical notes for each vegetable (C major scale ascending)
    // Higher tier = higher pitch = more rewarding feeling
    getMergeNotes(vegIndex) {
        const notes = [
            { base: 262, name: 'C4' },   // 0: Corn
            { base: 294, name: 'D4' },   // 1: Bean
            { base: 330, name: 'E4' },   // 2: Chestnut
            { base: 349, name: 'F4' },   // 3: Eggplant
            { base: 392, name: 'G4' },   // 4: Carrot
            { base: 440, name: 'A4' },   // 5: Cucumber
            { base: 494, name: 'B4' },   // 6: Cabbage
            { base: 523, name: 'C5' },   // 7: Lettuce
            { base: 587, name: 'D5' },   // 8: Napa
            { base: 659, name: 'E5' },   // 9: Pumpkin (highest!)
        ];
        return notes[vegIndex] || notes[0];
    }

    playMerge(vegIndex = 0) {
        const note = this.getMergeNotes(vegIndex);
        const baseFreq = note.base;

        // Play a fun chord based on the vegetable
        // Lower veggies = simple beep, higher = richer chime
        this.playTone(baseFreq, 'sine', 0.15);

        if (vegIndex >= 2) {
            // Add harmony for higher tier
            setTimeout(() => this.playTone(baseFreq * 1.25, 'triangle', 0.12), 50);
        }
        if (vegIndex >= 5) {
            // Add extra sparkle for even higher tier
            setTimeout(() => this.playTone(baseFreq * 1.5, 'sine', 0.1), 80);
        }
        if (vegIndex >= 8) {
            // Epic sound for top tier!
            setTimeout(() => this.playTone(baseFreq * 2, 'sine', 0.15), 100);
            setTimeout(() => this.playTone(baseFreq * 0.5, 'triangle', 0.2), 50);
        }
    }

    playGameOver() {
        // "Fail" sound
        this.playTone(200, 'sawtooth', 0.3);
        setTimeout(() => this.playTone(150, 'sawtooth', 0.3), 200);
        setTimeout(() => this.playTone(100, 'sawtooth', 0.5), 400);
    }

    playPop() {
        this.playTone(800, 'square', 0.05);
    }

    // Epic fanfare for stage clear!
    playStageClear() {
        // Rising triumphant chord
        this.playTone(392, 'sine', 0.3);  // G4
        setTimeout(() => this.playTone(494, 'sine', 0.3), 100);  // B4
        setTimeout(() => this.playTone(587, 'sine', 0.3), 200);  // D5
        setTimeout(() => this.playTone(784, 'triangle', 0.4), 300);  // G5

        // Extra sparkle
        setTimeout(() => {
            this.playTone(1047, 'sine', 0.15);  // C6
            this.playTone(1319, 'sine', 0.15);  // E6
        }, 400);

        // Final boom
        setTimeout(() => {
            this.playTone(196, 'triangle', 0.5);  // G3 bass
            this.playTone(784, 'sine', 0.5);  // G5
        }, 500);
    }

    // Ultimate victory sound!
    playVictory() {
        // Grand fanfare
        const notes = [523, 587, 659, 784, 880, 988, 1047]; // C5 to C6
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this.playTone(freq, 'sine', 0.2);
                this.playTone(freq * 1.5, 'triangle', 0.15);
            }, i * 100);
        });

        // Epic finale
        setTimeout(() => {
            this.playTone(523, 'sine', 0.6);  // C5
            this.playTone(659, 'sine', 0.6);  // E5
            this.playTone(784, 'sine', 0.6);  // G5
            this.playTone(1047, 'triangle', 0.6);  // C6
        }, 800);
    }
}
