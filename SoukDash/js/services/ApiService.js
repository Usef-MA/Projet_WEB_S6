// ============================================================
// SOUK DASH — Service API
// Toutes les communications avec le backend AARO Gaming.
// ============================================================

const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:4000'
    : 'https://projet-web-s6.onrender.com';

const GAME_ID = 'soukdash'; // identifiant du jeu côté base de données

const ApiService = {
    /**
     * Soumet un score au backend.
     * Requiert un JWT valide dans sessionStorage ou localStorage.
     * @param {number} score
     * @returns {Promise<boolean>} true si envoyé avec succès
     */
    async submitScore(score) {
        const token = sessionStorage.getItem('aaroToken') || localStorage.getItem('aaroToken');
        if (!token) return false;

        try {
            const res = await fetch(`${API_URL}/scores`, {
                method : 'POST',
                headers: {
                    'Content-Type' : 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ jeu: GAME_ID, score: Math.floor(score) })
            });
            return res.ok;
        } catch (err) {
            console.warn('[SoukDash] Score non envoyé :', err.message);
            return false;
        }
    },

    /**
     * Récupère le leaderboard du jeu.
     * @returns {Promise<Array>} tableau trié par score décroissant
     */
    async getLeaderboard() {
        try {
            const res  = await fetch(`${API_URL}/scores/${GAME_ID}`);
            const data = await res.json();
            return Array.isArray(data) ? data : [];
        } catch (err) {
            console.warn('[SoukDash] Leaderboard non chargé :', err.message);
            return [];
        }
    },

    /** Indique si un token est présent (connexion probable). */
    isAuthenticated() {
        return !!(sessionStorage.getItem('aaroToken') || localStorage.getItem('aaroToken'));
    }
};

export default ApiService;
