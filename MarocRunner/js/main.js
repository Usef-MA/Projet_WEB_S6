import Game from './Game.js';

// Point d'entrée du jeu
window.addEventListener('load', () => {
    console.log('Démarrage de Maroc Runner...');
    
    const game = new Game('gameCanvas');
    game.init();
    
    window.game = game;
});