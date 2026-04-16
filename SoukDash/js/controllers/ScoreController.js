// ============================================================
// SOUK DASH — Contrôleur de score
// Gère le high score local et l'envoi au backend.
// ============================================================
import ApiService from '../services/ApiService.js';

const LS_KEY = 'soukDashHighScore';

export default class ScoreController {
    constructor() {
        this._localHighScore = this._loadLocal();
    }

    // ─── High score local ────────────────────────────────────────────────────

    _loadLocal() {
        const s = localStorage.getItem(LS_KEY);
        return s ? parseInt(s, 10) : 0;
    }

    /**
     * Sauvegarde si le score est un nouveau record local.
     * @param {number} score
     * @returns {boolean} true si nouveau record
     */
    saveLocalHighScore(score) {
        if (score > this._localHighScore) {
            this._localHighScore = score;
            localStorage.setItem(LS_KEY, score);
            return true;
        }
        return false;
    }

    getLocalHighScore() {
        return this._localHighScore;
    }

    // ─── Envoi au backend ────────────────────────────────────────────────────

    /**
     * Envoie le score au backend AARO Gaming (silencieux si non connecté).
     * @param {number} score
     */
    async submitScore(score) {
        if (!ApiService.isAuthenticated()) return;
        await ApiService.submitScore(score);
    }
}
