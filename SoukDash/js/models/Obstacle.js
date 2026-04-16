// ============================================================
// SOUK DASH — Modèle Obstacle
// Un obstacle se déplace horizontalement dans son couloir.
// ============================================================
import { CANVAS_WIDTH, CELL_SIZE } from '../config/gameConfig.js';

export default class Obstacle {
    /**
     * @param {Object} laneConfig - config du couloir (row, dir, speed, color, width, type, label)
     * @param {number} startX     - position X initiale (bord gauche de l'obstacle)
     */
    constructor(laneConfig, startX) {
        this.row    = laneConfig.row;
        this.dir    = laneConfig.dir;    // 1 = droite, -1 = gauche
        this.speed  = laneConfig.speed;  // pixels/seconde
        this.color  = laneConfig.color;
        this.width  = laneConfig.width;
        this.height = CELL_SIZE - 14;    // légèrement plus petit que la cellule
        this.type   = laneConfig.type;
        this.x      = startX;
    }

    /**
     * Met à jour la position de l'obstacle.
     * Reboucle quand il sort du canvas.
     * @param {number} dt - delta time en secondes
     */
    update(dt) {
        this.x += this.dir * this.speed * dt;

        // Wrap : sort à droite → réapparaît à gauche
        if (this.dir === 1 && this.x > CANVAS_WIDTH) {
            this.x = -this.width - 5;
        }
        // Wrap : sort à gauche → réapparaît à droite
        if (this.dir === -1 && this.x + this.width < 0) {
            this.x = CANVAS_WIDTH + 5;
        }
    }

    /** Retourne le Y du bord supérieur (centré dans la cellule). */
    get y() {
        return this.row * CELL_SIZE + (CELL_SIZE - this.height) / 2;
    }
}
