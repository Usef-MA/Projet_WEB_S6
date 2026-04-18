// AARO Gaming — Score Manager pour Billard Marocain
// Même pattern que MarocRunner/ScoreManager et SoukDash/ApiService.

const _BILLARD_API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:4000'
    : 'https://projet-web-s6.onrender.com';

const _BILLARD_GAME_ID = 'billard';
const _BILLARD_LS_KEY  = 'billardHighScore';

window.BillardScoreManager = {
    _localHighScore: parseInt(localStorage.getItem(_BILLARD_LS_KEY) || '0', 10),

    /**
     * Calcule le score d'une victoire.
     * Plus la partie est rapide et difficile, plus le score est élevé.
     * @param {number} duration  secondes
     * @param {string} difficulty 'easy' | 'medium' | 'hard'
     */
    computeScore(duration, difficulty) {
        const mult = { easy: 1, medium: 1.5, hard: 2 }[difficulty] || 1;
        return Math.max(100, Math.round((2000 - duration * 3) * mult));
    },

    /** Sauvegarde localement si nouveau record. Retourne true si record. */
    saveLocalHighScore(score) {
        if (score > this._localHighScore) {
            this._localHighScore = score;
            localStorage.setItem(_BILLARD_LS_KEY, score);
            return true;
        }
        return false;
    },

    getLocalHighScore() {
        return this._localHighScore;
    },

    /** Indique si un token AARO est présent. */
    isAuthenticated() {
        return !!(sessionStorage.getItem('aaroToken') || localStorage.getItem('aaroToken'));
    },

    /** Envoie le score au backend AARO. Silencieux si non connecté ou si backend inaccessible. */
    async submitScore(score) {
        const token = sessionStorage.getItem('aaroToken') || localStorage.getItem('aaroToken');
        if (!token) {
            console.info('[Billard] Non connecté — score sauvegardé localement uniquement.');
            return false;
        }
        try {
            const res = await fetch(`${_BILLARD_API_URL}/scores`, {
                method : 'POST',
                headers: {
                    'Content-Type' : 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ jeu: _BILLARD_GAME_ID, score: Math.floor(score) })
            });
            return res.ok;
        } catch (err) {
            // Backend inaccessible — score local conservé, pas de crash
            console.warn('[Billard] Score non envoyé (backend inaccessible) :', err.message);
            return false;
        }
    }
};
