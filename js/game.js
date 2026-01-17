import { CONFIG, VEGETABLES, STAGES } from './config.js';
import { createVegetable } from './vegetable.js';
import { ScoreManager } from './scoreManager.js';
import { SoundManager } from './soundManager.js';

export class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.restartBtn = document.getElementById('restart-btn');
        this.gameOverElement = document.getElementById('game-over');
        this.finalScoreElement = document.getElementById('final-score');

        // Managers
        this.scoreManager = new ScoreManager();
        this.soundManager = new SoundManager();

        this.engine = null;
        this.render = null;
        this.runner = null;

        // Game State
        this.currentVegIndex = 0;
        this.nextVegIndex = 0;

        // Launcher State
        this.launcherX = CONFIG.CANVAS_WIDTH / 2;
        this.isShooting = false;
        this.canShoot = true;

        this.gameOver = false;

        // Stage System
        this.currentStage = 0; // Index into STAGES array
        this.goalVegMade = 0;  // Count of goal vegetables made
        this.stageClear = false;

        this.walls = [];
        this.loadedImages = {};

        // Preload images for manual rendering (canvas ctx)
        VEGETABLES.forEach((v, i) => {
            const img = new Image();
            img.src = v.img;
            this.loadedImages[i] = img;
        });
    }

    init() {
        const { Engine, Render, Runner, World, Events } = Matter;

        // Create engine with Reverse Gravity (adjusted by stage)
        this.engine = Engine.create();
        const stage = STAGES[this.currentStage];
        this.engine.world.gravity.y = CONFIG.GRAVITY_Y * stage.gravityMultiplier;

        // Create renderer
        this.render = Render.create({
            canvas: this.canvas,
            engine: this.engine,
            options: {
                width: CONFIG.CANVAS_WIDTH,
                height: CONFIG.CANVAS_HEIGHT,
                wireframes: false,
                background: '#fff8dc'
            }
        });

        this.createWalls();

        // Start runner
        this.runner = Runner.create();
        Runner.run(this.runner, this.engine);
        Render.run(this.render);

        // Inputs
        this.setupInputs();

        // Collision
        Events.on(this.engine, 'collisionStart', (e) => this.handleCollisions(e));

        // Rendering Loop
        Events.on(this.render, 'afterRender', () => this.afterRender());

        // Game Over Check Loop
        setInterval(() => this.checkGameOver(), 1000);

        this.restartBtn.addEventListener('click', () => this.reset());

        this.prepareNextVegetable();

        // Show stage 1 start message
        this.showStageStartMessage();
    }

    createWalls() {
        const { Bodies, Composite } = Matter;
        const wallOptions = {
            isStatic: true,
            render: { fillStyle: '#8b4513' },
            friction: 0.5
        };

        const ceiling = Bodies.rectangle(CONFIG.CANVAS_WIDTH / 2, -10, CONFIG.CANVAS_WIDTH, CONFIG.WALL_THICKNESS * 2, wallOptions);
        const leftWall = Bodies.rectangle(-10, CONFIG.CANVAS_HEIGHT / 2, CONFIG.WALL_THICKNESS * 2, CONFIG.CANVAS_HEIGHT * 2, wallOptions);
        const rightWall = Bodies.rectangle(CONFIG.CANVAS_WIDTH + 10, CONFIG.CANVAS_HEIGHT / 2, CONFIG.WALL_THICKNESS * 2, CONFIG.CANVAS_HEIGHT * 2, wallOptions);
        const floor = Bodies.rectangle(CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT + 100, CONFIG.CANVAS_WIDTH, 50, wallOptions);

        this.walls = [ceiling, leftWall, rightWall, floor];
        Composite.add(this.engine.world, this.walls);
    }

    prepareNextVegetable() {
        const stage = STAGES[this.currentStage];
        const spawnRange = stage.spawnRange;

        if (this.currentVegIndex === -1) {
            this.currentVegIndex = Math.floor(Math.random() * spawnRange);
        } else {
            this.currentVegIndex = this.nextVegIndex;
        }

        this.nextVegIndex = Math.floor(Math.random() * spawnRange);

        this.canShoot = true;
        this.isShooting = false;

        // Update DOM instead of Canvas
        this.updateNextPreviewDOM();
    }

    updateNextPreviewDOM() {
        const nextVeg = VEGETABLES[this.nextVegIndex];
        const nextImgElement = document.getElementById('next-veg-img');
        if (nextImgElement) {
            nextImgElement.src = nextVeg.img;
        }
    }

    setupInputs() {
        const updateLauncher = (clientX) => {
            if (this.gameOver) return;
            const rect = this.canvas.getBoundingClientRect();
            const relX = clientX - rect.left;

            const currentRadius = VEGETABLES[this.currentVegIndex].radius;
            this.launcherX = Math.max(currentRadius + CONFIG.WALL_THICKNESS, Math.min(relX, CONFIG.CANVAS_WIDTH - currentRadius - CONFIG.WALL_THICKNESS));
        };

        const tryShoot = () => {
            if (this.gameOver || !this.canShoot) return;
            this.shoot();
        };

        // Desktop
        this.canvas.addEventListener('mousemove', (e) => updateLauncher(e.clientX));
        this.canvas.addEventListener('mouseup', tryShoot);

        // Touch
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            updateLauncher(e.touches[0].clientX);
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            tryShoot();
        });
    }

    shoot() {
        this.canShoot = false;
        this.isShooting = true;
        this.soundManager.playShoot();

        const veg = createVegetable(this.launcherX, CONFIG.LAUNCHER_Y, this.currentVegIndex);
        Matter.Body.setVelocity(veg, { x: 0, y: -15 });

        Matter.Composite.add(this.engine.world, veg);

        setTimeout(() => {
            if (!this.gameOver) {
                this.prepareNextVegetable();
            }
        }, 600);
    }

    handleCollisions(event) {
        event.pairs.forEach(pair => {
            const { bodyA, bodyB } = pair;

            if (bodyA.vegIndex !== undefined && bodyB.vegIndex !== undefined) {
                if (bodyA.vegIndex === bodyB.vegIndex) {
                    this.mergeVegetables(bodyA, bodyB);
                }
            }
        });
    }

    mergeVegetables(a, b) {
        Matter.Composite.remove(this.engine.world, [a, b]);

        const midX = (a.position.x + b.position.x) / 2;
        const midY = (a.position.y + b.position.y) / 2;

        const nextIdx = a.vegIndex + 1;

        this.soundManager.playMerge(a.vegIndex);
        const score = VEGETABLES[a.vegIndex].score;
        this.scoreManager.addScore(score);

        if (nextIdx < VEGETABLES.length) {
            const newVeg = createVegetable(midX, midY, nextIdx);
            Matter.Composite.add(this.engine.world, newVeg);

            // Check if we made the goal vegetable for this stage
            const stage = STAGES[this.currentStage];
            if (nextIdx >= stage.goalVegIndex) {
                this.goalVegMade++;
                this.checkStageClear();
            }
        } else {
            // Two max veggies merged!
            this.scoreManager.addScore(1000);
            this.soundManager.playPop();
            this.goalVegMade++;
            this.checkStageClear();
        }
    }

    checkStageClear() {
        const stage = STAGES[this.currentStage];
        // Skip check for endless mode
        if (stage.endless) return;

        if (this.goalVegMade >= stage.goalCount && !this.stageClear) {
            this.stageClear = true;
            this.triggerStageClear();
        }
    }

    triggerStageClear() {
        // Show stage clear message
        this.canShoot = false;

        setTimeout(() => {
            const nextStage = STAGES[this.currentStage + 1];
            if (nextStage && !nextStage.endless) {
                // Go to next regular stage
                this.currentStage++;
                this.startStage();
            } else if (nextStage && nextStage.endless) {
                // Enter endless mode!
                this.currentStage++;
                this.startStage();
            } else {
                // All stages complete! Show victory
                this.triggerVictory();
            }
        }, 2500);

        this.showStageClearMessage();
    }

    showStageClearMessage() {
        const stage = STAGES[this.currentStage];
        const nextStage = STAGES[this.currentStage + 1];

        // Play epic fanfare!
        this.soundManager.playStageClear();

        // Create overlay with confetti
        const overlay = document.createElement('div');
        overlay.id = 'stage-clear-overlay';

        // Generate confetti particles
        let confettiHTML = '';
        const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6b9d', '#c44dff'];
        for (let i = 0; i < 50; i++) {
            const color = colors[Math.floor(Math.random() * colors.length)];
            const left = Math.random() * 100;
            const delay = Math.random() * 2;
            const duration = 2 + Math.random() * 2;
            confettiHTML += `<div class="confetti" style="left:${left}%;background:${color};animation-delay:${delay}s;animation-duration:${duration}s;"></div>`;
        }

        overlay.innerHTML = `
            <style>
                @keyframes confettiFall {
                    0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
                }
                @keyframes popIn {
                    0% { transform: scale(0); opacity: 0; }
                    50% { transform: scale(1.2); }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes glow {
                    0%, 100% { text-shadow: 0 0 20px #ffd700, 0 0 40px #ffd700; }
                    50% { text-shadow: 0 0 40px #ffd700, 0 0 80px #ffd700, 0 0 120px #ffd700; }
                }
                .confetti {
                    position: absolute;
                    width: 10px;
                    height: 10px;
                    top: -20px;
                    animation: confettiFall linear forwards;
                }
                .stage-clear-content {
                    animation: popIn 0.5s ease-out forwards;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 40px 60px;
                    border-radius: 20px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
                }
                .stage-clear-content h1 {
                    font-size: 2em;
                    margin-bottom: 10px;
                    animation: glow 1s ease-in-out infinite;
                }
            </style>
            ${confettiHTML}
            <div class="stage-clear-content">
                <h1>🎉 스테이지 ${stage.id} 클리어!</h1>
                <p style="font-size:1.2em;">${stage.name} 완료!</p>
                ${nextStage ? `<p style="margin-top:15px;">다음: <strong>${nextStage.name}</strong></p>` : '<p style="margin-top:15px;color:#ffd700;">🏆 모든 스테이지 클리어!</p>'}
            </div>
        `;
        overlay.style.cssText = `
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.85);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            color: white;
            text-align: center;
            font-size: 1.5em;
            overflow: hidden;
        `;
        document.body.appendChild(overlay);

        setTimeout(() => {
            overlay.remove();
        }, 2500);
    }

    triggerVictory() {
        this.gameOver = true;
        this.soundManager.playVictory(); // Epic victory sound!
        this.gameOverElement.querySelector('h1').innerText = '🏆 축하합니다!';
        this.gameOverElement.querySelector('p').innerText = '모든 스테이지를 클리어했습니다!';
        this.finalScoreElement.innerText = this.scoreManager.score;
        this.gameOverElement.classList.remove('hidden');
    }

    startStage() {
        // Clear world
        Matter.World.clear(this.engine.world);
        this.createWalls();

        // Apply new stage settings
        const stage = STAGES[this.currentStage];
        this.engine.world.gravity.y = CONFIG.GRAVITY_Y * stage.gravityMultiplier;

        // Reset stage state
        this.goalVegMade = 0;
        this.stageClear = false;
        this.currentVegIndex = -1;
        this.prepareNextVegetable();

        // Show stage start message
        this.showStageStartMessage();
    }

    showStageStartMessage() {
        const stage = STAGES[this.currentStage];

        const goalVegName = VEGETABLES[stage.goalVegIndex].name;
        const goalEmoji = this.getVegEmoji(stage.goalVegIndex);

        const overlay = document.createElement('div');
        overlay.id = 'stage-start-overlay';
        overlay.innerHTML = `
            <div class="stage-start-content">
                <h1>스테이지 ${stage.id}</h1>
                <p>${stage.name}</p>
                <p>${goalEmoji} ${goalVegName} 만들기!</p>
            </div>
        `;
        overlay.style.cssText = `
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            color: white;
            text-align: center;
            font-size: 1.5em;
        `;
        document.body.appendChild(overlay);

        setTimeout(() => {
            overlay.remove();
        }, 1500);
    }

    checkGameOver() {
        if (this.gameOver) return;

        const bodies = Matter.Composite.allBodies(this.engine.world);
        const veggies = bodies.filter(b => b.vegIndex !== undefined);

        const stage = STAGES[this.currentStage];
        for (const v of veggies) {
            if (v.position.y > stage.dangerLineY && v.speed < 0.5) {
                this.triggerGameOver();
                break;
            }
        }
    }

    triggerGameOver() {
        this.gameOver = true;
        this.soundManager.playGameOver();
        this.finalScoreElement.innerText = this.scoreManager.score;
        this.gameOverElement.classList.remove('hidden');
    }

    reset() {
        Matter.World.clear(this.engine.world);
        Matter.Engine.clear(this.engine);

        // Reset stage system
        this.currentStage = 0;
        this.goalVegMade = 0;
        this.stageClear = false;

        // Apply first stage settings
        const stage = STAGES[this.currentStage];
        this.engine.world.gravity.y = CONFIG.GRAVITY_Y * stage.gravityMultiplier;

        this.createWalls();

        this.scoreManager.reset();
        this.gameOver = false;
        this.gameOverElement.classList.remove('hidden');
        this.gameOverElement.classList.add('hidden');

        this.currentVegIndex = -1; // Force reset
        this.prepareNextVegetable();

        // Show stage 1 start message
        this.showStageStartMessage();
    }

    afterRender() {
        const ctx = this.render.context;

        // Draw Danger Line
        ctx.beginPath();
        ctx.moveTo(0, CONFIG.DANGER_LINE_Y);
        ctx.lineTo(CONFIG.CANVAS_WIDTH, CONFIG.DANGER_LINE_Y);
        ctx.strokeStyle = 'red';
        ctx.setLineDash([10, 10]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw "Launcher" area
        if (!this.gameOver && this.canShoot) {
            const currentVeg = VEGETABLES[this.currentVegIndex];
            const img = this.loadedImages[this.currentVegIndex];
            const size = currentVeg.radius * 2;

            // Draw guideline
            ctx.beginPath();
            ctx.moveTo(this.launcherX, CONFIG.LAUNCHER_Y);
            ctx.lineTo(this.launcherX, 0);
            ctx.strokeStyle = 'rgba(0,0,0,0.2)';
            ctx.stroke();

            // Draw Image with Clipping
            ctx.save();
            ctx.translate(this.launcherX, CONFIG.LAUNCHER_Y);

            ctx.beginPath();
            ctx.arc(0, 0, currentVeg.radius, 0, 2 * Math.PI);
            ctx.closePath();
            ctx.clip();

            if (img && img.complete) {
                const drawSize = size * 1.1;
                ctx.drawImage(img, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
            } else {
                ctx.fillStyle = currentVeg.color;
                ctx.fill();
            }
            ctx.restore();
        }

        // Draw All Vegetables (Manually with Clipping)
        const bodies = Matter.Composite.allBodies(this.engine.world);
        bodies.forEach(body => {
            if (body.vegIndex !== undefined) {
                const veg = VEGETABLES[body.vegIndex];
                const img = this.loadedImages[body.vegIndex];
                const radius = veg.radius;

                ctx.save();
                ctx.translate(body.position.x, body.position.y);
                ctx.rotate(body.angle);

                // Circular Clipping
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, 2 * Math.PI);
                ctx.closePath();
                ctx.clip();

                // Draw Image
                if (img && img.complete) {
                    // Draw slightly larger to cover antialiasing edges and close physics gaps
                    // User complained about "padding" - this means physics radius > visual radius
                    // Increasing this multiplier will make the visual circle larger.
                    const size = radius * 2.3;
                    ctx.drawImage(img, -size / 2, -size / 2, size, size);
                } else {
                    ctx.fillStyle = veg.color;
                    ctx.fill();
                }

                // Add Light Border/Shine?
                // ctx.strokeStyle = 'rgba(255,255,255,0.3)';
                // ctx.lineWidth = 2;
                // ctx.stroke();

                ctx.restore();

                // Draw Label on top? (Optional, maybe too cluttered with images)
                /*
                ctx.save();
                ctx.translate(body.position.x, body.position.y);
                ctx.rotate(body.angle);
                ctx.fillStyle = '#FFF';
                ctx.font = `${radius}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                // ctx.fillText(veg.label, 0, 0);
                ctx.restore();
                */
            }
        });
    }

    getVegEmoji(vegIndex) {
        const emojis = ['🌽', '🫘', '🌰', '🍆', '🥕', '🥒', '🥬', '🥗', '🥬', '🎃'];
        return emojis[vegIndex] || '🥬';
    }
}
