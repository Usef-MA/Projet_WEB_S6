// ============================================================
// SOUK DASH — Contrôleur principal
// Machine à états : menu → jeu → pause → transition → gameover/victoire
// ============================================================
import {
    CANVAS_WIDTH, CANVAS_HEIGHT,
    CELL_SIZE, COLS, ROW_GOAL,
    PLAYER_START_COL, PLAYER_START_ROW,
    MAX_LIVES, INVINCIBILITY_DURATION,
    PLAYER_HITBOX_INSET, LEVELS, COLORS
} from '../config/gameConfig.js';

import Player         from '../models/Player.js';
import Obstacle       from '../models/Obstacle.js';
import Score          from '../models/Score.js';
import Level          from '../models/Level.js';

import InputController  from './InputController.js';
import ScoreController  from './ScoreController.js';
import GameRenderer     from '../views/GameRenderer.js';
import SoundService     from '../services/SoundService.js';

// ─── États possibles ─────────────────────────────────────────────────────────
export const STATES = Object.freeze({
    MENU       : 'menu',
    PLAYING    : 'playing',
    PAUSED     : 'paused',
    TRANSITION : 'transition',
    GAMEOVER   : 'gameover',
    VICTORY    : 'victory'
});

export default class GameController {
    /** @param {HTMLCanvasElement} canvas */
    constructor(canvas) {
        this.canvas   = canvas;
        this.ctx      = canvas.getContext('2d');

        // Sous-systèmes
        this.input     = new InputController();
        this.scoreCtrl = new ScoreController();
        this.renderer  = new GameRenderer(this.ctx);
        this.sound     = new SoundService();

        // État de la partie
        this.state        = STATES.MENU;
        this.levelIndex   = 0;
        this.lives        = MAX_LIVES;
        this.score        = new Score();
        this.player       = null;
        this.obstacles    = [];
        this.currentLevel = null;

        // Timers
        this.lastTime           = 0;
        this.animTime           = 0;   // temps total (menu + jeu, pour effets)
        this.stateTimer         = 0;
        this.menuAnimation      = 0;
        this.invincibilityTimer = 0;
        this.isInvincible       = false;
        this.isNewRecord        = false;

        // Effets visuels
        this.flashRed    = 0;   // compte à rebours (s) : éclair rouge collision
        this.scorePopups = [];  // [{ text, age }] — flottent pendant la transition

        // Suivi
        this.completedLevelNum = 0;
        this.lastCrossBonus    = null;
    }

    /**
     * Point d'entrée — précharge les images puis démarre la boucle.
     */
    async init() {
        this._drawLoading();
        await this.renderer.preload();
        this._startLoop();
    }

    /** Affiche un écran de chargement statique (une seule frame). */
    _drawLoading() {
        const { ctx } = this;
        ctx.fillStyle = COLORS.pageBg || '#120700';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.save();
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';

        const cx = CANVAS_WIDTH / 2;
        const cy = CANVAS_HEIGHT / 2;

        ctx.shadowColor = '#D4AF37';
        ctx.shadowBlur  = 20;
        ctx.fillStyle   = '#D4AF37';
        ctx.font        = 'bold 22px Orbitron, Arial';
        ctx.fillText('Chargement…', cx, cy);

        ctx.shadowBlur = 0;
        ctx.fillStyle  = 'rgba(240,234,214,0.4)';
        ctx.font       = '14px Rajdhani, Arial';
        ctx.fillText('Souk Dash — AARO Gaming', cx, cy + 34);
        ctx.restore();
    }

    /** Démarre la boucle requestAnimationFrame. */
    _startLoop() {
        const loop = (timestamp) => {
            const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
            this.lastTime = timestamp;
            this.animTime += dt;
            this._update(dt);
            this._draw();
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }

    // ════════════════════════════════════════════════════════
    // UPDATE
    // ════════════════════════════════════════════════════════
    _update(dt) {
        // H disponible dans tous les états
        if (this.input.consumeHome()) {
            window.location.href = '../frontend/index.html';
            return;
        }

        switch (this.state) {
            case STATES.MENU:       this._updateMenu(dt);       break;
            case STATES.PLAYING:    this._updatePlaying(dt);    break;
            case STATES.PAUSED:     this._updatePaused(dt);     break;
            case STATES.TRANSITION: this._updateTransition(dt); break;
            case STATES.GAMEOVER:   this._updateGameOver(dt);   break;
            case STATES.VICTORY:    this._updateVictory(dt);    break;
        }
    }

    // ── Menu ──────────────────────────────────────────────────────────────────
    _updateMenu(dt) {
        this.menuAnimation += dt;
        if (this.input.consumeAction()) {
            this._startGame();
        }
    }

    // ── Jeu en cours ──────────────────────────────────────────────────────────
    _updatePlaying(dt) {
        // Invincibilité après collision
        if (this.isInvincible) {
            this.invincibilityTimer -= dt;
            if (this.invincibilityTimer <= 0) this.isInvincible = false;
        }

        // Éclair rouge (collision)
        if (this.flashRed > 0) {
            this.flashRed = Math.max(0, this.flashRed - dt);
        }

        // Temps du niveau (pour le bonus)
        this.score.levelElapsedTime += dt;

        // Mouvement joueur
        this._handlePlayerMovement();

        // Mise à jour des obstacles
        this.obstacles.forEach(o => o.update(dt));

        // Détection de collision (seulement si non-invincible)
        if (!this.isInvincible) this._checkCollisions();

        // ESC → pause
        if (this.input.consumeEsc()) {
            this.state = STATES.PAUSED;
            this.input.clearAll();
        }
    }

    // ── Pause ─────────────────────────────────────────────────────────────────
    _updatePaused(dt) {
        // ESC ou Action → reprendre
        if (this.input.consumeEsc() || this.input.consumeAction()) {
            this.state = STATES.PLAYING;
            this.input.clearAll();
            return;
        }
        // R → recommencer
        if (this.input.consumeRestart()) {
            this._startGame();
            return;
        }
        // H est géré globalement en haut de _update()
    }

    // ── Transition inter-niveaux ──────────────────────────────────────────────
    _updateTransition(dt) {
        this.stateTimer += dt;

        // Avancer les popups de score
        this.scorePopups = this.scorePopups
            .map(p => ({ ...p, age: p.age + dt }))
            .filter(p => p.age < 1.6);

        if (this.stateTimer > 2.2) {
            if (this.levelIndex >= LEVELS.length) {
                this._enterVictory();
            } else {
                this._loadLevel(this.levelIndex);
            }
        }
    }

    // ── Game Over ─────────────────────────────────────────────────────────────
    _updateGameOver(dt) {
        this.stateTimer += dt;
        if (this.stateTimer > 1.0 && this.input.consumeAction()) {
            this._startGame();
        }
        if (this.input.consumeEsc() || this.input.consumeRestart()) {
            this._startGame();
        }
    }

    // ── Victoire ──────────────────────────────────────────────────────────────
    _updateVictory(dt) {
        this.stateTimer += dt;
        if (this.stateTimer > 1.5 && this.input.consumeAction()) {
            this._startGame();
        }
        if (this.input.consumeRestart()) {
            this._startGame();
        }
    }

    // ════════════════════════════════════════════════════════
    // MOUVEMENT JOUEUR
    // ════════════════════════════════════════════════════════
    _handlePlayerMovement() {
        const move = this.input.consumeMove();
        if (!move || !this.player) return;

        let col = this.player.col;
        let row = this.player.row;

        switch (move) {
            case 'up':    row--;  break;
            case 'down':  row++;  break;
            case 'left':  col--;  break;
            case 'right': col++;  break;
        }

        this.player.moveTo(col, row);
        this.sound.play('move');

        // Vérifier si l'arrivée est atteinte
        if (this.player.row === ROW_GOAL) {
            this._onLevelComplete();
        }
    }

    // ════════════════════════════════════════════════════════
    // COLLISION
    // ════════════════════════════════════════════════════════
    _checkCollisions() {
        if (!this.player) return;

        const inset = PLAYER_HITBOX_INSET;
        const px = this.player.col * CELL_SIZE + inset;
        const py = this.player.row * CELL_SIZE + inset;
        const pw = CELL_SIZE - inset * 2;
        const ph = CELL_SIZE - inset * 2;

        for (const obs of this.obstacles) {
            const oy = obs.y;
            if (px < obs.x + obs.width &&
                px + pw > obs.x &&
                py < oy + obs.height &&
                py + ph > oy) {
                this._onCollision();
                return;
            }
        }
    }

    // ════════════════════════════════════════════════════════
    // ÉVÉNEMENTS DE JEU
    // ════════════════════════════════════════════════════════
    _onCollision() {
        this.lives--;
        this.score.onDeath();
        this.sound.play('collision');
        this.flashRed = 0.35;

        if (this.lives <= 0) {
            this._enterGameOver();
        } else {
            this.player.reset();
            this.isInvincible       = true;
            this.invincibilityTimer = INVINCIBILITY_DURATION;
        }
    }

    _onLevelComplete() {
        this.completedLevelNum = this.levelIndex + 1;
        this.lastCrossBonus    = this.score.onLevelComplete(this.currentLevel.timeLimit);

        // Popup de score flottant pendant la transition
        const total = this.lastCrossBonus.base + this.lastCrossBonus.timeBonus;
        this.scorePopups.push({ text: `+${total}`, age: 0 });

        this.sound.play('cross');

        this.levelIndex++;
        this.state      = STATES.TRANSITION;
        this.stateTimer = 0;
        this.flashRed   = 0;
        this.input.clearAll();
    }

    // ════════════════════════════════════════════════════════
    // GESTION DES ÉTATS
    // ════════════════════════════════════════════════════════
    _startGame() {
        this.levelIndex  = 0;
        this.lives       = MAX_LIVES;
        this.score.reset();
        this.scorePopups = [];
        this.input.clearAll();
        this._loadLevel(0);
    }

    _loadLevel(index) {
        this.currentLevel = new Level(LEVELS[index]);
        this.player       = new Player(PLAYER_START_COL, PLAYER_START_ROW);

        this.obstacles = [];
        for (const lane of this.currentLevel.lanes) {
            const spacing = CANVAS_WIDTH / lane.count;
            for (let i = 0; i < lane.count; i++) {
                const startX = spacing * i;
                this.obstacles.push(new Obstacle(lane, startX));
            }
        }

        this.isInvincible       = false;
        this.invincibilityTimer = 0;
        this.flashRed           = 0;
        this.scorePopups        = [];
        this.state              = STATES.PLAYING;
        this.input.clearAll();
    }

    _enterGameOver() {
        const total      = this.score.getTotal();
        this.isNewRecord = this.scoreCtrl.saveLocalHighScore(total);
        this.scoreCtrl.submitScore(total);
        this.sound.play('gameover');
        this.state      = STATES.GAMEOVER;
        this.stateTimer = 0;
        this.input.clearAll();
    }

    _enterVictory() {
        this.score.onVictory(this.lives);
        const total      = this.score.getTotal();
        this.isNewRecord = this.scoreCtrl.saveLocalHighScore(total);
        this.scoreCtrl.submitScore(total);
        this.state      = STATES.VICTORY;
        this.stateTimer = 0;
        this.input.clearAll();
    }

    // ════════════════════════════════════════════════════════
    // DRAW
    // ════════════════════════════════════════════════════════
    _draw() {
        this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        switch (this.state) {
            case STATES.MENU:
                this.renderer.drawMenu(
                    this.menuAnimation,
                    this.scoreCtrl.getLocalHighScore()
                );
                break;

            case STATES.PLAYING:
                this.renderer.drawGame(
                    this.currentLevel,
                    this.obstacles,
                    this.player,
                    this.lives,
                    this.score,
                    this.isInvincible,
                    this.invincibilityTimer,
                    this.animTime,
                    this.flashRed
                );
                break;

            case STATES.PAUSED:
                // Jeu en arrière-plan (figé) + overlay pause
                this.renderer.drawGame(
                    this.currentLevel,
                    this.obstacles,
                    this.player,
                    this.lives,
                    this.score,
                    false,
                    0,
                    this.animTime,
                    0
                );
                this.renderer.drawPause(this.score, this.lives);
                break;

            case STATES.TRANSITION: {
                const nextConf = this.levelIndex < LEVELS.length ? LEVELS[this.levelIndex] : null;
                this.renderer.drawLevelTransition(
                    nextConf,
                    this.completedLevelNum,
                    this.stateTimer,
                    this.score.getTotal(),
                    this.lastCrossBonus,
                    this.scorePopups
                );
                break;
            }

            case STATES.GAMEOVER:
                this.renderer.drawGameOver(
                    this.score.getTotal(),
                    this.scoreCtrl.getLocalHighScore(),
                    this.stateTimer,
                    this.isNewRecord
                );
                break;

            case STATES.VICTORY:
                this.renderer.drawVictory(
                    this.score.getTotal(),
                    this.scoreCtrl.getLocalHighScore(),
                    this.stateTimer,
                    this.isNewRecord
                );
                break;
        }
    }
}
