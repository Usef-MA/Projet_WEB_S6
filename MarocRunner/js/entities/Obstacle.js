import Entity from './Entity.js';

export default class Obstacle extends Entity {
    constructor(x, y, speed) {
        // Obstacle carré de dim 40x40
        super(x, y, 40, 40);
        
        this.velocityX = -speed;
        
        // Image
        this.image = new Image();
        this.image.src = 'assets/obstacle.png';
        this.imageLoaded = false;
        this.image.onload = () => {
            this.imageLoaded = true;
        };
        
        // Animation subtile
        this.pulseAnimation = 0;
        this.pulseSpeed = 3;
    }

    update(deltaTime) {
        super.update(deltaTime);
        this.pulseAnimation += this.pulseSpeed * deltaTime;
    }

    draw(ctx) {
        ctx.save();
        
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        
        // Effet de pulsation de l'obstacle 
        const scale = 1 + Math.sin(this.pulseAnimation) * 0.05;
        ctx.scale(scale, scale);
        
        if (this.imageLoaded) {
            ctx.drawImage(
                this.image,
                -this.width / 2,
                -this.height / 2,
                this.width,
                this.height
            );
        } else {
            // Fallback : carré rouge avec motif or
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
            
            // Motif marocain
            ctx.strokeStyle = '#d4af37';
            ctx.lineWidth = 2;
            ctx.strokeRect(-this.width / 2 + 4, -this.height / 2 + 4, this.width - 8, this.height - 8);
            
            // Croix centrale
            ctx.beginPath();
            ctx.moveTo(-this.width / 4, 0);
            ctx.lineTo(this.width / 4, 0);
            ctx.moveTo(0, -this.height / 4);
            ctx.lineTo(0, this.height / 4);
            ctx.stroke();
        }
        
        ctx.restore();
    }
}