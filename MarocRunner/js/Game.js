import InputManager from './utils/InputManager.js';
import ScoreManager from './utils/ScoreManager.js';
import AudioManager from './utils/AudioManager.js';
import MenuState from './states/MenuState.js';
import PlayState from './states/PlayState.js';
import GameOverState from './states/GameOverState.js';

export default class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // Managers
        this.inputManager = new InputManager();
        this.scoreManager = new ScoreManager();
        this.audioManager = new AudioManager();
        
        // États du jeu
        this.states = {
            menu: new MenuState(this),
            play: new PlayState(this),
            gameover: new GameOverState(this)
        };
        
        this.currentState = null;
        
        // Timing
        this.lastTime = 0;
        this.isRunning = false;
    }

    init() {
        console.log('🎮 Initialisation du jeu Maroc Runner');
        
        // Démarrer la musique de fond
        this.audioManager.playBackgroundMusic();
        
        // Démarrer sur le menu
        this.changeState('menu');
        
        // Lancer la boucle de jeu
        this.isRunning = true;
        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }

    changeState(stateName) {
        // Sortir de l'état actuel
        if (this.currentState) {
            this.currentState.exit();
        }
        
        // Entrer dans le nouvel état
        this.currentState = this.states[stateName];
        
        if (!this.currentState) {
            console.error(`❌ État "${stateName}" introuvable !`);
            return;
        }
        
        this.currentState.enter();
        console.log(`🔄 Changement d'état vers: ${stateName}`);
    }

    gameLoop(timestamp) {
        if (!this.isRunning) return;

        // Calcul deltaTime
        const deltaTime = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;
        
        // Limiter deltaTime pour éviter les gros sauts
        const clampedDeltaTime = Math.min(deltaTime, 0.1);

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Update et draw de l'état actuel
        if (this.currentState) {
            this.currentState.handleInput(this.inputManager);
            this.currentState.update(clampedDeltaTime);
            this.currentState.draw(this.ctx);
        }

        // Debug info (optionnel)
        this.drawDebugInfo(clampedDeltaTime);

        // Prochaine frame
        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }

    drawDebugInfo(deltaTime) {
        const debugDiv = document.getElementById('debug');
        if (!debugDiv) return;

        // DEBUG DÉSACTIVÉ (change en true si tu veux le voir)
        const DEBUG_MODE = false;
        
        if (!DEBUG_MODE) {
            debugDiv.style.display = 'none';
            return;
        }

        debugDiv.style.display = 'block';
        const fps = Math.round(1 / deltaTime);
        debugDiv.innerHTML = `
            FPS: ${fps}<br>
            État: ${this.getStateName()}<br>
            Score: ${Math.floor(this.scoreManager.getCurrentScore())}<br>
            High: ${Math.floor(this.scoreManager.getHighScore())}
        `;
    }

    getStateName() {
        for (let [name, state] of Object.entries(this.states)) {
            if (state === this.currentState) {
                return name;
            }
        }
        return 'unknown';
    }

    stop() {
        this.isRunning = false;
        console.log('⏹️ Jeu arrêté');
    }
}