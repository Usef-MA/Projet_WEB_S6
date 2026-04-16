// ============================================================
// SOUK DASH — Service audio (Web Audio API)
// Sons 100% synthétiques, aucun fichier externe.
// Silencieux si prefers-reduced-motion est activé.
// AudioContext créé en lazy (premier geste utilisateur).
// ============================================================

export default class SoundService {
    constructor() {
        this._ctx    = null;
        this._muted  = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    // ── Initialisation lazy (respecte la politique autoplay) ──────────────────
    _ensureCtx() {
        if (this._ctx)   return true;
        if (this._muted) return false;
        try {
            this._ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch {
            this._muted = true;
            return false;
        }
        return true;
    }

    // ── API publique ──────────────────────────────────────────────────────────
    /** @param {'move'|'collision'|'cross'|'gameover'} name */
    play(name) {
        if (!this._ensureCtx()) return;
        if (this._ctx.state === 'suspended') this._ctx.resume();
        switch (name) {
            case 'move':      this._move();      break;
            case 'collision': this._collision(); break;
            case 'cross':     this._cross();     break;
            case 'gameover':  this._gameover();  break;
        }
    }

    // ── Sons individuels ──────────────────────────────────────────────────────

    /** Bip court et léger à chaque déplacement. */
    _move() {
        this._tone(440, 0.04, 'square', 0.06);
    }

    /** Choc sourd à basse fréquence sur collision. */
    _collision() {
        const ctx = this._ctx;
        const osc = ctx.createOscillator();
        const g   = ctx.createGain();
        osc.connect(g);
        g.connect(ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(130, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.22);
        g.gain.setValueAtTime(0.28, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.22);
    }

    /** Accord joyeux ascendant à la traversée. */
    _cross() {
        // Arpège Do majeur : C5-E5-G5-C6
        [523, 659, 784, 1047].forEach((freq, i) => {
            setTimeout(() => this._tone(freq, 0.28, 'sine', 0.11), i * 65);
        });
    }

    /** Mélodie descendante au game over. */
    _gameover() {
        [400, 330, 264, 220].forEach((freq, i) => {
            setTimeout(() => this._tone(freq, 0.38, 'sine', 0.14), i * 160);
        });
    }

    // ── Helpers internes ─────────────────────────────────────────────────────

    _tone(freq, duration, type = 'sine', gain = 0.12) {
        const ctx = this._ctx;
        const osc = ctx.createOscillator();
        const g   = ctx.createGain();
        osc.connect(g);
        g.connect(ctx.destination);
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        g.gain.setValueAtTime(gain, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
    }
}
