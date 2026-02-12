// ============================================
// AUDIO MANAGER
// ============================================

const AudioManager = {
    sounds: {},
    musicEnabled: true,
    soundEnabled: true,
    audioUnlocked: false,
    unlockHandlersBound: false,
    audioContext: null,
    
    init() {
        // Load settings from localStorage
        const settings = JSON.parse(localStorage.getItem(CONFIG.STORAGE_SETTINGS) || '{}');
        this.musicEnabled = settings.musicEnabled !== false;
        this.soundEnabled = settings.soundEnabled !== false;

        this.createAudioContext();
        this.setupUnlockListeners();
    },

    createAudioContext() {
        if (this.audioContext) return;
        if (!(window.AudioContext || window.webkitAudioContext)) return;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
            this.audioContext = null;
        }
    },

    setupUnlockListeners() {
        if (this.unlockHandlersBound) return;

        const unlock = () => {
            this.unlockAudio().catch(() => {});
        };

        this._unlockHandler = unlock;
        this.unlockHandlersBound = true;

        // Mobile browsers require explicit user gesture before audio can play.
        window.addEventListener('pointerdown', unlock, { passive: true });
        window.addEventListener('touchstart', unlock, { passive: true });
        window.addEventListener('click', unlock, { passive: true });
        window.addEventListener('keydown', unlock, { passive: true });
    },

    removeUnlockListeners() {
        if (!this.unlockHandlersBound || !this._unlockHandler) return;

        window.removeEventListener('pointerdown', this._unlockHandler);
        window.removeEventListener('touchstart', this._unlockHandler);
        window.removeEventListener('click', this._unlockHandler);
        window.removeEventListener('keydown', this._unlockHandler);
        this.unlockHandlersBound = false;
    },

    async unlockAudio() {
        this.createAudioContext();
        if (!this.audioContext) return;

        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        // Play a nearly silent pulse to unlock audio output on iOS/Safari.
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = 0.0001;
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.01);

        this.audioUnlocked = true;
        this.removeUnlockListeners();
    },
    
    // Play a simple beep
    playBeep(frequency, duration, volume = 0.3) {
        if (!this.soundEnabled) return;
        this.createAudioContext();
        if (!this.audioContext) return;
        
        try {
            // Resume context if suspended (mobile requirement)
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume().catch(() => {});
                // If still suspended, skip this beep and wait for unlock gesture.
                if (this.audioContext.state === 'suspended') return;
            }
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = 'square';
            
            gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        } catch (e) {
            console.log('Error playing sound:', e);
        }
    },
    
    // Sound effects
    playCollect() {
        this.playBeep(800, 0.1, 0.2);
    },
    
    playVodka() {
        this.playBeep(1000, 0.15, 0.3);
        setTimeout(() => this.playBeep(1200, 0.15, 0.3), 100);
    },
    
    playPowerUp() {
        this.playBeep(400, 0.1, 0.3);
        setTimeout(() => this.playBeep(600, 0.1, 0.3), 100);
        setTimeout(() => this.playBeep(800, 0.2, 0.3), 200);
    },
    
    playEatGhost() {
        this.playBeep(1200, 0.1, 0.3);
        setTimeout(() => this.playBeep(1400, 0.1, 0.3), 80);
        setTimeout(() => this.playBeep(1600, 0.15, 0.3), 160);
    },
    
    playDeath() {
        this.playBeep(600, 0.1, 0.3);
        setTimeout(() => this.playBeep(500, 0.1, 0.3), 100);
        setTimeout(() => this.playBeep(400, 0.1, 0.3), 200);
        setTimeout(() => this.playBeep(300, 0.3, 0.3), 300);
    },
    
    playLevelComplete() {
        this.playBeep(600, 0.1, 0.3);
        setTimeout(() => this.playBeep(800, 0.1, 0.3), 100);
        setTimeout(() => this.playBeep(1000, 0.1, 0.3), 200);
        setTimeout(() => this.playBeep(1200, 0.2, 0.3), 300);
    },
    
    playCombo() {
        this.playBeep(1000, 0.08, 0.2);
    },
    
    // Toggle functions
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        this.saveSettings();
        return this.soundEnabled;
    },
    
    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        this.saveSettings();
        return this.musicEnabled;
    },
    
    saveSettings() {
        const settings = {
            soundEnabled: this.soundEnabled,
            musicEnabled: this.musicEnabled
        };
        localStorage.setItem(CONFIG.STORAGE_SETTINGS, JSON.stringify(settings));
    }
};

// Vibration helper
const VibrationManager = {
    enabled: true,
    
    init() {
        const settings = JSON.parse(localStorage.getItem(CONFIG.STORAGE_SETTINGS) || '{}');
        this.enabled = settings.vibrationEnabled !== false;
    },
    
    vibrate(duration) {
        if (this.enabled && navigator.vibrate) {
            navigator.vibrate(duration);
        }
    },
    
    toggle() {
        this.enabled = !this.enabled;
        const settings = JSON.parse(localStorage.getItem(CONFIG.STORAGE_SETTINGS) || '{}');
        settings.vibrationEnabled = this.enabled;
        localStorage.setItem(CONFIG.STORAGE_SETTINGS, JSON.stringify(settings));
        return this.enabled;
    }
};
