// Gestion des scores — localStorage pour le high score local + envoi API
const API_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:4000"
    : "https://projet-web-s6.onrender.com";

export default class ScoreManager {
    constructor() {
        this.currentScore = 0;
        this.highScore = this._loadHighScore();
    }

    _loadHighScore() {
        const saved = localStorage.getItem('marocRunnerHighScore');
        return saved ? parseInt(saved) : 0;
    }

    _saveLocalHighScore() {
        if (this.currentScore > this.highScore) {
            this.highScore = this.currentScore;
            localStorage.setItem('marocRunnerHighScore', this.highScore);
            return true;
        }
        return false;
    }

    // Appelé par GameOverState — retourne true si nouveau record local
    saveHighScore() {
        return this._saveLocalHighScore();
    }

    // Envoie le score au backend (si l'utilisateur est connecté)
    async submitScoreToAPI(score) {
        // Récupérer le token depuis sessionStorage (passé par la page d'accueil)
        // ou depuis localStorage (si l'utilisateur était déjà connecté)
        const token = sessionStorage.getItem('aaroToken') || localStorage.getItem('aaroToken');
        if (!token) return; // non connecté, on ne fait rien

        try {
            await fetch(`${API_URL}/scores`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ jeu: 'marocrunner', score: Math.floor(score) })
            });
        } catch (err) {
            console.warn('Score non envoyé au serveur :', err.message);
        }
    }

    reset() {
        this.currentScore = 0;
    }

    addPoints(points) {
        this.currentScore += points;
    }

    getCurrentScore() {
        return this.currentScore;
    }

    getHighScore() {
        return this.highScore;
    }
}
