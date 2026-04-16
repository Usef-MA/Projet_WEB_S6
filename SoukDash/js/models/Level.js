// ============================================================
// SOUK DASH — Modèle Level
// Wrapper sur la configuration d'un niveau.
// ============================================================

export default class Level {
    /**
     * @param {Object} config - entrée depuis LEVELS dans gameConfig.js
     */
    constructor(config) {
        this.id       = config.id;
        this.name     = config.name;
        this.subtitle = config.subtitle;
        this.hint     = config.hint;
        this.bgLight  = config.bgLight;
        this.bgDark   = config.bgDark;
        this.timeLimit = config.timeLimit;
        this.lanes    = config.lanes;   // tableau de config de couloirs
    }
}
