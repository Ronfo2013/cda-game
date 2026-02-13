// ============================================
// CAFFÈ DELL'ANGOLO - IL GIOCO - MAIN LOGIC
// ============================================

const Game = {
    // Canvas and context
    canvas: null,
    ctx: null,
    
    // Grid settings
    tileSize: 30,
    
    // Game state
    running: false,
    paused: false,
    score: 0,
    lives: 3,
    level: 1,
    highScore: 0,
    
    // Power-up state
    powerUpActive: false,
    powerUpTimer: 0,
    
    // Combo system
    combo: 0,
    comboTimer: 0,
    
    // Grace period (after respawn)
    gracePeriod: 0,
    
    // Player
    player: {
        x: PLAYER_START.x,
        y: PLAYER_START.y,
        direction: { x: 0, y: 0 },
        nextDirection: { x: 0, y: 0 },
        moveTimer: 0
    },
    
    // Enemies
    enemies: [],
    
    // Maze
    maze: [],
    
    // Particles for effects
    particles: [],
    
    // ========== INITIALIZATION ==========
    
    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Load high score
        this.highScore = parseInt(localStorage.getItem(CONFIG.STORAGE_HIGHSCORE)) || 0;
        document.getElementById('high-score').textContent = this.highScore;
        
        // Calculate tile size and setup canvas
        this.calculateTileSize();
        
        // Setup resize handler
        window.addEventListener('resize', () => this.handleResize());
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', () => this.handleResize());
        }
        
        // Initialize audio
        AudioManager.init();
        VibrationManager.init();
    },
    
    // Calculate optimal tile size for screen
    calculateTileSize() {
        const vw = window.visualViewport ? window.visualViewport.width : window.innerWidth;
        const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        
        const availableWidth = vw - 16;
        const availableHeight = vh - 70;
        
        const tileByWidth = Math.floor(availableWidth / CONFIG.COLS);
        const tileByHeight = Math.floor(availableHeight / CONFIG.ROWS);
        
        this.tileSize = Math.min(tileByWidth, tileByHeight);
        this.tileSize = Math.max(this.tileSize, 18);
        
        this.canvas.width = CONFIG.COLS * this.tileSize;
        this.canvas.height = CONFIG.ROWS * this.tileSize;
        
        const hud = document.getElementById('hud');
        if (hud) hud.style.width = this.canvas.width + 'px';
    },
    
    handleResize() {
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            this.calculateTileSize();
            if (this.running) this.draw();
        }, 100);
    },
    
    // ========== GAME FLOW ==========
    
    start() {
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.powerUpActive = false;
        this.combo = 0;
        this.comboTimer = 0;
        this.particles = [];
        document.getElementById('powerup-indicator').style.display = 'none';

        this.initMaze();
        this.initEnemies();
        this.resetPlayer();
        this.updateHUD();
        this.showLevelAnnounce();
        
        this.running = true;
        this.paused = false;
        this.gameLoop();
    },
    
    restart() {
        this.start();
    },
    
    pause() {
        if (!this.running) return;
        this.paused = true;
        document.getElementById('pause-overlay').classList.add('active');
    },
    
    resume() {
        if (!this.running) return;
        this.paused = false;
        document.getElementById('pause-overlay').classList.remove('active');
        this.gameLoop();
    },
    
    gameOver() {
        this.running = false;
        document.body.classList.remove('in-game');
        if (typeof applyControlMode === 'function') {
            applyControlMode();
        }
        
        // Update high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem(CONFIG.STORAGE_HIGHSCORE, this.highScore);
        }
        
        // Show nickname input screen
        document.getElementById('nickname-score').textContent = this.score;
        document.getElementById('nickname-input').value = '';
        document.getElementById('nickname-screen').classList.add('active');
    },
    
    // ========== MAZE MANAGEMENT ==========
    
    initMaze() {
        // Seleziona il labirinto in base al livello (6 layout diversi)
        const levelIndex = Math.min(this.level - 1, MAZE_TEMPLATES.length - 1);
        this.maze = JSON.parse(JSON.stringify(MAZE_TEMPLATES[levelIndex]));
    },
    
    countDrinks() {
        let count = 0;
        for (let y = 0; y < CONFIG.ROWS; y++) {
            for (let x = 0; x < CONFIG.COLS; x++) {
                const tile = this.maze[y][x];
                if (tile === CONFIG.TILE_BEER || 
                    tile === CONFIG.TILE_VODKA || 
                    tile === CONFIG.TILE_POWERUP) {
                    count++;
                }
            }
        }
        return count;
    },
    
    canMove(x, y) {
        // Tunnel passage
        if (y === 8 && (x < 0 || x >= CONFIG.COLS)) return true;
        
        if (x < 0 || x >= CONFIG.COLS || y < 0 || y >= CONFIG.ROWS) return false;
        
        return this.maze[y][x] !== CONFIG.TILE_WALL;
    },
    
    // ========== PLAYER MANAGEMENT ==========
    
    resetPlayer() {
        this.player.x = PLAYER_START.x;
        this.player.y = PLAYER_START.y;
        this.player.direction = { x: 0, y: 0 };
        this.player.nextDirection = { x: 0, y: 0 };
        this.player.moveTimer = 0;
    },
    
    movePlayer() {
        this.player.moveTimer++;
        if (this.player.moveTimer < CONFIG.PLAYER_MOVE_DELAY) return;
        this.player.moveTimer = 0;
        
        // Try next direction first
        const nextX = this.player.x + this.player.nextDirection.x;
        const nextY = this.player.y + this.player.nextDirection.y;
        
        if (this.canMove(nextX, nextY)) {
            this.player.direction = { ...this.player.nextDirection };
        }
        
        // Move in current direction
        let newX = this.player.x + this.player.direction.x;
        let newY = this.player.y + this.player.direction.y;
        
        // Tunnel wrap
        if (newY === 8) {
            if (newX < 0) newX = CONFIG.COLS - 1;
            if (newX >= CONFIG.COLS) newX = 0;
        }
        
        if (this.canMove(newX, newY)) {
            this.player.x = newX;
            this.player.y = newY;
            
            // Collect items
            this.collectItem();
        }
    },
    
    collectItem() {
        const tile = this.maze[this.player.y][this.player.x];
        const lvlIndex = Math.min(this.level - 1, 5);
        
        if (tile === CONFIG.TILE_BEER) {
            this.maze[this.player.y][this.player.x] = CONFIG.TILE_EMPTY;
            this.addScore(CONFIG.SCORE_BEER);
            this.addCombo();
            const beerEmoji = (CONFIG.EMOJI_BEERS && CONFIG.EMOJI_BEERS[lvlIndex]) || CONFIG.EMOJI_BEER;
            this.createParticles(this.player.x, this.player.y, beerEmoji, 3);
            AudioManager.playCollect();
            VibrationManager.vibrate(10);
            
        } else if (tile === CONFIG.TILE_VODKA) {
            this.maze[this.player.y][this.player.x] = CONFIG.TILE_EMPTY;
            this.addScore(CONFIG.SCORE_VODKA);
            this.addCombo();
            const vodkaEmoji = (CONFIG.EMOJI_VODKAS && CONFIG.EMOJI_VODKAS[lvlIndex]) || CONFIG.EMOJI_VODKA;
            this.createParticles(this.player.x, this.player.y, vodkaEmoji, 5);
            AudioManager.playVodka();
            VibrationManager.vibrate(30);
            
        } else if (tile === CONFIG.TILE_POWERUP) {
            this.maze[this.player.y][this.player.x] = CONFIG.TILE_EMPTY;
            this.activatePowerUp();
        }
    },
    
    addScore(points) {
        const comboBonus = Math.floor(points * this.combo * CONFIG.COMBO_MULTIPLIER);
        this.score += points + comboBonus;
        this.updateHUD();
    },
    
    addCombo() {
        this.combo++;
        this.comboTimer = CONFIG.COMBO_TIMEOUT;
        this.updateComboDisplay();
        AudioManager.playCombo();
    },
    
    resetCombo() {
        this.combo = 0;
        this.updateComboDisplay();
    },
    
    updateComboDisplay() {
        const comboEl = document.getElementById('combo-display');
        const comboValue = document.getElementById('combo-value');
        
        if (this.combo > 1) {
            comboValue.textContent = this.combo;
            comboEl.classList.add('active');
        } else {
            comboEl.classList.remove('active');
        }
    },
    
    activatePowerUp() {
        this.powerUpActive = true;
        const extraDuration = this.level <= 3 ? 90 : 0;
        this.powerUpTimer = CONFIG.POWERUP_DURATION + extraDuration;
        this.enemies.forEach(e => e.scared = true);
        document.getElementById('powerup-indicator').textContent = `📜 INVINCIBILE ${Math.ceil(this.powerUpTimer / 60)}s`;
        document.getElementById('powerup-indicator').style.display = 'block';
        AudioManager.playPowerUp();
        VibrationManager.vibrate(100);
    },
    
    // ========== ENEMY MANAGEMENT ==========
    
    getDifficultyProfile() {
        // Nemici progressivi: livello N = N nemici (max MAX_ENEMIES)
        const enemies = Math.min(this.level, CONFIG.MAX_ENEMIES);

        if (this.level <= 2) {
            return { enemies, enemyDelayBonus: 6, graceFrames: 180 };
        }
        if (this.level <= 4) {
            return { enemies, enemyDelayBonus: 3, graceFrames: 150 };
        }
        return {
            enemies,
            enemyDelayBonus: 0,
            graceFrames: CONFIG.GRACE_PERIOD
        };
    },

    initEnemies() {
        this.enemies = [];
        const profile = this.getDifficultyProfile();
        const numEnemies = profile.enemies;
        const speedBonus = Math.max(0, this.level - 4);

        for (let i = 0; i < numEnemies; i++) {
            const pos = ENEMY_START_POSITIONS[i % ENEMY_START_POSITIONS.length];
            // Base delay variabile tra 18 e 26 (rallentato rispetto a prima)
            const baseDelay = 18 + (i * 2);
            const moveDelay = Math.max(11, baseDelay - speedBonus + profile.enemyDelayBonus);
            
            this.enemies.push({
                x: pos.x,
                y: pos.y,
                direction: { x: 0, y: -1 },
                scared: false,
                moveTimer: 0,
                moveDelay
            });
        }
        
        this.gracePeriod = profile.graceFrames;
    },
    
    resetEnemyPositions() {
        this.enemies.forEach((enemy, i) => {
            const pos = ENEMY_START_POSITIONS[i % ENEMY_START_POSITIONS.length];
            enemy.x = pos.x;
            enemy.y = pos.y;
            enemy.moveTimer = 0;
        });
    },
    
    moveEnemies() {
        if (this.gracePeriod > 0) return;
        
        this.enemies.forEach(enemy => {
            enemy.moveTimer++;
            
            const moveDelay = this.powerUpActive ? enemy.moveDelay + 10 : enemy.moveDelay;
            
            if (enemy.moveTimer < moveDelay) return;
            enemy.moveTimer = 0;
            
            // Simple AI
            const directions = [
                { x: 0, y: -1 },
                { x: 0, y: 1 },
                { x: -1, y: 0 },
                { x: 1, y: 0 }
            ];
            
            const validDirs = directions.filter(d => 
                this.canMove(enemy.x + d.x, enemy.y + d.y)
            );
            
            if (validDirs.length === 0) return;
            
            let bestDir = validDirs[0];
            let bestDist = enemy.scared ? -Infinity : Infinity;
            
            validDirs.forEach(d => {
                const newX = enemy.x + d.x;
                const newY = enemy.y + d.y;
                const dist = Math.abs(newX - this.player.x) + Math.abs(newY - this.player.y);
                
                if (enemy.scared) {
                    if (dist > bestDist) {
                        bestDist = dist;
                        bestDir = d;
                    }
                } else {
                    if (dist < bestDist) {
                        bestDist = dist;
                        bestDir = d;
                    }
                }
            });
            
            // Add randomness
            if (Math.random() < 0.3) {
                bestDir = validDirs[Math.floor(Math.random() * validDirs.length)];
            }
            
            enemy.x += bestDir.x;
            enemy.y += bestDir.y;
            enemy.direction = bestDir;
            
            // Tunnel wrap
            if (enemy.y === 8) {
                if (enemy.x < 0) enemy.x = CONFIG.COLS - 1;
                if (enemy.x >= CONFIG.COLS) enemy.x = 0;
            }
        });
    },
    
    // ========== COLLISION DETECTION ==========
    
    checkCollisions() {
        if (this.gracePeriod > 0) return;
        
        this.enemies.forEach(enemy => {
            const dist = Math.abs(enemy.x - this.player.x) + Math.abs(enemy.y - this.player.y);
            
            if (dist < 0.8) {
                if (this.powerUpActive) {
                    // Eat the enemy!
                    this.addScore(CONFIG.SCORE_GHOST);
                    this.createParticles(enemy.x, enemy.y, '💫', 8);
                    enemy.x = 6;
                    enemy.y = 8;
                    enemy.scared = false;
                    AudioManager.playEatGhost();
                    VibrationManager.vibrate(50);
                } else {
                    // Player caught
                    this.lives--;
                    this.resetCombo();
                    AudioManager.playDeath();
                    VibrationManager.vibrate(200);
                    this.updateHUD();
                    
                    if (this.lives <= 0) {
                        this.gameOver();
                    } else {
                        this.resetPlayer();
                        this.resetEnemyPositions();
                        const profile = this.getDifficultyProfile();
                        this.gracePeriod = Math.floor(profile.graceFrames * 0.75);
                    }
                }
            }
        });
    },
    
    // ========== LEVEL MANAGEMENT ==========
    
    checkLevelComplete() {
        if (this.countDrinks() === 0) {
            this.level++;
            this.initMaze();
            this.initEnemies();
            this.resetPlayer();
            this.updateHUD();
            this.showLevelAnnounce();
            AudioManager.playLevelComplete();
            VibrationManager.vibrate(300);
        }
    },
    
    showLevelAnnounce() {
        const announce = document.getElementById('level-announce');
        announce.innerHTML = `
            <span class="level-num">LIVELLO ${this.level}</span>
        `;
        announce.style.display = 'block';
        
        setTimeout(() => {
            announce.style.display = 'none';
        }, 2000);
    },
    
    // ========== PARTICLES ==========
    
    createParticles(x, y, emoji, count = 5) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x * this.tileSize + this.tileSize / 2,
                y: y * this.tileSize + this.tileSize / 2,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 30,
                emoji: emoji
            });
        }
    },
    
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    },
    
    // ========== HUD ==========
    
    updateHUD() {
        document.getElementById('score-value').textContent = this.score;
        document.getElementById('lives-value').textContent = this.lives;
        document.getElementById('level-value').textContent = this.level;
    },
    
    // ========== RENDERING ==========
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#0f0f1e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw maze
        this.drawMaze();
        
        // Draw particles
        this.drawParticles();
        
        // Draw player
        this.drawPlayer();
        
        // Draw enemies
        this.drawEnemies();
        
        // Draw grace period indicator
        if (this.gracePeriod > 0) {
            this.drawGracePeriod();
        }
    },
    
    drawMaze() {
        const lvlIndex = Math.min(this.level - 1, 5);
        const beerImage = (GAME_IMAGES.beers && GAME_IMAGES.beers[lvlIndex]) || GAME_IMAGES.beer;
        const vodkaImage = (GAME_IMAGES.vodkas && GAME_IMAGES.vodkas[lvlIndex]) || GAME_IMAGES.vodka;
        const powerupImage = (GAME_IMAGES.powerups && GAME_IMAGES.powerups[lvlIndex]) || GAME_IMAGES.powerup;
        const beerEmoji = (CONFIG.EMOJI_BEERS && CONFIG.EMOJI_BEERS[lvlIndex]) || CONFIG.EMOJI_BEER;
        const vodkaEmoji = (CONFIG.EMOJI_VODKAS && CONFIG.EMOJI_VODKAS[lvlIndex]) || CONFIG.EMOJI_VODKA;
        const powerupEmoji = (CONFIG.EMOJI_POWERUPS && CONFIG.EMOJI_POWERUPS[lvlIndex]) || CONFIG.EMOJI_POWERUP;
        
        for (let y = 0; y < CONFIG.ROWS; y++) {
            for (let x = 0; x < CONFIG.COLS; x++) {
                const tile = this.maze[y][x];
                const px = x * this.tileSize;
                const py = y * this.tileSize;
                
                if (tile === CONFIG.TILE_WALL) {
                    this.ctx.fillStyle = '#1a1a3e';
                    this.ctx.fillRect(px, py, this.tileSize, this.tileSize);
                    this.ctx.strokeStyle = '#0066ff';
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeRect(px + 2, py + 2, this.tileSize - 4, this.tileSize - 4);
                    
                } else if (tile === CONFIG.TILE_BEER) {
                    this.drawSpriteOrEmoji(beerImage, beerEmoji, px, py, 0.85);
                    
                } else if (tile === CONFIG.TILE_VODKA) {
                    this.drawSpriteOrEmoji(vodkaImage, vodkaEmoji, px, py, 0.95);
                    
                } else if (tile === CONFIG.TILE_POWERUP) {
                    this.drawSpriteOrEmoji(powerupImage, powerupEmoji, px, py, 1.1);
                }
            }
        }
    },
    
    // Helper per disegnare sprite o emoji
    drawSpriteOrEmoji(image, emoji, px, py, scale = 1) {
        const size = this.tileSize * scale;
        const offsetX = (this.tileSize - size) / 2;
        const offsetY = (this.tileSize - size) / 2;
        
        if (image) {
            this.ctx.drawImage(image, px + offsetX, py + offsetY, size, size);
        } else {
            this.ctx.font = `${size}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(emoji, px + this.tileSize/2, py + this.tileSize/2);
        }
    },
    
    drawPlayer() {
        const playerPx = this.player.x * this.tileSize;
        const playerPy = this.player.y * this.tileSize;
        const size = this.tileSize * 1.3;
        const offset = (this.tileSize - size) / 2;
        
        // Determina quale player emoji/immagine usare in base al livello (0-indexed, max 5)
        const playerIndex = Math.min(this.level - 1, 5);
        const playerEmoji = CONFIG.EMOJI_PLAYERS[playerIndex] || CONFIG.EMOJI_PLAYERS[0];
        const playerImage = GAME_IMAGES.players[playerIndex];
        
        if (this.powerUpActive) {
            this.ctx.shadowColor = '#ffd700';
            this.ctx.shadowBlur = 20;
        }
        
        if (playerImage) {
            this.ctx.drawImage(playerImage, playerPx + offset, playerPy + offset, size, size);
        } else {
            this.ctx.font = `${size}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(playerEmoji, playerPx + this.tileSize/2, playerPy + this.tileSize/2);
        }
        
        this.ctx.shadowBlur = 0;
    },
    
    drawEnemies() {
        this.enemies.forEach((enemy, index) => {
            const enemyPx = enemy.x * this.tileSize;
            const enemyPy = enemy.y * this.tileSize;
            const size = this.tileSize * 1.25;
            const offset = (this.tileSize - size) / 2;
            
            if (this.gracePeriod > 0 && Math.floor(this.gracePeriod / 10) % 2 === 0) {
                this.ctx.globalAlpha = 0.3;
            }
            
            if (enemy.scared) {
                this.ctx.globalAlpha = 0.6;
                this.ctx.shadowColor = '#00ff00';
                this.ctx.shadowBlur = 10;
                
                if (GAME_IMAGES.scared) {
                    this.ctx.drawImage(GAME_IMAGES.scared, enemyPx + offset, enemyPy + offset, size, size);
                } else {
                    this.ctx.font = `${size}px Arial`;
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText(CONFIG.EMOJI_SCARED_ENEMY, enemyPx + this.tileSize/2, enemyPy + this.tileSize/2);
                }
                
                this.ctx.shadowBlur = 0;
                this.ctx.globalAlpha = 1;
            } else {
                this.ctx.shadowColor = '#ff0000';
                this.ctx.shadowBlur = 8;
                
                const enemyImage = GAME_IMAGES.enemy;
                if (enemyImage) {
                    this.ctx.drawImage(enemyImage, enemyPx + offset, enemyPy + offset, size, size);
                } else {
                    this.ctx.font = `${size}px Arial`;
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText(CONFIG.ENEMY_EMOJI, enemyPx + this.tileSize/2, enemyPy + this.tileSize/2);
                }
                
                this.ctx.shadowBlur = 0;
            }
            
            this.ctx.globalAlpha = 1;
        });
    },
    
    drawParticles() {
        this.particles.forEach(p => {
            this.ctx.globalAlpha = p.life / 30;
            this.ctx.font = `${this.tileSize * 0.6}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(p.emoji, p.x, p.y);
        });
        this.ctx.globalAlpha = 1;
    },
    
    drawGracePeriod() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(this.canvas.width/2 - 60, this.canvas.height/2 - 30, 120, 60);
        this.ctx.font = 'bold 40px Arial';
        this.ctx.fillStyle = '#ffd700';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('GO!', this.canvas.width/2, this.canvas.height/2);
    },
    
    // ========== GAME LOOP ==========
    
    gameLoop() {
        if (!this.running || this.paused) return;
        
        // Update grace period
        if (this.gracePeriod > 0) {
            this.gracePeriod--;
        }
        
        // Update power-up timer
        if (this.powerUpActive) {
            this.powerUpTimer--;
            document.getElementById('powerup-indicator').textContent =
                `📜 INVINCIBILE ${Math.max(1, Math.ceil(this.powerUpTimer / 60))}s`;
            if (this.powerUpTimer <= 0) {
                this.powerUpActive = false;
                this.enemies.forEach(e => e.scared = false);
                document.getElementById('powerup-indicator').style.display = 'none';
            }
        }
        
        // Update combo timer
        if (this.comboTimer > 0) {
            this.comboTimer--;
            if (this.comboTimer <= 0 && this.combo > 0) {
                this.resetCombo();
            }
        }
        
        // Update game objects
        this.movePlayer();
        this.moveEnemies();
        this.checkCollisions();
        this.checkLevelComplete();
        this.updateParticles();
        
        // Render
        this.draw();
        
        // Next frame
        requestAnimationFrame(() => this.gameLoop());
    }
};
