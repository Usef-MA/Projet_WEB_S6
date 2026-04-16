// ============================================================
// SOUK DASH — Contrôleur d'entrées
// Capture clavier + tactile. Modèle « consommation unique »
// pour éviter les déplacements multiples par appui.
// ============================================================

export default class InputController {
    constructor() {
        this._pendingMove    = null;   // 'up' | 'down' | 'left' | 'right'
        this._pendingAction  = false;  // espace / entrée / clic
        this._pendingHome    = false;  // touche H → accueil
        this._pendingEsc     = false;  // ESC → pause / menu
        this._pendingRestart = false;  // R → recommencer (menu pause)
        this._keys           = {};     // état brut des touches (pour isPressed)

        window.addEventListener('keydown', (e) => this._onKeyDown(e));
        window.addEventListener('keyup',   (e) => { delete this._keys[e.key]; });
        window.addEventListener('click',   () => { this._pendingAction = true; });
        window.addEventListener('touchstart', (e) => {
            this._handleSwipe(e);
        }, { passive: true });
    }

    _onKeyDown(e) {
        this._keys[e.key] = true;

        switch (e.key) {
            // --- Déplacement haut ---
            case 'ArrowUp':
            case 'z': case 'Z':
            case 'w': case 'W':
                this._pendingMove = 'up';
                e.preventDefault();
                break;

            // --- Déplacement bas ---
            case 'ArrowDown':
            case 's': case 'S':
                this._pendingMove = 'down';
                e.preventDefault();
                break;

            // --- Déplacement gauche ---
            case 'ArrowLeft':
            case 'q': case 'Q':
            case 'a': case 'A':
                this._pendingMove = 'left';
                e.preventDefault();
                break;

            // --- Déplacement droite ---
            case 'ArrowRight':
            case 'd': case 'D':
                this._pendingMove = 'right';
                e.preventDefault();
                break;

            // --- Action (lancer / rejouer) ---
            case ' ':
            case 'Enter':
                this._pendingAction = true;
                e.preventDefault();
                break;

            // --- Accueil ---
            case 'h': case 'H':
                this._pendingHome = true;
                break;

            // --- Pause / Menu ---
            case 'Escape':
                this._pendingEsc = true;
                break;

            // --- Recommencer (menu pause) ---
            case 'r': case 'R':
                this._pendingRestart = true;
                break;
        }
    }

    // Support swipe tactile (haut / bas seulement, suffisant pour Frogger)
    _handleSwipe(e) {
        if (!e.touches || e.touches.length === 0) return;
        const t = e.touches[0];
        this._touchStartX = t.clientX;
        this._touchStartY = t.clientY;

        const onEnd = (ev) => {
            const dx = ev.changedTouches[0].clientX - this._touchStartX;
            const dy = ev.changedTouches[0].clientY - this._touchStartY;
            if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
                this._pendingAction = true; // tap = action
            } else if (Math.abs(dy) > Math.abs(dx)) {
                this._pendingMove = dy < 0 ? 'up' : 'down';
            } else {
                this._pendingMove = dx < 0 ? 'left' : 'right';
            }
            window.removeEventListener('touchend', onEnd);
        };
        window.addEventListener('touchend', onEnd, { once: true });
    }

    // ─── API de consommation (chaque appel remet le flag à false) ────────────

    consumeMove()    { const m = this._pendingMove;    this._pendingMove = null;    return m; }
    consumeAction()  { const a = this._pendingAction;  this._pendingAction = false;  return a; }
    consumeHome()    { const h = this._pendingHome;    this._pendingHome = false;    return h; }
    consumeEsc()     { const e = this._pendingEsc;     this._pendingEsc = false;     return e; }
    consumeRestart() { const r = this._pendingRestart; this._pendingRestart = false; return r; }

    /** Vérifie si une touche est maintenue (usage ponctuel, non consume). */
    isPressed(key)  { return !!this._keys[key]; }

    /** Réinitialise tout (changement d'état). */
    clearAll() {
        this._pendingMove    = null;
        this._pendingAction  = false;
        this._pendingHome    = false;
        this._pendingEsc     = false;
        this._pendingRestart = false;
        this._keys           = {};
    }
}
