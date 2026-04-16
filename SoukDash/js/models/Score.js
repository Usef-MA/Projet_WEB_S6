// ============================================================
// SOUK DASH — Modèle Score
// Calcul du score : traversée, bonus temps, bonus vies.
// ============================================================
import {
    SCORE_PER_CROSS,
    SCORE_TIME_BONUS_MAX,
    SCORE_LIFE_BONUS
} from '../config/gameConfig.js';

export default class Score {
    constructor() {
        this.total           = 0;
        this.levelElapsedTime = 0;  // temps écoulé sur le niveau en cours
        this.deathCount      = 0;
        this._lastCrossBonus = null; // détail du dernier bonus (pour l'affichage)
    }

    /** Remet tout à zéro (nouvelle partie). */
    reset() {
        this.total            = 0;
        this.levelElapsedTime = 0;
        this.deathCount       = 0;
        this._lastCrossBonus  = null;
    }

    /**
     * Appelé quand le joueur atteint l'arrivée d'un niveau.
     * @param {number} timeLimit - temps limite du niveau en secondes
     * @returns {{base:number, timeBonus:number}} — détails pour l'affichage
     */
    onLevelComplete(timeLimit) {
        const base = SCORE_PER_CROSS;
        const ratio = Math.max(0, 1 - this.levelElapsedTime / timeLimit);
        const timeBonus = Math.floor(SCORE_TIME_BONUS_MAX * ratio);

        this.total += base + timeBonus;
        this.levelElapsedTime = 0;

        this._lastCrossBonus = { base, timeBonus };
        return this._lastCrossBonus;
    }

    /**
     * Appelé quand le joueur remporte la victoire finale.
     * @param {number} livesRemaining
     */
    onVictory(livesRemaining) {
        const lifeBonus = livesRemaining * SCORE_LIFE_BONUS;
        this.total += lifeBonus;
        return lifeBonus;
    }

    /** Enregistre une mort (statistique). */
    onDeath() {
        this.deathCount++;
    }

    /** Retourne le score total arrondi. */
    getTotal() {
        return Math.floor(this.total);
    }

    /** Retourne les détails du dernier bonus de traversée. */
    getLastCrossBonus() {
        return this._lastCrossBonus;
    }
}
