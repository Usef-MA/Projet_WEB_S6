import GameState from './GameState.js';

export default class GameOverState extends GameState {
    constructor(game) {
        super(game);
        this.animation = 0;
        this.isNewRecord = false;
        
        // Background im
        this.backgroundImage = new Image();
        this.backgroundImage.src = 'assets/gameover-bg.png';
        this.backgroundImageLoaded = false;
        this.backgroundImage.onload = () => {
            this.backgroundImageLoaded = true;
            console.log('✅ Game Over background chargé');
        };
    }

    enter() {
        console.log('💀 Game Over State activé');
        this.animation = 0;

        // Sauvegarder le high score local
        this.isNewRecord = this.game.scoreManager.saveHighScore();

        // Envoyer le score au backend (async, silencieux si pas connecté)
        const finalScore = this.game.scoreManager.getCurrentScore();
        this.game.scoreManager.submitScoreToAPI(finalScore);
    }

    update(deltaTime) {
        this.animation += deltaTime;
    }

    draw(ctx) {
        const canvas = ctx.canvas;
            
        // Background avec image si chargée
        if (this.backgroundImageLoaded) {
            ctx.drawImage(this.backgroundImage, 0, 0, canvas.width, canvas.height);
            
            // Overlay très sombre pour effet dramatique
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
            // Fallback : fond sombre
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Titre GAME OVER 
        ctx.save();
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(255, 0, 0, 0.5)';
        ctx.shadowBlur = 20;
        
        ctx.fillStyle = '#e74c3c';
        ctx.font = 'bold 72px "Exo 2", Arial'; 
        const titleY = canvas.height / 2 - 80;
        ctx.fillText('GAME OVER', canvas.width / 2, titleY);
        
        ctx.shadowBlur = 0;
        ctx.restore();

        // check Nouveau record ?
        if (this.isNewRecord) {
            ctx.save();
            ctx.textAlign = 'center';
            const alpha = (Math.sin(this.animation * 5) + 1) / 2;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#d4af37';
            ctx.font = 'bold 26px "Exo 2", Arial';
            ctx.fillText('🎉 NOUVEAU RECORD ! 🎉', canvas.width / 2, titleY + 55);
            ctx.globalAlpha = 1;
            ctx.restore();
        }

        // Scores 
        ctx.save();
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.font = '32px "Exo 2", Arial';
        
        const scoreY = canvas.height / 2;
        ctx.fillText(
            `Score: ${Math.floor(this.game.scoreManager.getCurrentScore())}`, // ← Math.floor
            canvas.width / 2,
            scoreY
        );
        
        ctx.fillStyle = '#d4af37';
        ctx.font = '24px "Exo 2", Arial';
        ctx.fillText(
            `Meilleur Score: ${Math.floor(this.game.scoreManager.getHighScore())}`, // ← Math.floor
            canvas.width / 2,
            scoreY + 45
        );
        
        ctx.restore();

        //  restart
        ctx.save();
        ctx.textAlign = 'center';
        const alpha = (Math.sin(this.animation * 3) + 1) / 2;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#ffffff';
        ctx.font = '24px "Exo 2", Arial';
        ctx.fillText(
            'Appuie sur ESPACE pour rejouer',
            canvas.width / 2,
            canvas.height / 2 + 110
        );
        ctx.globalAlpha = 1;
        ctx.restore();

        // Retour menu
        ctx.save();
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '16px "Exo 2", Arial';
        ctx.fillText(
            'ou ESC pour retourner au menu',
            canvas.width / 2,
            canvas.height / 2 + 140
        );
        ctx.restore();

        // Retour accueil
        ctx.save();
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(180, 180, 255, 0.7)';
        ctx.font = '14px "Exo 2", Arial';
        ctx.fillText(
            '← H pour retourner à l\'accueil',
            canvas.width / 2,
            canvas.height / 2 + 165
        );
        ctx.restore();
    }
    handleInput(inputManager) {
        // Rejouer
        if (inputManager.isKeyPressed(' ') || 
            inputManager.isKeyPressed('ArrowUp') ||
            inputManager.mouseClicked) {
            
            this.game.changeState('play');
            inputManager.resetClick();
        }
        
        // Retour menu
        if (inputManager.isKeyPressed('Escape')) {
            this.game.changeState('menu');
        }

        // Retour accueil
        if (inputManager.isKeyPressed('h') || inputManager.isKeyPressed('H')) {
            window.location.href = '../frontend/index.html';
        }
    }
}