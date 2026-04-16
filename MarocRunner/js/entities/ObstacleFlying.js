import Entity from './Entity.js';

export default class ObstacleFlying extends Entity {
    constructor(x, y, speed) {
        // Obstacle qui vole 
        super(x, y, 40, 40);
        
        this.velocityX = -speed;
        this.image = new Image();
        this.image.src = 'assets/obstacle.png';
        this.imageLoaded = false;
        this.image.onload = () => {
            this.imageLoaded = true;
        };
        
        // Anim
        this.oscillation = 0;
        this.oscillationSpeed = 4;
        this.baseY = y; // Sauvegarde position de base
    }

    update(deltaTime) {
        super.update(deltaTime);
        this.oscillation += this.oscillationSpeed * deltaTime;
        
        // Mouvement vertical en vague
        this.y = this.baseY + Math.sin(this.oscillation) * 15;
    }

    draw(ctx) {
        ctx.save();
        
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        
        // rota légère
        ctx.rotate(Math.sin(this.oscillation * 2) * 0.2);
        
        if (this.imageLoaded) {
            ctx.drawImage(
                this.image,
                -this.width / 2,
                -this.height / 2,
                this.width,
                this.height
            );
        } else {
            // Fallback : cercle bleu
            ctx.fillStyle = '#3498db';
            ctx.beginPath();
            ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#d4af37';
            ctx.lineWidth = 3;
            ctx.stroke();
        }
        
        ctx.restore();
    }
}