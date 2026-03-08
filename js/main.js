// ============================================
// MAIN - UI AND EVENT HANDLERS
// ============================================

// Controllo fisso su swipe
const currentControlMode = 'swipe';
let toastTimer = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    Game.init();
    LeaderboardManager.init();

    setupEventListeners();
    checkTutorial();
    
    // Applica icone UI: subito se config già pronta, altrimenti aspetta evento
    if (ADMIN_CONFIG) {
        applyUIIcons();
    }
    window.addEventListener('gameConfigReady', applyUIIcons);
    
    // Avvia musica titolo (si sblocca al primo tocco dell'utente grazie a AudioManager.setupUnlockListeners)
    AudioManager.playTitleMusic();
});

// Applica icone UI dalla configurazione admin
function applyUIIcons() {
    if (!ADMIN_CONFIG) return;
    
    // Applica icone UI (stringa vuota = campo vuoto intenzionale)
    if (ADMIN_CONFIG.uiIcons) {
        const icons = ADMIN_CONFIG.uiIcons;
        
        // Schermata titolo
        const setIcon = (id, value) => {
            const el = document.getElementById(id);
            if (el && value !== undefined) el.textContent = value;
        };
        
        setIcon('icon-title-left', icons.title);
        setIcon('icon-title-right', icons.title);
        setIcon('icon-date', icons.date);
        setIcon('icon-location', icons.location);
        setIcon('icon-leaderboard', icons.leaderboard);
        setIcon('icon-swipe', icons.swipe);
        
        // HUD in-game
        setIcon('icon-hud-score', icons.score);
        setIcon('icon-hud-level', icons.level);
        setIcon('icon-hud-lives', icons.lives);
    }
    
    // Istruzioni (usa emoji dai personaggi se disponibili)
    if (ADMIN_CONFIG.emojis) {
        const setIcon = (id, value) => {
            const el = document.getElementById(id);
            if (el && value !== undefined) el.textContent = value;
        };
        setIcon('icon-inst-beer', ADMIN_CONFIG.emojis.beer);
        setIcon('icon-inst-enemy', ADMIN_CONFIG.emojis.enemy);
        setIcon('icon-inst-powerup', ADMIN_CONFIG.emojis.powerup);
        setIcon('icon-powerup-active', ADMIN_CONFIG.emojis.powerup);
    }
    
    // Applica logo dal server (images.logo o event.logo)
    const logoUrl = (ADMIN_CONFIG.images && ADMIN_CONFIG.images.logo) || 
                    (ADMIN_CONFIG.event && ADMIN_CONFIG.event.logo);
    if (logoUrl) {
        const logoContainer = document.getElementById('event-logo-container');
        const logoImg = document.getElementById('event-logo');
        if (logoContainer && logoImg) {
            logoImg.src = logoUrl;
            logoContainer.style.display = 'block';
        }
    }
    
    // Applica testi evento dal server (modifica solo gli span di testo, non le icone)
    if (ADMIN_CONFIG.event) {
        const cfg = ADMIN_CONFIG.event;
        const textTitle = document.getElementById('text-title');
        const textDate = document.getElementById('text-date');
        const textLoc = document.getElementById('text-location');
        
        if (cfg.title !== undefined && textTitle) textTitle.textContent = cfg.title;
        if (cfg.date !== undefined && textDate) textDate.textContent = cfg.date;
        if (cfg.location !== undefined && textLoc) textLoc.textContent = cfg.location;
        
        // Aggiorna titolo pagina e favicon dal logo
        if (cfg.title) document.title = cfg.title + ' - The Game';
        if (cfg.logo) {
            const faviconEl = document.getElementById('favicon-link');
            if (faviconEl) {
                faviconEl.href = cfg.logo;
                faviconEl.type = 'image/png';
            }
        }
    }
}

function applyControlMode() {
    // Solo swipe mode - funzione mantenuta per compatibilità
}

// Check if tutorial has been completed
function checkTutorial() {
    const tutorialDone = localStorage.getItem(CONFIG.STORAGE_TUTORIAL);
    if (!tutorialDone) {
        // Tutorial will be shown when user taps play.
    }
}

// Show tutorial
function showTutorial() {
    const overlay = document.getElementById('tutorial-overlay');
    const steps = Array.from(document.querySelectorAll('.tutorial-step'));
    const progress = document.getElementById('tutorial-progress');
    const skipBtn = document.getElementById('tutorial-skip-btn');
    let currentStep = 1;

    const finishTutorial = () => {
        localStorage.setItem(CONFIG.STORAGE_TUTORIAL, 'true');
        overlay.classList.remove('active');
        actuallyStartGame();
    };

    const updateStep = () => {
        steps.forEach((step) => {
            step.style.display = step.dataset.step === String(currentStep) ? 'block' : 'none';
        });
        if (progress) {
            progress.textContent = `${currentStep} / ${steps.length}`;
        }
    };

    overlay.classList.add('active');
    updateStep();

    skipBtn.onclick = finishTutorial;

    document.querySelectorAll('.tutorial-next').forEach((btn) => {
        btn.onclick = () => {
            currentStep = Math.min(currentStep + 1, steps.length);
            updateStep();
        };
    });

    const startBtn = document.querySelector('.tutorial-start');
    if (startBtn) {
        startBtn.onclick = finishTutorial;
    }
}

function setupEventListeners() {
    // ========== TITLE SCREEN ==========
    document.getElementById('start-btn').addEventListener('click', () => {
        const tutorialDone = localStorage.getItem(CONFIG.STORAGE_TUTORIAL);
        if (!tutorialDone) {
            enterFullscreen();
            setTimeout(showTutorial, 100);
        } else {
            enterFullscreenAndStart();
        }
    });

    document.getElementById('leaderboard-btn').addEventListener('click', async () => {
        const result = await LeaderboardManager.loadLeaderboard(10);
        if (result.success) {
            LeaderboardManager.displayLeaderboard(result.scores);
            LeaderboardManager.showLeaderboardScreen();
        } else {
            showToast('Impossibile caricare la classifica.');
        }
    });

    // ========== GAME CONTROLS ==========
    document.getElementById('pause-btn').addEventListener('click', () => {
        Game.pause();
        applyControlMode();
    });

    document.getElementById('resume-btn').addEventListener('click', () => {
        Game.resume();
        applyControlMode();
    });

    document.getElementById('restart-from-pause-btn').addEventListener('click', () => {
        document.getElementById('pause-overlay').classList.remove('active');
        Game.restart();
        applyControlMode();
    });

    document.getElementById('quit-btn').addEventListener('click', () => {
        document.getElementById('pause-overlay').classList.remove('active');
        goToTitle();
    });

    // ========== GAME OVER SCREEN ==========
    document.getElementById('retry-btn').addEventListener('click', () => {
        restartGame();
    });

    document.getElementById('leaderboard-from-overlay-btn').addEventListener('click', () => {
        document.getElementById('overlay').classList.remove('active');
        document.getElementById('nickname-screen').classList.add('active');
    });

    document.getElementById('menu-btn').addEventListener('click', () => {
        goToTitle();
    });

    // ========== NICKNAME SCREEN ==========
    document.getElementById('submit-score-btn').addEventListener('click', () => {
        submitScore();
    });

    document.getElementById('skip-leaderboard-btn').addEventListener('click', () => {
        skipLeaderboard();
    });

    document.getElementById('nickname-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            submitScore();
        }
    });

    // ========== LEADERBOARD SCREEN ==========
    document.getElementById('play-from-leaderboard-btn').addEventListener('click', () => {
        LeaderboardManager.hideLeaderboardScreen();
        enterFullscreenAndStart();
    });

    document.getElementById('close-leaderboard-btn').addEventListener('click', () => {
        LeaderboardManager.hideLeaderboardScreen();
        goToTitle();
    });

    // ========== CONTROLS ==========
    setupKeyboardControls();
    setupSwipeControls();

    // Prevent default touch behavior only during gameplay on control surfaces.
    document.addEventListener('touchmove', (e) => {
        if (!document.body.classList.contains('in-game')) return;

        if (e.target.closest('#leaderboard-screen') ||
            e.target.closest('#tutorial-overlay') ||
            e.target.closest('#nickname-screen') ||
            e.target.closest('#pause-overlay')) {
            return;
        }

        if (e.target.closest('#gameCanvas')) {
            e.preventDefault();
        }
    }, { passive: false });
}

// ========== FULLSCREEN ==========

function enterFullscreen() {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(() => {});
    } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
    }

    // Lock to portrait if supported
    if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('portrait').catch(() => {});
    }
}

function enterFullscreenAndStart() {
    enterFullscreen();
    setTimeout(() => {
        Game.calculateTileSize();
        startGame();
    }, 100);
}

function actuallyStartGame() {
    Game.calculateTileSize();
    startGame();
}

// ========== GAME FLOW FUNCTIONS ==========

function startGame() {
    AudioManager.stopTitleMusic();  // Ferma musica title
    document.getElementById('title-screen').style.display = 'none';
    document.getElementById('game-container').classList.add('active');
    document.body.classList.add('in-game');

    Game.start();
    applyControlMode();
}

function restartGame() {
    document.getElementById('overlay').classList.remove('active');
    document.getElementById('game-container').classList.add('active');
    document.body.classList.add('in-game');

    Game.restart();
    applyControlMode();
}

function goToTitle() {
    document.getElementById('overlay').classList.remove('active');
    document.getElementById('pause-overlay').classList.remove('active');
    document.getElementById('nickname-screen').classList.remove('active');
    LeaderboardManager.hideLeaderboardScreen();
    document.getElementById('game-container').classList.remove('active');
    document.getElementById('title-screen').style.display = 'flex';
    document.body.classList.remove('in-game');
    Game.running = false;
    Game.paused = false;

    AudioManager.playTitleMusic();  // Riavvia musica title
    applyControlMode();
}

// ========== LEADERBOARD FUNCTIONS ==========

async function submitScore() {
    const nickname = document.getElementById('nickname-input').value.trim();

    if (!nickname) {
        const input = document.getElementById('nickname-input');
        input.focus();
        input.style.borderColor = '#ff4444';
        showToast('Inserisci un nickname.');
        setTimeout(() => {
            input.style.borderColor = '#ffd700';
        }, 1000);
        return;
    }

    const result = await LeaderboardManager.submitScore(nickname, Game.score, Game.level);

    document.getElementById('nickname-screen').classList.remove('active');

    if (result.success) {
        LeaderboardManager.displayLeaderboard(
            result.scores,
            result.position,
            nickname,
            Game.score
        );
        LeaderboardManager.showLeaderboardScreen();
    } else {
        showToast('Errore salvataggio punteggio.');
        loadAndShowLeaderboard();
    }
}

function skipLeaderboard() {
    document.getElementById('nickname-screen').classList.remove('active');
    loadAndShowLeaderboard();
}

async function loadAndShowLeaderboard() {
    const result = await LeaderboardManager.loadLeaderboard(10);

    if (result.success) {
        LeaderboardManager.displayLeaderboard(result.scores);
        LeaderboardManager.showLeaderboardScreen();
    } else {
        showToast('Classifica non disponibile.');
        showGameOverOverlay();
    }
}

function showGameOverOverlay() {
    document.getElementById('overlay-title').textContent = '💀 GAME OVER';
    document.getElementById('final-score').textContent = Game.score;
    document.getElementById('high-score').textContent = Game.highScore;
    document.getElementById('overlay').classList.add('active');
}

function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('active');

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.remove('active');
    }, 2200);
}

// ========== MOVEMENT FUNCTION ==========

function moveInDirection(dx, dy) {
    if (!Game.running || Game.paused) return;

    Game.player.nextDirection = { x: dx, y: dy };
}

// ========== KEYBOARD CONTROLS ==========
// Solo controlli di pausa, movimento solo via swipe/dpad

function setupKeyboardControls() {
    document.addEventListener('keydown', (e) => {
        // Allow space to resume from pause
        if (e.key === ' ' && Game.paused) {
            e.preventDefault();
            Game.resume();
            applyControlMode();
            return;
        }

        if (!Game.running || Game.paused) return;
        if (e.repeat) return;

        // Solo pausa con Escape, P o Space
        switch (e.key) {
            case 'Escape':
            case 'p':
            case 'P':
            case ' ':
                e.preventDefault();
                Game.pause();
                applyControlMode();
                return;
        }
    });
}

// ========== SWIPE CONTROLS ==========

function setupSwipeControls() {
    let touchStartX = 0;
    let touchStartY = 0;
    let lastSwipeTime = 0;
    const swipeThrottle = 120; // milliseconds between swipes

    const canvas = document.getElementById('gameCanvas');

    canvas.addEventListener('touchstart', (e) => {
        if (!Game.running || Game.paused || currentControlMode !== 'swipe') return;

        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
        if (!Game.running || Game.paused || currentControlMode !== 'swipe') return;

        const now = Date.now();
        if (now - lastSwipeTime < swipeThrottle) return;

        const touchCurrentX = e.touches[0].clientX;
        const touchCurrentY = e.touches[0].clientY;

        const diffX = touchCurrentX - touchStartX;
        const diffY = touchCurrentY - touchStartY;

        const minSwipe = 18;

        if (Math.abs(diffX) > minSwipe || Math.abs(diffY) > minSwipe) {
            lastSwipeTime = now;

            if (Math.abs(diffX) > Math.abs(diffY)) {
                moveInDirection(diffX > 0 ? 1 : -1, 0);
            } else {
                moveInDirection(0, diffY > 0 ? 1 : -1);
            }

            touchStartX = touchCurrentX;
            touchStartY = touchCurrentY;
        }
    }, { passive: true });
}
