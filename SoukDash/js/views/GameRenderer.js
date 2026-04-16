// ============================================================
// SOUK DASH — Rendu canvas
// Dessine toutes les vues : menu, jeu, pause, transitions, fin.
// Aucune logique de jeu ici — uniquement du rendu.
// ============================================================
import {
    CELL_SIZE, COLS, ROWS,
    CANVAS_WIDTH, CANVAS_HEIGHT,
    ROW_GOAL, ROW_SAFE, ROW_START,
    COLORS, LEVELS
} from '../config/gameConfig.js';

// Chemins relatifs à index.html (racine de SoukDash/)
const IMAGE_SOURCES = {
    player    : './assets/images/player.png',
    charrette : './assets/images/charrette.png',
    moto      : './assets/images/moto.png',
    voiture   : './assets/images/voiture.png',
    passant   : './assets/images/passant.png',
    velo      : './assets/images/velo.png',
    porteur   : './assets/images/porteur.png',
    foule     : './assets/images/foule.png',
};

// Couleur locale pour la zone d'arrivée (vert médina)
const GOAL_BG    = '#1A4A28';
const GOAL_ARCH  = '#2E7A3A';
const START_BG   = '#5C3008';

export default class GameRenderer {
    /** @param {CanvasRenderingContext2D} ctx */
    constructor(ctx) {
        this.ctx    = ctx;
        this.images = {};

        // État courant partagé avec les helpers (mis à jour dans drawGame)
        this._animTime = 0;
        this._levelId  = 1;
    }

    // ════════════════════════════════════════════════════════
    // PRÉCHARGEMENT
    // ════════════════════════════════════════════════════════
    async preload() {
        const results = await Promise.all(
            Object.entries(IMAGE_SOURCES).map(([key, src]) => this._loadImage(key, src))
        );
        results.forEach(({ key, img }) => { this.images[key] = img; });

        const loaded = results.filter(r => r.img).map(r => r.key);
        const failed = results.filter(r => !r.img).map(r => r.key);
        if (loaded.length) console.log('[SoukDash] Images chargées :', loaded.join(', '));
        if (failed.length) console.warn('[SoukDash] Fallback canvas :', failed.join(', '));
    }

    _loadImage(key, src) {
        return new Promise((resolve) => {
            const img   = new Image();
            img.onload  = () => resolve({ key, img });
            img.onerror = () => resolve({ key, img: null });
            img.src     = src;
        });
    }

    // ════════════════════════════════════════════════════════
    // MENU PRINCIPAL
    // ════════════════════════════════════════════════════════
    drawMenu(animTime, highScore) {
        const ctx = this.ctx;

        const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        grad.addColorStop(0, '#1A0A00');
        grad.addColorStop(0.5, '#2E1200');
        grad.addColorStop(1, '#1A0A00');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        this._drawStarPattern(ctx, animTime);

        // Titre
        const titleY = 128 + Math.sin(animTime * 1.4) * 8;
        ctx.save();
        ctx.textAlign = 'center';
        ctx.shadowColor = COLORS.hudGold;
        ctx.shadowBlur  = 30;
        ctx.fillStyle   = COLORS.hudGold;
        ctx.font        = 'bold 62px Orbitron, "Arial Black", Arial';
        ctx.fillText('SOUK DASH', CANVAS_WIDTH / 2, titleY);
        ctx.shadowBlur = 0;
        ctx.fillStyle  = '#F0EAD6';
        ctx.font       = '20px Rajdhani, Arial';
        ctx.fillText('Traversez les ruelles de la médina', CANVAS_WIDTH / 2, titleY + 40);
        ctx.restore();

        // Badges niveaux
        const lvlY = 242;
        LEVELS.forEach((lvl, i) => {
            const x = CANVAS_WIDTH / 2 + (i - 1) * 172;
            this._drawLevelBadge(ctx, x, lvlY, lvl, animTime, i);
        });

        // Bouton JOUER
        const alpha = 0.6 + 0.4 * Math.sin(animTime * 3);
        ctx.save();
        ctx.textAlign   = 'center';
        ctx.globalAlpha = alpha;
        ctx.shadowColor = COLORS.hudGold;
        ctx.shadowBlur  = 15;
        ctx.fillStyle   = COLORS.hudGold;
        ctx.font        = 'bold 28px Orbitron, Arial';
        ctx.fillText('▶  APPUYER SUR ESPACE  ◀', CANVAS_WIDTH / 2, 378);
        ctx.globalAlpha = 1;
        ctx.shadowBlur  = 0;
        ctx.restore();

        // Contrôles
        ctx.save();
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(240,234,214,0.55)';
        ctx.font      = '15px Rajdhani, Arial';
        ctx.fillText('↑ ↓ ← →  ou  Z Q S D  pour se déplacer', CANVAS_WIDTH / 2, 436);
        ctx.fillText('H = Accueil  ·  ESC = Pause  ·  3 vies  ·  3 niveaux', CANVAS_WIDTH / 2, 458);
        ctx.restore();

        // High score
        if (highScore > 0) {
            ctx.save();
            ctx.textAlign = 'center';
            ctx.fillStyle = COLORS.hudGold;
            ctx.font      = '18px Rajdhani, Arial';
            ctx.fillText(`Meilleur score : ${highScore.toLocaleString()}`, CANVAS_WIDTH / 2, 514);
            ctx.restore();
        }

        // Statut connexion
        const connected = !!(sessionStorage.getItem('aaroToken') || localStorage.getItem('aaroToken'));
        ctx.save();
        ctx.textAlign = 'center';
        ctx.fillStyle = connected ? 'rgba(80,220,100,0.75)' : 'rgba(220,80,80,0.75)';
        ctx.font      = '13px Rajdhani, Arial';
        ctx.fillText(
            connected ? '● Connecté — score sauvegardé' : '● Non connecté — score non sauvegardé',
            CANVAS_WIDTH / 2, 554
        );
        ctx.restore();
    }

    // ════════════════════════════════════════════════════════
    // JEU EN COURS
    // ════════════════════════════════════════════════════════
    /**
     * @param {Level}      levelConfig
     * @param {Obstacle[]} obstacles
     * @param {Player}     player
     * @param {number}     lives
     * @param {Score}      score
     * @param {boolean}    isInvincible
     * @param {number}     invTimer
     * @param {number}     animTime    — temps cumulé (effets visuels)
     * @param {number}     flashRed    — durée restante de l'éclair rouge (s)
     */
    drawGame(levelConfig, obstacles, player, lives, score, isInvincible, invTimer, animTime = 0, flashRed = 0) {
        const ctx = this.ctx;

        // Stocker pour les helpers (évite de les passer en paramètre à chaque appel)
        this._animTime = animTime;
        this._levelId  = levelConfig.id;

        // 1 — Fond de grille
        this._drawGrid(ctx, levelConfig);

        // 2 — Obstacles
        obstacles.forEach(obs => this._drawObstacle(ctx, obs));

        // 3 — Joueur (clignotement si invincible)
        const blink = isInvincible && Math.floor(invTimer * 7) % 2 === 0;
        if (!blink && player) this._drawPlayer(ctx, player);

        // 4 — HUD
        this._drawHUD(ctx, levelConfig, lives, score);

        // 5 — Éclair rouge (collision) — dessiné EN DERNIER pour couvrir tout
        if (flashRed > 0) {
            const a = (flashRed / 0.35) * 0.48;
            ctx.save();
            ctx.fillStyle = `rgba(220,40,30,${a.toFixed(3)})`;
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            ctx.restore();
        }
    }

    // ════════════════════════════════════════════════════════
    // MENU PAUSE
    // ════════════════════════════════════════════════════════
    drawPause(score, lives) {
        const ctx = this.ctx;

        // Voile semi-transparent
        ctx.fillStyle = 'rgba(5,2,0,0.78)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Panneau central
        const pw = 380, ph = 280;
        const px = (CANVAS_WIDTH - pw) / 2;
        const py = (CANVAS_HEIGHT - ph) / 2 - 10;

        ctx.save();
        ctx.fillStyle = 'rgba(20,8,0,0.92)';
        this._roundRect(ctx, px, py, pw, ph, 14);
        ctx.fill();
        ctx.strokeStyle = COLORS.hudGold;
        ctx.lineWidth   = 2;
        this._roundRect(ctx, px, py, pw, ph, 14);
        ctx.stroke();
        ctx.restore();

        // Étoiles aux coins du panneau
        [[px + 22, py + 22], [px + pw - 22, py + 22],
         [px + 22, py + ph - 22], [px + pw - 22, py + ph - 22]
        ].forEach(([x, y]) => this._drawStar(ctx, x, y, 9, COLORS.hudGold, 0.6));

        ctx.save();
        ctx.textAlign = 'center';

        // Titre PAUSE
        ctx.shadowColor = COLORS.hudGold;
        ctx.shadowBlur  = 18;
        ctx.fillStyle   = COLORS.hudGold;
        ctx.font        = 'bold 46px Orbitron, Arial';
        ctx.fillText('PAUSE', CANVAS_WIDTH / 2, py + 62);
        ctx.shadowBlur = 0;

        // Séparateur
        ctx.strokeStyle = 'rgba(212,175,55,0.3)';
        ctx.lineWidth   = 1;
        ctx.beginPath();
        ctx.moveTo(px + 30, py + 80);
        ctx.lineTo(px + pw - 30, py + 80);
        ctx.stroke();

        // Options
        const opts = [
            ['ESPACE · ENTRÉE', 'Reprendre'],
            ['R',               'Recommencer'],
            ['H',               'Accueil'],
        ];
        opts.forEach(([key, label], i) => {
            const y = py + 118 + i * 44;
            ctx.textAlign = 'left';
            ctx.fillStyle = COLORS.hudGold;
            ctx.font      = 'bold 15px Rajdhani, Arial';
            ctx.fillText(key, px + 44, y);
            ctx.textAlign = 'left';
            ctx.fillStyle = '#F0EAD6';
            ctx.font      = '18px Rajdhani, Arial';
            ctx.fillText(`— ${label}`, px + 44 + 130, y);
        });

        // Score courant
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(240,234,214,0.45)';
        ctx.font      = '14px Rajdhani, Arial';
        ctx.fillText(`Score : ${score.getTotal().toLocaleString()}`, CANVAS_WIDTH / 2, py + ph - 18);

        ctx.restore();
    }

    // ════════════════════════════════════════════════════════
    // TRANSITION INTER-NIVEAUX
    // ════════════════════════════════════════════════════════
    drawLevelTransition(nextLevelConfig, completedLevelNum, timer, totalScore, crossBonus, scorePopups = []) {
        const ctx      = this.ctx;
        const progress = Math.min(timer / 2.0, 1);

        // Fond
        ctx.fillStyle = 'rgba(8,3,0,0.94)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Motif étoiles en arrière-plan
        this._drawStarPattern(ctx, timer * 0.6);

        // Flash doré au début (traversée)
        if (timer < 0.5) {
            const flashA = (1 - timer / 0.5) * 0.35;
            ctx.fillStyle = `rgba(212,175,55,${flashA.toFixed(3)})`;
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            // Texte "TRAVERSÉE !" éclaté
            const textA = (1 - timer / 0.5) * 0.9 + 0.1;
            const scale = 1 + (1 - timer / 0.5) * 0.25;
            ctx.save();
            ctx.textAlign   = 'center';
            ctx.globalAlpha = textA;
            ctx.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 150);
            ctx.scale(scale, scale);
            ctx.shadowColor = '#D4AF37';
            ctx.shadowBlur  = 30;
            ctx.fillStyle   = '#FFFDE7';
            ctx.font        = 'bold 52px Orbitron, Arial';
            ctx.fillText('TRAVERSÉE !', 0, 0);
            ctx.shadowBlur  = 0;
            ctx.restore();
        }

        // Grande étoile marocaine centrale
        const starSize = 44 + Math.sin(timer * 3) * 8;
        this._drawStar(ctx, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 112, starSize, COLORS.hudGold, 0.3 + 0.7 * progress);

        // "Niveau X terminé !"
        ctx.save();
        ctx.textAlign   = 'center';
        ctx.shadowColor = COLORS.hudGold;
        ctx.shadowBlur  = 22;
        ctx.fillStyle   = COLORS.hudGold;
        ctx.font        = 'bold 40px Orbitron, Arial';
        ctx.fillText(`NIVEAU ${completedLevelNum} TERMINÉ !`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 36);
        ctx.shadowBlur = 0;
        ctx.restore();

        // Bonus
        if (crossBonus) {
            ctx.save();
            ctx.textAlign = 'center';
            ctx.fillStyle = '#F0EAD6';
            ctx.font      = '20px Rajdhani, Arial';
            ctx.fillText(`+${crossBonus.base} pts traversée`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 12);
            if (crossBonus.timeBonus > 0) {
                ctx.fillStyle = COLORS.hudGold;
                ctx.fillText(`+${crossBonus.timeBonus} pts bonus temps`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 38);
            }
            ctx.restore();
        }

        // Score total
        ctx.save();
        ctx.textAlign = 'center';
        ctx.fillStyle = '#F0EAD6';
        ctx.font      = '22px Rajdhani, Arial';
        ctx.fillText(`Score total : ${totalScore.toLocaleString()}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 76);
        ctx.restore();

        // Popup +score flottant
        scorePopups.forEach((popup) => {
            const floatY = CANVAS_HEIGHT / 2 + 160 - popup.age * 80;
            const pAlpha = Math.max(0, 1 - popup.age * 0.9);
            const pScale = 1 + popup.age * 0.3;
            if (pAlpha <= 0) return;
            ctx.save();
            ctx.textAlign   = 'center';
            ctx.globalAlpha = pAlpha;
            ctx.translate(CANVAS_WIDTH / 2, floatY);
            ctx.scale(pScale, pScale);
            ctx.shadowColor = COLORS.hudGold;
            ctx.shadowBlur  = 14;
            ctx.fillStyle   = '#FFE066';
            ctx.font        = 'bold 38px Orbitron, Arial';
            ctx.fillText(popup.text, 0, 0);
            ctx.shadowBlur  = 0;
            ctx.restore();
        });

        // Prochain niveau
        const nextText = nextLevelConfig
            ? `Niveau ${nextLevelConfig.id} — ${nextLevelConfig.name}  →`
            : '🏆  VICTOIRE FINALE  →';
        const subAlpha = 0.5 + 0.5 * Math.sin(timer * 4);
        ctx.save();
        ctx.textAlign   = 'center';
        ctx.globalAlpha = subAlpha;
        ctx.fillStyle   = nextLevelConfig ? COLORS.hudGold : '#7FD483';
        ctx.font        = 'bold 22px Rajdhani, Arial';
        ctx.fillText(nextText, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 120);
        ctx.globalAlpha = 1;
        ctx.restore();
    }

    // ════════════════════════════════════════════════════════
    // GAME OVER
    // ════════════════════════════════════════════════════════
    drawGameOver(score, highScore, timer, isNewRecord) {
        const ctx = this.ctx;

        // Fond sombre rouge profond
        const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        grad.addColorStop(0, '#1A0000');
        grad.addColorStop(0.5, '#2D0000');
        grad.addColorStop(1, '#1A0000');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Cadre marocain
        this._drawMoroccanBorder(ctx, '#C0392B', 0.55);

        // Titre rouge flamboyant
        ctx.save();
        ctx.textAlign   = 'center';
        ctx.shadowColor = '#FF1744';
        ctx.shadowBlur  = 32;
        ctx.fillStyle   = '#E74C3C';
        ctx.font        = 'bold 70px Orbitron, Arial';
        ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 96);
        ctx.shadowBlur = 0;
        ctx.restore();

        // Sous-titre poétique
        ctx.save();
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(240,234,214,0.55)';
        ctx.font      = '16px Rajdhani, Arial';
        ctx.fillText('La médina vous a eu…', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 54);
        ctx.restore();

        // Nouveau record
        if (isNewRecord) {
            const a = 0.65 + 0.35 * Math.sin(timer * 5);
            ctx.save();
            ctx.textAlign   = 'center';
            ctx.globalAlpha = a;
            ctx.fillStyle   = COLORS.hudGold;
            ctx.font        = 'bold 26px Rajdhani, Arial';
            ctx.fillText('★  NOUVEAU RECORD PERSONNEL !  ★', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 14);
            ctx.globalAlpha = 1;
            ctx.restore();
        }

        // Scores
        ctx.save();
        ctx.textAlign = 'center';
        ctx.fillStyle = '#F0EAD6';
        ctx.font      = '32px Rajdhani, Arial';
        ctx.fillText(`Score : ${score.toLocaleString()}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 22);
        ctx.fillStyle = COLORS.hudGold;
        ctx.font      = '22px Rajdhani, Arial';
        ctx.fillText(`Meilleur : ${highScore.toLocaleString()}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 56);
        ctx.restore();

        // Instructions (après délai)
        if (timer > 1.0) {
            const a2 = 0.6 + 0.4 * Math.sin(timer * 3);

            // Bouton Rejouer
            ctx.save();
            ctx.globalAlpha = a2;
            this._drawButton(ctx, CANVAS_WIDTH / 2 - 96, CANVAS_HEIGHT / 2 + 88, 186, 38,
                'ESPACE — Rejouer', '#E74C3C');
            ctx.globalAlpha = 1;

            // Bouton Accueil
            ctx.fillStyle   = 'rgba(240,234,214,0.45)';
            ctx.font        = '15px Rajdhani, Arial';
            ctx.textAlign   = 'center';
            ctx.fillText('H pour retourner à l\'accueil', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 148);
            ctx.restore();
        }
    }

    // ════════════════════════════════════════════════════════
    // VICTOIRE FINALE
    // ════════════════════════════════════════════════════════
    drawVictory(score, highScore, timer, isNewRecord) {
        const ctx = this.ctx;

        // Fond vert médina
        const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        grad.addColorStop(0, '#061A06');
        grad.addColorStop(0.5, '#0B2E0B');
        grad.addColorStop(1, '#061A06');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Cadre marocain doré
        this._drawMoroccanBorder(ctx, COLORS.hudGold, 0.65);

        // Étoiles décoratives
        for (let i = 0; i < 6; i++) {
            const x = 80 + i * 90;
            const y = 56 + Math.sin(timer * 2 + i) * 14;
            this._drawStar(ctx, x, y, 16 + (i % 2) * 8, COLORS.hudGold, 0.65);
        }
        for (let i = 0; i < 6; i++) {
            const x = 80 + i * 90;
            const y = CANVAS_HEIGHT - 56 + Math.sin(timer * 2 + i + 3) * 14;
            this._drawStar(ctx, x, y, 14 + (i % 2) * 6, COLORS.hudGold, 0.5);
        }

        // Grande étoile centrale animée
        const bigStarY = CANVAS_HEIGHT / 2 - 148 + Math.sin(timer * 1.2) * 6;
        this._drawStar(ctx, CANVAS_WIDTH / 2, bigStarY, 28 + Math.sin(timer * 2) * 5, COLORS.hudGold, 0.8);

        // Titre VICTOIRE
        const titleY = CANVAS_HEIGHT / 2 - 96 + Math.sin(timer * 1.5) * 5;
        ctx.save();
        ctx.textAlign   = 'center';
        ctx.shadowColor = '#7FD483';
        ctx.shadowBlur  = 32;
        ctx.fillStyle   = '#7FD483';
        ctx.font        = 'bold 58px Orbitron, Arial';
        ctx.fillText('VICTOIRE !', CANVAS_WIDTH / 2, titleY);
        ctx.shadowBlur = 0;
        ctx.restore();

        // Texte bilingue : français + arabe
        ctx.save();
        ctx.textAlign = 'center';
        ctx.fillStyle = '#F0EAD6';
        ctx.font      = '20px Rajdhani, Arial';
        ctx.fillText('Vous avez traversé toute la médina !', CANVAS_WIDTH / 2, titleY + 38);
        // "Mabrook" (félicitations) en arabe
        ctx.fillStyle = COLORS.hudGold;
        ctx.font      = '26px "Rajdhani", Arial';
        ctx.fillText('مبروك', CANVAS_WIDTH / 2, titleY + 70);
        ctx.restore();

        // Record
        if (isNewRecord) {
            const a = 0.65 + 0.35 * Math.sin(timer * 5);
            ctx.save();
            ctx.textAlign   = 'center';
            ctx.globalAlpha = a;
            ctx.fillStyle   = COLORS.hudGold;
            ctx.font        = 'bold 24px Rajdhani, Arial';
            ctx.fillText('★  NOUVEAU RECORD PERSONNEL !  ★', CANVAS_WIDTH / 2, titleY + 106);
            ctx.globalAlpha = 1;
            ctx.restore();
        }

        // Scores
        ctx.save();
        ctx.textAlign = 'center';
        ctx.fillStyle = '#F0EAD6';
        ctx.font      = '30px Rajdhani, Arial';
        ctx.fillText(`Score final : ${score.toLocaleString()}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
        ctx.fillStyle = COLORS.hudGold;
        ctx.font      = '22px Rajdhani, Arial';
        ctx.fillText(`Meilleur : ${highScore.toLocaleString()}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 62);
        ctx.restore();

        if (timer > 1.5) {
            const a2 = 0.6 + 0.4 * Math.sin(timer * 3);
            ctx.save();
            ctx.globalAlpha = a2;
            this._drawButton(ctx, CANVAS_WIDTH / 2 - 96, CANVAS_HEIGHT / 2 + 92, 192, 38,
                'ESPACE — Rejouer', '#2E7D32');
            ctx.globalAlpha = 1;
            ctx.fillStyle   = 'rgba(240,234,214,0.45)';
            ctx.font        = '15px Rajdhani, Arial';
            ctx.textAlign   = 'center';
            ctx.fillText('H pour retourner à l\'accueil', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 150);
            ctx.restore();
        }
    }

    // ════════════════════════════════════════════════════════
    // HELPERS GRILLE
    // ════════════════════════════════════════════════════════

    _drawGrid(ctx, levelConfig) {
        for (let row = 0; row < ROWS; row++) {
            const y = row * CELL_SIZE;

            if (row === ROW_GOAL) {
                // ── Arrivée : vert médina ──
                ctx.fillStyle = GOAL_BG;
                ctx.fillRect(0, y, CANVAS_WIDTH, CELL_SIZE);
                this._drawGoalDecoration(ctx, y);

            } else if (row === ROW_START) {
                // ── Départ : légèrement plus sombre ──
                ctx.fillStyle = START_BG;
                ctx.fillRect(0, y, CANVAS_WIDTH, CELL_SIZE);
                this._drawSafeTile(ctx, y);
                this._drawStartLabel(ctx, y);

            } else if (ROW_SAFE.includes(row)) {
                // ── Zone sûre centrale ──
                ctx.fillStyle = COLORS.safe;
                ctx.fillRect(0, y, CANVAS_WIDTH, CELL_SIZE);
                this._drawSafeTile(ctx, y);

            } else {
                // ── Couloir d'obstacles ──
                ctx.fillStyle = row % 2 === 0 ? levelConfig.bgLight : levelConfig.bgDark;
                ctx.fillRect(0, y, CANVAS_WIDTH, CELL_SIZE);
                this._drawLevelTheme(ctx, row, y, levelConfig.id);
                this._drawLaneMarkers(ctx, row, levelConfig.lanes);
            }
        }

        // Lignes de grille discrètes
        ctx.strokeStyle = 'rgba(0,0,0,0.14)';
        ctx.lineWidth   = 1;
        for (let row = 1; row < ROWS; row++) {
            ctx.beginPath();
            ctx.moveTo(0, row * CELL_SIZE);
            ctx.lineTo(CANVAS_WIDTH, row * CELL_SIZE);
            ctx.stroke();
        }
    }

    /** Décorations et thème visuel par niveau sur les couloirs. */
    _drawLevelTheme(ctx, row, y, levelId) {
        ctx.save();

        if (levelId === 1) {
            // MÉDINA — zellige : petits losanges en pointillé
            ctx.strokeStyle = 'rgba(160,100,30,0.18)';
            ctx.lineWidth   = 1;
            const step = 20;
            for (let x = 0; x <= CANVAS_WIDTH; x += step) {
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + step / 2, y + CELL_SIZE / 2);
                ctx.lineTo(x, y + CELL_SIZE);
                ctx.stroke();
            }

        } else if (levelId === 3) {
            // TRAVERSÉE — nuit : voile bleu-gris sombre
            ctx.fillStyle = 'rgba(10,10,40,0.38)';
            ctx.fillRect(0, y, CANVAS_WIDTH, CELL_SIZE);

            // Petits reflets de phares
            const pulse = 0.04 + 0.02 * Math.sin(this._animTime * 3 + row);
            ctx.fillStyle = `rgba(220,220,180,${pulse})`;
            ctx.fillRect(0, y, CANVAS_WIDTH, CELL_SIZE);
        }
        // Niveau 2 (SOUK) : les couleurs du config suffisent, pas de couche extra

        ctx.restore();
    }

    /** Décoration de l'arrivée : arc + étoile + texte. */
    _drawGoalDecoration(ctx, y) {
        ctx.save();

        // Arc marocain (porte)
        ctx.fillStyle   = GOAL_ARCH;
        ctx.strokeStyle = COLORS.hudGold;
        ctx.lineWidth   = 2.5;
        const arcW = 94, arcH = 52;
        const cx   = CANVAS_WIDTH / 2;
        ctx.beginPath();
        ctx.moveTo(cx - arcW / 2, y + CELL_SIZE);
        ctx.lineTo(cx - arcW / 2, y + CELL_SIZE - arcH + 14);
        ctx.arc(cx, y + CELL_SIZE - arcH + 14, arcW / 2, Math.PI, 0);
        ctx.lineTo(cx + arcW / 2, y + CELL_SIZE);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Étoile dans l'arc
        this._drawStar(ctx, cx, y + CELL_SIZE / 2, 13, COLORS.hudGold, 1);

        // Libellé ARRIVÉE
        ctx.textBaseline = 'middle';
        ctx.fillStyle    = COLORS.hudGold;
        ctx.font         = 'bold 13px Rajdhani, Arial';
        ctx.textAlign    = 'left';
        ctx.fillText('ARRIVÉE', 10, y + CELL_SIZE / 2 + 1);
        ctx.textAlign = 'right';
        ctx.fillText('ARRIVÉE', CANVAS_WIDTH - 10, y + CELL_SIZE / 2 + 1);

        ctx.restore();
    }

    /** Motif tadelakt sur les zones sûres. */
    _drawSafeTile(ctx, y) {
        ctx.save();
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth   = 1;
        const tileW = 30;
        for (let x = 0; x < CANVAS_WIDTH; x += tileW) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + CELL_SIZE);
            ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(0, y + CELL_SIZE / 2);
        ctx.lineTo(CANVAS_WIDTH, y + CELL_SIZE / 2);
        ctx.stroke();
        ctx.restore();
    }

    /** Label DÉPART sur la ligne de départ. */
    _drawStartLabel(ctx, y) {
        ctx.save();
        ctx.textAlign    = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle    = 'rgba(212,175,55,0.7)';
        ctx.font         = 'bold 13px Rajdhani, Arial';
        ctx.fillText('DÉPART', 10, y + CELL_SIZE / 2 + 1);
        ctx.textAlign = 'right';
        ctx.fillText('DÉPART', CANVAS_WIDTH - 10, y + CELL_SIZE / 2 + 1);
        ctx.restore();
    }

    /** Flèches directionnelles dans les couloirs. */
    _drawLaneMarkers(ctx, row, lanesConfig) {
        const laneConf = lanesConfig.find(l => l.row === row);
        if (!laneConf) return;
        ctx.save();
        ctx.fillStyle    = 'rgba(0,0,0,0.08)';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.font         = '18px Arial';
        const arrow = laneConf.dir === 1 ? '→' : '←';
        for (let col = 0; col < COLS; col += 2) {
            ctx.fillText(arrow, col * CELL_SIZE + CELL_SIZE / 2, row * CELL_SIZE + CELL_SIZE / 2);
        }
        ctx.restore();
    }

    // ════════════════════════════════════════════════════════
    // HELPERS ENTITÉS
    // ════════════════════════════════════════════════════════

    /** Dessine un obstacle : image sans fond blanc ou fallback coloré. */
    _drawObstacle(ctx, obs) {
        const img = this.images[obs.type];

        // Hauteur et position centrée à 80% de la cellule
        const drawH = CELL_SIZE * 0.80;                          // 48 px
        const drawY = obs.row * CELL_SIZE + (CELL_SIZE - drawH) / 2;
        const drawX = obs.x;
        const drawW = obs.width;

        ctx.save();

        // Clignotement niveau 3 (légère pulsation, pas un blink agressif)
        if (this._levelId === 3) {
            ctx.globalAlpha = 0.72 + 0.28 * Math.abs(Math.sin(this._animTime * 4.5 + obs.row * 0.7));
        }

        if (img) {
            // ── Image : clearRect pour supprimer tout fond blanc ──
            ctx.clearRect(drawX, drawY, drawW, drawH);
            ctx.globalCompositeOperation = 'source-over';
            ctx.drawImage(img, drawX, drawY, drawW, drawH);
        } else {
            // ── Fallback : rectangle coloré + emoji ──
            const r = 6;
            ctx.fillStyle = obs.color;
            this._roundRect(ctx, drawX, drawY, drawW, drawH, r);
            ctx.fill();
            ctx.strokeStyle = this._lightenColor(obs.color, 40);
            ctx.lineWidth   = 1.5;
            this._roundRect(ctx, drawX, drawY, drawW, drawH, r);
            ctx.stroke();
            this._drawObstacleDetail(ctx, obs, drawX, drawY, drawW, drawH);
        }

        ctx.restore();
    }

    _drawObstacleDetail(ctx, obs, x, y, w, h) {
        ctx.fillStyle    = 'rgba(255,255,255,0.55)';
        ctx.font         = `${Math.min(h * 0.55, 22)}px Arial`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        const icons = {
            charrette: '🛒', passant: '🚶', velo: '🚲',
            moto: '🏍', porteur: '📦', foule: '👥', voiture: '🚗'
        };
        ctx.fillText(icons[obs.type] || '●', x + w / 2, y + h / 2);
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font      = '9px Arial';
        ctx.fillText(obs.dir === 1 ? '▶' : '◀', obs.dir === 1 ? x + w - 8 : x + 8, y + 6);
    }

    /** Dessine le joueur : image sans fond blanc ou silhouette fallback. */
    _drawPlayer(ctx, player) {
        const img = this.images.player;

        // 80% de la cellule, centré
        const size = CELL_SIZE * 0.80;                           // 48 px
        const px   = player.col * CELL_SIZE + (CELL_SIZE - size) / 2;
        const py   = player.row * CELL_SIZE + (CELL_SIZE - size) / 2;

        ctx.save();

        if (img) {
            ctx.clearRect(px, py, size, size);
            ctx.globalCompositeOperation = 'source-over';
            ctx.drawImage(img, px, py, size, size);
        } else {
            // Silhouette djellaba
            const cx = px + size / 2;
            const cy = py + size / 2;
            const r  = 10;

            ctx.fillStyle   = COLORS.playerBody;
            ctx.shadowColor = 'rgba(26,95,168,0.6)';
            ctx.shadowBlur  = 10;
            ctx.beginPath();
            ctx.moveTo(cx, cy - r - 1);
            ctx.lineTo(cx - 16, cy + 20);
            ctx.lineTo(cx + 16, cy + 20);
            ctx.closePath();
            ctx.fill();

            ctx.beginPath();
            ctx.arc(cx, cy - r, r * 1.2, Math.PI, 0, false);
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;

            ctx.fillStyle = COLORS.playerHead;
            ctx.beginPath();
            ctx.arc(cx, cy - r - 2, r - 2, 0, Math.PI * 2);
            ctx.fill();

            this._drawStar(ctx, cx, cy + 6, 5, COLORS.playerAccent, 0.9);
        }

        ctx.restore();
    }

    // ════════════════════════════════════════════════════════
    // HUD
    // ════════════════════════════════════════════════════════
    _drawHUD(ctx, levelConfig, lives, score) {
        // Bandeau supérieur (légèrement plus haut pour plus de lisibilité)
        ctx.fillStyle = COLORS.hudBg;
        ctx.fillRect(0, 0, CANVAS_WIDTH, 40);

        ctx.save();

        // Score (gauche)
        ctx.textBaseline = 'middle';
        ctx.textAlign    = 'left';
        ctx.fillStyle    = COLORS.hudWhite;
        ctx.font         = 'bold 15px Rajdhani, Arial';
        ctx.fillText(`Score : ${score.getTotal().toLocaleString()}`, 10, 20);

        // Nom du niveau + progression (centre)
        ctx.textAlign   = 'center';
        ctx.shadowColor = COLORS.hudGold;
        ctx.shadowBlur  = 8;
        ctx.fillStyle   = COLORS.hudGold;
        ctx.font        = 'bold 16px Orbitron, Arial';
        ctx.fillText(levelConfig.name, CANVAS_WIDTH / 2, 16);
        ctx.shadowBlur = 0;

        // Indicateur Niv. X/3
        ctx.fillStyle = 'rgba(212,175,55,0.65)';
        ctx.font      = '12px Rajdhani, Arial';
        ctx.fillText(`Niv. ${levelConfig.id} / 3`, CANVAS_WIDTH / 2, 31);

        // Vies (droite)
        ctx.textAlign = 'right';
        ctx.fillStyle = COLORS.hudRed;
        ctx.font      = 'bold 17px Rajdhani, Arial';
        ctx.fillText('♥'.repeat(lives) + '♡'.repeat(3 - lives), CANVAS_WIDTH - 10, 20);

        ctx.restore();
    }

    // ════════════════════════════════════════════════════════
    // HELPERS DÉCORATIFS
    // ════════════════════════════════════════════════════════

    /** Cadre marocain : double bordure + étoiles aux coins et côtés. */
    _drawMoroccanBorder(ctx, color, baseAlpha = 0.5) {
        ctx.save();

        // Double rectangle
        ctx.strokeStyle = color;
        ctx.globalAlpha = baseAlpha;
        ctx.lineWidth   = 2;
        ctx.strokeRect(10, 10, CANVAS_WIDTH - 20, CANVAS_HEIGHT - 20);
        ctx.globalAlpha = baseAlpha * 0.45;
        ctx.lineWidth   = 1;
        ctx.strokeRect(17, 17, CANVAS_WIDTH - 34, CANVAS_HEIGHT - 34);
        ctx.globalAlpha = 1;

        // Étoiles aux 4 coins
        const corners = [
            [28, 28], [CANVAS_WIDTH - 28, 28],
            [28, CANVAS_HEIGHT - 28], [CANVAS_WIDTH - 28, CANVAS_HEIGHT - 28]
        ];
        corners.forEach(([x, y]) => this._drawStar(ctx, x, y, 11, color, baseAlpha));

        // Étoiles au milieu des côtés
        const mids = [
            [CANVAS_WIDTH / 2, 22], [CANVAS_WIDTH / 2, CANVAS_HEIGHT - 22],
            [22, CANVAS_HEIGHT / 2], [CANVAS_WIDTH - 22, CANVAS_HEIGHT / 2]
        ];
        mids.forEach(([x, y]) => this._drawStar(ctx, x, y, 8, color, baseAlpha * 0.7));

        ctx.restore();
    }

    /** Bouton texte centré dans un rectangle arrondi. */
    _drawButton(ctx, x, y, w, h, label, color) {
        ctx.save();
        ctx.fillStyle   = color + '33';    // couleur avec alpha ~20%
        ctx.strokeStyle = color;
        ctx.lineWidth   = 1.5;
        this._roundRect(ctx, x, y, w, h, 8);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle    = '#F0EAD6';
        ctx.font         = 'bold 16px Rajdhani, Arial';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x + w / 2, y + h / 2 + 1);
        ctx.restore();
    }

    // ── Étoile marocaine à 8 branches ────────────────────────────────────────
    _drawStar(ctx, cx, cy, size, color, alpha = 1) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle   = color;
        ctx.translate(cx, cy);
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const angle  = (i * Math.PI) / 4;
            const radius = i % 2 === 0 ? size : size * 0.45;
            if (i === 0) ctx.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
            else         ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    /** Motif d'étoiles animées pour les fonds sombres (menu, transitions). */
    _drawStarPattern(ctx, time) {
        const positions = [
            [60, 80], [540, 80], [100, 500], [500, 500],
            [300, 570], [60, 300], [540, 300], [180, 200], [420, 200]
        ];
        positions.forEach(([x, y], i) => {
            const size  = 11 + Math.sin(time * 1.2 + i) * 4;
            const alpha = 0.15 + 0.12 * Math.sin(time * 0.8 + i * 0.7);
            this._drawStar(ctx, x, y, size, COLORS.hudGold, alpha);
        });
    }

    /** Carte de niveau pour le menu. */
    _drawLevelBadge(ctx, cx, cy, lvl, time, idx) {
        const w = 140, h = 72;
        const pulse = 0.8 + 0.2 * Math.sin(time * 1.5 + idx * 1.2);

        ctx.save();
        ctx.globalAlpha = pulse;

        ctx.fillStyle   = lvl.bgDark || '#6A3A10';
        ctx.strokeStyle = COLORS.hudGold;
        ctx.lineWidth   = 1.5;
        this._roundRect(ctx, cx - w / 2, cy - h / 2, w, h, 8);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.fillStyle = COLORS.hudGold;
        ctx.font      = 'bold 13px Orbitron, Arial';
        ctx.fillText(`Niveau ${lvl.id}`, cx, cy - 16);
        ctx.fillStyle = '#F0EAD6';
        ctx.font      = '13px Rajdhani, Arial';
        ctx.fillText(lvl.name, cx, cy + 2);
        ctx.fillStyle = 'rgba(240,234,214,0.6)';
        ctx.font      = '11px Rajdhani, Arial';
        ctx.fillText(lvl.subtitle, cx, cy + 18);

        ctx.globalAlpha = 1;
        ctx.restore();
    }

    /** Rectangle arrondi (polyfill). */
    _roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.arcTo(x + w, y, x + w, y + r, r);
        ctx.lineTo(x + w, y + h - r);
        ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
        ctx.lineTo(x + r, y + h);
        ctx.arcTo(x, y + h, x, y + h - r, r);
        ctx.lineTo(x, y + r);
        ctx.arcTo(x, y, x + r, y, r);
        ctx.closePath();
    }

    /** Éclaircit une couleur hex. */
    _lightenColor(hex, amount) {
        const n = parseInt(hex.slice(1), 16);
        const r = Math.min(255, (n >> 16) + amount);
        const g = Math.min(255, ((n >> 8) & 0xff) + amount);
        const b = Math.min(255, (n & 0xff) + amount);
        return `rgb(${r},${g},${b})`;
    }
}
