// ============================================
// LEADERBOARD MANAGER - SHARED API + LOCAL FALLBACK
// ============================================

const LeaderboardManager = {
    currentPosition: null,
    currentNickname: null,
    scores: [],

    async init() {
        const saved = localStorage.getItem(CONFIG.STORAGE_LEADERBOARD);
        if (saved) {
            try {
                this.scores = JSON.parse(saved);
            } catch (e) {
                this.scores = [];
            }
        } else {
            this.scores = [];
        }
    },

    saveToStorage() {
        localStorage.setItem(CONFIG.STORAGE_LEADERBOARD, JSON.stringify(this.scores));
    },

    async fetchJson(url, options = {}) {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
    },

    // Fallback locale in caso il server non sia raggiungibile
    submitScoreLocal(nickname, score, level) {
        const newEntry = {
            nickname: this.sanitizeNickname(nickname),
            score,
            level,
            created_at: new Date().toISOString()
        };

        this.scores.push(newEntry);
        this.scores.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return new Date(a.created_at) - new Date(b.created_at);
        });

        if (this.scores.length > 100) {
            this.scores = this.scores.slice(0, 100);
        }

        this.saveToStorage();

        const position = this.scores.findIndex((s) =>
            s.nickname === newEntry.nickname &&
            s.score === newEntry.score &&
            s.created_at === newEntry.created_at
        ) + 1;

        return {
            success: true,
            position,
            scores: this.scores.slice(0, 10),
            source: 'local'
        };
    },

    async submitScore(nickname, score, level) {
        const sanitizedNickname = this.sanitizeNickname(nickname);

        try {
            const payload = {
                nickname: sanitizedNickname,
                score,
                level
            };

            const result = await this.fetchJson(CONFIG.LEADERBOARD_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (result.success && Array.isArray(result.scores)) {
                this.scores = result.scores;
                this.saveToStorage();
            }

            this.currentPosition = result.position || null;
            this.currentNickname = sanitizedNickname;

            return {
                success: !!result.success,
                position: result.position || null,
                scores: Array.isArray(result.scores) ? result.scores : [],
                source: 'server'
            };
        } catch (error) {
            console.warn('Server classifica non raggiungibile, uso fallback locale:', error);
            await this.init();
            return this.submitScoreLocal(sanitizedNickname, score, level);
        }
    },

    async loadLeaderboard(limit = 10) {
        const safeLimit = Math.max(1, Math.min(100, limit));

        try {
            const result = await this.fetchJson(`${CONFIG.LEADERBOARD_API}?limit=${safeLimit}`);

            if (result.success && Array.isArray(result.scores)) {
                this.scores = result.scores;
                this.saveToStorage();
                return {
                    success: true,
                    scores: result.scores,
                    source: 'server'
                };
            }

            throw new Error('Payload classifica non valido');
        } catch (error) {
            console.warn('Server classifica non raggiungibile, uso fallback locale:', error);
            await this.init();
            return {
                success: true,
                scores: this.scores.slice(0, safeLimit),
                source: 'local'
            };
        }
    },

    displayLeaderboard(scores, playerPosition = null, playerNickname = null, playerScore = null) {
        const list = document.getElementById('leaderboard-list');
        const positionEl = document.getElementById('your-position');

        list.innerHTML = '';

        if (playerPosition) {
            positionEl.textContent = `Sei al ${playerPosition}° posto!`;
            positionEl.style.display = 'block';
        } else {
            positionEl.style.display = 'none';
        }

        if (!scores || scores.length === 0) {
            list.innerHTML = '<p style="color: rgba(255,255,255,0.5); text-align: center; padding: 20px;">Nessun punteggio ancora. Sii il primo!</p>';
            return;
        }

        scores.forEach((entry, index) => {
            const rank = index + 1;
            const isPlayer = playerNickname &&
                           entry.nickname === playerNickname &&
                           entry.score === playerScore;

            let rankClass = '';
            let rankIcon = rank;
            if (rank === 1) { rankClass = 'gold'; rankIcon = '🥇'; }
            else if (rank === 2) { rankClass = 'silver'; rankIcon = '🥈'; }
            else if (rank === 3) { rankClass = 'bronze'; rankIcon = '🥉'; }

            const entryEl = document.createElement('div');
            entryEl.className = 'leaderboard-entry' + (isPlayer ? ' highlight' : '');
            entryEl.innerHTML = `
                <div class="rank ${rankClass}">${rankIcon}</div>
                <div class="player-info">
                    <div class="player-name">${this.escapeHtml(entry.nickname)}</div>
                    <div class="player-level">Livello ${entry.level}</div>
                </div>
                <div class="player-score">${entry.score}</div>
            `;
            list.appendChild(entryEl);
        });
    },

    sanitizeNickname(nickname) {
        nickname = nickname.replace(/<[^>]*>/g, '').trim();
        if (nickname.length > 20) nickname = nickname.substring(0, 20);
        nickname = nickname.replace(/[<>"']/g, '');
        return nickname || 'Anonimo';
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    showLeaderboardScreen() {
        document.getElementById('leaderboard-screen').classList.add('active');
    },

    hideLeaderboardScreen() {
        document.getElementById('leaderboard-screen').classList.remove('active');
        this.currentPosition = null;
        this.currentNickname = null;
    },

    clearAll() {
        this.scores = [];
        this.saveToStorage();
    }
};
