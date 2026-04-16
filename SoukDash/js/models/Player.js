// ============================================================
// SOUK DASH — Modèle Player
// Représente la position et l'état du joueur sur la grille.
// ============================================================
import { COLS, ROWS, PLAYER_START_COL, PLAYER_START_ROW } from '../config/gameConfig.js';

export default class Player {
    /**
     * @param {number} col - colonne de départ (0-indexed)
     * @param {number} row - ligne de départ (0-indexed)
     */
    constructor(col = PLAYER_START_COL, row = PLAYER_START_ROW) {
        this.startCol = col;
        this.startRow = row;
        this.col = col;
        this.row = row;
    }

    /**
     * Déplace le joueur vers une nouvelle position, en restant dans la grille.
     * @param {number} newCol
     * @param {number} newRow
     */
    moveTo(newCol, newRow) {
        this.col = Math.max(0, Math.min(COLS - 1, newCol));
        this.row = Math.max(0, Math.min(ROWS - 1, newRow));
    }

    /** Remet le joueur à la position de départ. */
    reset() {
        this.col = this.startCol;
        this.row = this.startRow;
    }

    /**
     * Retourne le centre X en pixels.
     * @param {number} cellSize
     */
    getCenterX(cellSize) {
        return this.col * cellSize + cellSize / 2;
    }

    /**
     * Retourne le centre Y en pixels.
     * @param {number} cellSize
     */
    getCenterY(cellSize) {
        return this.row * cellSize + cellSize / 2;
    }
}
