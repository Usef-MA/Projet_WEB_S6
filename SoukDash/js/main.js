// ============================================================
// SOUK DASH — Point d'entrée
// Initialise le jeu dès que la page est chargée.
// ============================================================
import GameController from './controllers/GameController.js';

window.addEventListener('load', () => {
    const canvas = document.getElementById('gameCanvas');

    if (!canvas) {
        console.error('[SoukDash] Canvas introuvable.');
        return;
    }

    // Info auth (le score ne sera sauvegardé que si connecté)
    const isConnected = !!(
        sessionStorage.getItem('aaroToken') ||
        localStorage.getItem('aaroToken')
    );
    if (!isConnected) {
        console.info('[SoukDash] Non connecté — le score ne sera pas envoyé au serveur.');
    }

    const game = new GameController(canvas);
    game.init();

    // Accessible depuis la console pour debug
    window.soukDash = game;
});
